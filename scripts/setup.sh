#!/data/data/com.termux/files/usr/bin/bash
# ==============================================================
# PiOS Hub — One-Command Setup for Termux on Emteria OS
# ==============================================================
set -e

echo "=========================================="
echo "  PiOS Hub — Installer"
echo "=========================================="
echo ""

# -----------------------------------------------
# 1. Update packages & install core dependencies
# -----------------------------------------------
echo "[1/5] Updating Termux packages…"
pkg update -y && pkg upgrade -y

echo "[2/5] Installing QEMU, Python, and utilities…"
pkg install -y \
  qemu-system-aarch64 \
  qemu-utils \
  python \
  python-pip \
  git \
  wget \
  which

# -----------------------------------------------
# 2. Setup project directory
# -----------------------------------------------
PROJECT_DIR="$HOME/pi-vm-manager"
DISK_DIR="$HOME/pi-vm-disks"

echo "[3/5] Setting up project directories…"
mkdir -p "$DISK_DIR"

if [ ! -d "$PROJECT_DIR" ]; then
  echo "  ⚠ Project directory not found at $PROJECT_DIR"
  echo "  Please copy the pi-vm-manager folder to $HOME/"
  echo "  e.g.:  cp -r /sdcard/pi-vm-manager $HOME/"
fi

# -----------------------------------------------
# 3. Python virtual environment
# -----------------------------------------------
echo "[4/5] Setting up Python environment…"
cd "$PROJECT_DIR" 2>/dev/null || cd "$HOME"

if [ ! -d "venv" ]; then
  python -m venv venv
fi
source venv/bin/activate

pip install --upgrade pip
pip install -r "$PROJECT_DIR/server/requirements.txt" 2>/dev/null || \
  pip install flask flask-cors psutil

# -----------------------------------------------
# 4. Done!
# -----------------------------------------------
echo ""
echo "[5/5] Setup complete! ✅"
echo ""
echo "=========================================="
echo "  Next steps:"
echo "=========================================="
echo ""
echo "  1. Place your OS ISOs in: $HOME/pi-vm-disks/"
echo "     • Linux: Alpine ARM ISO (recommended)"
echo "     • Windows: Windows 10/11 ARM ISO"
echo ""
echo "  2. Start PiOS Hub:"
echo "     cd $PROJECT_DIR"
echo "     source venv/bin/activate"
echo "     python server/app.py"
echo ""
echo "  3. Open in browser:"
echo "     http://localhost:8080"
echo ""
echo "=========================================="
