# PiOS Hub 🚀

A polished, glassmorphism-themed VM manager dashboard for the **Raspberry Pi 5**, running inside Termux on Emteria OS (Android). Manage QEMU-based Linux and Windows ARM virtual machines from a modern React web interface served by Flask.

## 🌐 Live Demo

> **Try the UI right now — no setup required!**
>
> 👉 **[Launch PiOS Hub UI](https://adi4sure.github.io/PiOS-Hub---Multiple-OS/)** 👈
>
> _(This is a static preview of the frontend. VM operations require the Flask backend running on a Raspberry Pi.)_

---

## Features

- 🐧 **Linux VM management** — Alpine, Debian, Ubuntu ARM images via QEMU/KVM
- 🪟 **Windows VM management** — Windows 10/11 ARM via QEMU TCG
- 📊 **Live system stats** — CPU %, RAM, disk, and Pi CPU temperature
- 🖥 **VNC access** — built-in VNC port linking per running VM
- 🏠 **Return to Android** — gracefully stop all VMs and return to Emteria
- 🌙 **Dark glassmorphism theme** — particle background, animated VM cards

## Project Structure

```
defaultbuild/
├── client/          # React + Vite frontend (served as built SPA)
│   ├── src/
│   │   ├── components/  # TopBar, StatsBar, VMGrid, VMCard, CreateVMModal, etc.
│   │   └── hooks/       # useApi, useSystemStats, useVMs
│   └── dist/        # Production build output (auto-generated)
├── server/          # Flask backend
│   ├── app.py           # REST API + SPA serving
│   ├── vm_manager.py    # QEMU lifecycle (create/start/stop/delete)
│   ├── system_monitor.py# CPU/RAM/disk/temperature stats
│   └── requirements.txt
├── configs/         # VM JSON templates
│   ├── linux-vm.json
│   └── windows-vm.json
├── scripts/
│   ├── setup.sh     # One-time Termux installer
│   └── start.sh     # Launch script (builds frontend if needed)
└── pios-hub.service # systemd unit (for Raspberry Pi OS)
```

## Quick Start (Termux on Emteria OS)

### 1. One-time Setup

```bash
bash scripts/setup.sh
```

This installs QEMU, Python, pip, and all Python dependencies.

### 2. Build the React Frontend

```bash
cd client
npm install
npm run build
cd ..
```

### 3. Launch PiOS Hub

```bash
bash scripts/start.sh
```

Then open **http://localhost:8080** in your browser.

> **Tip:** On Emteria OS, open the Chromium/browser app and navigate to `http://localhost:8080`.

---

## Development Mode

To run with hot-reload frontend and Flask backend:

**Terminal 1 — Backend:**
```bash
source venv/bin/activate
python server/app.py
```

**Terminal 2 — Frontend dev server:**
```bash
cd client
npm run dev
```

Then open **http://localhost:5173** (Vite proxies `/api` requests to port 8080).

---

## Production Deployment (Raspberry Pi OS / systemd)

```bash
# Install the service file
sudo cp pios-hub.service /etc/systemd/system/
# Edit User= and paths in the service file to match your setup
sudo systemctl daemon-reload
sudo systemctl enable --now pios-hub
```

---

## VM Configuration

Edit `configs/linux-vm.json` and `configs/windows-vm.json` to set:

| Key | Description |
|-----|-------------|
| `ram` | RAM in MB (e.g. `"2048"`) |
| `cpus` | vCPU count |
| `accelerator` | `"kvm"` for Linux, `"tcg"` for Windows |
| `efi_firmware` | Path to `QEMU_EFI.fd` |
| `extra_flags` | Additional QEMU flags |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | System stats (CPU/RAM/disk/temp) |
| GET | `/api/vms` | List all VMs |
| POST | `/api/vms/<name>/create` | Create VM disk (`disk_size`, `type`) |
| POST | `/api/vms/<name>/start` | Start VM (optional `iso_path`) |
| POST | `/api/vms/<name>/stop` | Stop VM |
| DELETE | `/api/vms/<name>` | Delete VM and disk |
| GET | `/api/vms/<name>/vnc` | VNC connection info |

---

## Requirements

- Raspberry Pi 5 (8 GB RAM recommended)
- Termux or Raspberry Pi OS
- QEMU (`qemu-system-aarch64`, `qemu-utils`)
- Python 3.11+
- Node.js 18+ (for building the frontend)




Made By Aditya Raj Chourassia...!!!
{Copyright policies Enabled}
