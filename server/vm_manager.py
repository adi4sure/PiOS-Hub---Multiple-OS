"""
VMManager — QEMU-based virtual machine lifecycle management.
Handles creating, starting, stopping, and monitoring VMs.
"""

import json
import os
import signal
import subprocess
import time


class VMManager:
    """Manages QEMU virtual machine processes."""

    # Default VNC base port (5900 + display number)
    VNC_BASE_PORT = 5900

    def __init__(self, disk_dir: str, configs_dir: str):
        self.disk_dir = disk_dir
        self.configs_dir = configs_dir
        self._processes: dict[str, subprocess.Popen] = {}
        self._vm_configs: dict[str, dict] = {}
        self._vnc_ports: dict[str, int] = {}
        self._next_display = 1  # VNC display :1, :2 …

        # Load default configs
        self._load_configs()

    # ------------------------------------------------------------------
    # Configuration helpers
    # ------------------------------------------------------------------

    def _load_configs(self):
        """Load VM JSON configs from configs directory."""
        for fname in os.listdir(self.configs_dir):
            if fname.endswith(".json"):
                path = os.path.join(self.configs_dir, fname)
                with open(path, "r") as f:
                    cfg = json.load(f)
                    self._vm_configs[cfg["name"]] = cfg

    def _build_qemu_cmd(self, cfg: dict, iso_path: str | None = None) -> list[str]:
        """Build the QEMU command-line from a VM config dict."""
        disk_path = os.path.join(self.disk_dir, f"{cfg['name']}.qcow2")
        display_num = self._next_display

        qemu_bin = cfg.get("qemu_binary", "qemu-system-aarch64")
        ram = cfg.get("ram", "2048")
        cpus = cfg.get("cpus", "2")
        accel = cfg.get("accelerator", "tcg")
        machine = cfg.get("machine", "virt")
        cpu_model = cfg.get("cpu_model", "cortex-a72")

        cmd = [
            qemu_bin,
            "-machine", machine,
            "-cpu", cpu_model,
            "-m", str(ram),
            "-smp", str(cpus),
            "-accel", accel,
            "-drive", f"file={disk_path},format=qcow2,if=virtio",
            "-device", "virtio-net-pci,netdev=net0",
            "-netdev", "user,id=net0",
            "-vnc", f":{display_num}",
            "-daemonize",
        ]

        # EFI firmware (if specified)
        efi_path = cfg.get("efi_firmware")
        if efi_path:
            cmd += ["-bios", efi_path]

        # Boot from ISO on first launch
        if iso_path:
            cmd += ["-cdrom", iso_path, "-boot", "d"]

        # Extra flags from config
        for flag in cfg.get("extra_flags", []):
            cmd.append(flag)

        return cmd, display_num

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def list_vms(self) -> list[dict]:
        """Return list of all VMs with running status."""
        vms = []
        # Registered VMs from configs
        for name, cfg in self._vm_configs.items():
            disk_path = os.path.join(self.disk_dir, f"{name}.qcow2")
            vms.append({
                "name": name,
                "type": cfg.get("type", "linux"),
                "status": self._get_status(name),
                "ram": cfg.get("ram", "2048"),
                "cpus": cfg.get("cpus", "2"),
                "disk_exists": os.path.exists(disk_path),
                "vnc_port": self._vnc_ports.get(name),
            })

        # Scan for disks without configs (user-created)
        known = {v["name"] for v in vms}
        if os.path.isdir(self.disk_dir):
            for f in os.listdir(self.disk_dir):
                if f.endswith(".qcow2"):
                    n = f[:-6]
                    if n not in known:
                        vms.append({
                            "name": n,
                            "type": "unknown",
                            "status": self._get_status(n),
                            "ram": "2048",
                            "cpus": "2",
                            "disk_exists": True,
                            "vnc_port": self._vnc_ports.get(n),
                        })
        return vms

    def create_vm(self, name: str, disk_size: str = "4G", vm_type: str = "linux") -> tuple[bool, str]:
        """Create a QCOW2 disk image for a new VM."""
        disk_path = os.path.join(self.disk_dir, f"{name}.qcow2")
        if os.path.exists(disk_path):
            return False, f"Disk for '{name}' already exists."

        try:
            subprocess.run(
                ["qemu-img", "create", "-f", "qcow2", disk_path, disk_size],
                check=True,
                capture_output=True,
                text=True,
            )
        except FileNotFoundError:
            return False, "qemu-img not found. Install QEMU first."
        except subprocess.CalledProcessError as e:
            return False, f"Failed to create disk: {e.stderr}"

        # Create a runtime config if one doesn't exist
        if name not in self._vm_configs:
            cfg_template = "linux-vm.json" if vm_type == "linux" else "windows-vm.json"
            template_path = os.path.join(self.configs_dir, cfg_template)
            if os.path.exists(template_path):
                with open(template_path) as f:
                    cfg = json.load(f)
                cfg["name"] = name
                self._vm_configs[name] = cfg
            else:
                self._vm_configs[name] = {
                    "name": name,
                    "type": vm_type,
                    "qemu_binary": "qemu-system-aarch64",
                    "machine": "virt",
                    "cpu_model": "cortex-a72",
                    "ram": "2048",
                    "cpus": "2",
                    "accelerator": "kvm" if vm_type == "linux" else "tcg",
                }

        return True, f"VM '{name}' created with {disk_size} disk."

    def start_vm(self, name: str, iso_path: str | None = None) -> tuple[bool, str]:
        """Start a VM by name."""
        if name in self._processes and self._processes[name].poll() is None:
            return False, f"VM '{name}' is already running."

        cfg = self._vm_configs.get(name)
        if cfg is None:
            return False, f"No configuration found for VM '{name}'."

        disk_path = os.path.join(self.disk_dir, f"{name}.qcow2")
        if not os.path.exists(disk_path):
            return False, f"Disk image for '{name}' does not exist. Create it first."

        cmd, display_num = self._build_qemu_cmd(cfg, iso_path)

        try:
            proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            # Give it a moment to start
            time.sleep(1)
            if proc.poll() is not None:
                stderr = proc.stderr.read().decode() if proc.stderr else ""
                return False, f"QEMU exited immediately: {stderr}"

            self._processes[name] = proc
            self._vnc_ports[name] = self.VNC_BASE_PORT + display_num
            self._next_display += 1
            return True, f"VM '{name}' started (VNC :{display_num}, port {self._vnc_ports[name]})."

        except FileNotFoundError:
            return False, f"QEMU binary '{cfg.get('qemu_binary')}' not found. Install QEMU."
        except Exception as e:
            return False, f"Failed to start VM: {str(e)}"

    def stop_vm(self, name: str) -> tuple[bool, str]:
        """Stop a running VM gracefully, or force-kill after timeout."""
        proc = self._processes.get(name)
        if proc is None or proc.poll() is not None:
            # Clean up stale entry
            self._processes.pop(name, None)
            self._vnc_ports.pop(name, None)
            return False, f"VM '{name}' is not running."

        try:
            proc.terminate()
            try:
                proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                proc.kill()
                proc.wait(timeout=5)
        except Exception as e:
            return False, f"Error stopping VM: {str(e)}"
        finally:
            self._processes.pop(name, None)
            self._vnc_ports.pop(name, None)

        return True, f"VM '{name}' stopped."

    def delete_vm(self, name: str) -> tuple[bool, str]:
        """Delete a VM disk image (must be stopped)."""
        if name in self._processes and self._processes[name].poll() is None:
            return False, f"VM '{name}' is running. Stop it first."

        disk_path = os.path.join(self.disk_dir, f"{name}.qcow2")
        if os.path.exists(disk_path):
            os.remove(disk_path)

        self._vm_configs.pop(name, None)
        self._processes.pop(name, None)
        self._vnc_ports.pop(name, None)
        return True, f"VM '{name}' deleted."

    def get_vnc_info(self, name: str) -> dict | None:
        """Return VNC connection info for a running VM."""
        port = self._vnc_ports.get(name)
        if port and name in self._processes and self._processes[name].poll() is None:
            return {
                "host": "localhost",
                "port": port,
                "display": port - self.VNC_BASE_PORT,
                "websocket_url": f"ws://localhost:{port}",
            }
        return None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_status(self, name: str) -> str:
        proc = self._processes.get(name)
        if proc and proc.poll() is None:
            return "running"
        return "stopped"
