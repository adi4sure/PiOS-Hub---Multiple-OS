"""
PiOS Hub — Flask Server
Manages QEMU virtual machines on Raspberry Pi 5 running Emteria OS.
"""

import os
import json
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from vm_manager import VMManager
from system_monitor import SystemMonitor

# ---------------------------------------------------------------------------
# App configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
CLIENT_DIST_DIR = os.path.join(PROJECT_DIR, "client", "dist")
CONFIGS_DIR = os.path.join(PROJECT_DIR, "configs")
VM_DISK_DIR = os.path.expanduser("~/pi-vm-disks")

app = Flask(__name__, static_folder=CLIENT_DIST_DIR)
CORS(app)

# Ensure disk directory exists
os.makedirs(VM_DISK_DIR, exist_ok=True)

# Initialise managers
vm_manager = VMManager(VM_DISK_DIR, CONFIGS_DIR)
sys_monitor = SystemMonitor()

# ---------------------------------------------------------------------------
# Frontend serving (React SPA)
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return send_from_directory(CLIENT_DIST_DIR, "index.html")


@app.route("/<path:path>")
def static_files(path):
    # Serve static assets; fall back to index.html for SPA client-side routing
    full_path = os.path.join(CLIENT_DIST_DIR, path)
    if os.path.isfile(full_path):
        return send_from_directory(CLIENT_DIST_DIR, path)
    return send_from_directory(CLIENT_DIST_DIR, "index.html")

# ---------------------------------------------------------------------------
# System status API
# ---------------------------------------------------------------------------

@app.route("/api/status")
def system_status():
    """Return real-time CPU, RAM, and disk usage."""
    return jsonify(sys_monitor.get_stats())

# ---------------------------------------------------------------------------
# VM management API
# ---------------------------------------------------------------------------

@app.route("/api/vms")
def list_vms():
    """List all configured VMs and their current states."""
    return jsonify(vm_manager.list_vms())


@app.route("/api/vms/<name>/start", methods=["POST"])
def start_vm(name):
    """Start a VM by name."""
    iso_path = request.json.get("iso_path") if request.json else None
    ok, msg = vm_manager.start_vm(name, iso_path=iso_path)
    status_code = 200 if ok else 400
    return jsonify({"success": ok, "message": msg}), status_code


@app.route("/api/vms/<name>/stop", methods=["POST"])
def stop_vm(name):
    """Stop a running VM."""
    ok, msg = vm_manager.stop_vm(name)
    status_code = 200 if ok else 400
    return jsonify({"success": ok, "message": msg}), status_code


@app.route("/api/vms/<name>/create", methods=["POST"])
def create_vm(name):
    """Create a new VM disk image."""
    data = request.json or {}
    size = data.get("disk_size", "4G")
    vm_type = data.get("type", "linux")
    ok, msg = vm_manager.create_vm(name, disk_size=size, vm_type=vm_type)
    status_code = 200 if ok else 400
    return jsonify({"success": ok, "message": msg}), status_code


@app.route("/api/vms/<name>", methods=["DELETE"])
def delete_vm(name):
    """Delete a VM and its disk image."""
    ok, msg = vm_manager.delete_vm(name)
    status_code = 200 if ok else 400
    return jsonify({"success": ok, "message": msg}), status_code


@app.route("/api/vms/<name>/vnc")
def vnc_info(name):
    """Return VNC connection details for a running VM."""
    info = vm_manager.get_vnc_info(name)
    if info:
        return jsonify(info)
    return jsonify({"error": "VM not running or VNC unavailable"}), 404

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n🚀  PiOS Hub starting on http://localhost:8080\n")
    app.run(host="0.0.0.0", port=8080, debug=False)
