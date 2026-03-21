/**
 * PiOS Hub — Frontend Logic
 * Handles API calls, VM state management, and UI updates.
 */

(() => {
  "use strict";

  // ================================================================
  // Configuration
  // ================================================================
  const API_BASE = window.location.origin;
  const POLL_INTERVAL = 3000; // ms

  // ================================================================
  // DOM References
  // ================================================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    // Stats
    ringCpu:  $("#ring-cpu"),
    ringRam:  $("#ring-ram"),
    ringDisk: $("#ring-disk"),
    valCpu:   $("#val-cpu"),
    valRam:   $("#val-ram"),
    valDisk:  $("#val-disk"),
    valTemp:  $("#val-temp"),

    // VM grid
    vmGrid:       $("#vm-grid"),
    vmEmptyState: $("#vm-empty-state"),

    // Log
    logOutput:  $("#log-output"),
    btnClearLog:$("#btn-clear-log"),

    // Modal
    modalOverlay:   $("#modal-overlay"),
    vmName:         $("#vm-name"),
    vmDiskSize:     $("#vm-disk-size"),
    btnCreateVm:    $("#btn-create-vm"),
    btnCloseModal:  $("#btn-close-modal"),
    btnCancelModal: $("#btn-cancel-modal"),
    btnConfirmCreate: $("#btn-confirm-create"),

    // Type selector
    typeLinux:   $("#type-linux"),
    typeWindows: $("#type-windows"),

    // Top bar
    btnRefresh: $("#btn-refresh"),
    btnAndroid: $("#btn-android"),

    // Toasts
    toastContainer: $("#toast-container"),
  };

  // ================================================================
  // State
  // ================================================================
  let selectedType = "linux";
  let vms = [];
  let connected = false;
  let wasConnected = false;

  // ================================================================
  // API Helpers
  // ================================================================
  async function api(endpoint, options = {}, silent = false) {
    try {
      const url = `${API_BASE}${endpoint}`;
      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      const data = await res.json();
      // Mark as connected on first successful response
      if (!connected) {
        connected = true;
        wasConnected = true;
        log("✅ Connected to PiOS Hub backend.");
        toast("Backend connected", "success");
        updateConnectionBadge();
      }
      return data;
    } catch (err) {
      // Only log disconnect once, suppress repeated poll errors
      if (connected || !wasConnected) {
        if (connected) {
          log("⚠️ Lost connection to backend.");
          toast("Backend disconnected", "error");
        } else if (!wasConnected && !silent) {
          // First-ever attempt failed — log once
          log("⏳ Waiting for backend… start the server with: python server/app.py");
        }
        connected = false;
        updateConnectionBadge();
      }
      return null;
    }
  }

  function updateConnectionBadge() {
    let badge = $("#conn-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.id = "conn-badge";
      $(".topbar__brand").appendChild(badge);
    }
    if (connected) {
      badge.className = "topbar__badge topbar__badge--online";
      badge.textContent = "● Online";
    } else {
      badge.className = "topbar__badge topbar__badge--offline";
      badge.textContent = "○ Offline";
    }
  }

  // ================================================================
  // System Stats
  // ================================================================
  const CIRCUMFERENCE = 2 * Math.PI * 34; // ring radius = 34

  function setRing(el, pct) {
    if (!el) return;
    const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
    el.style.strokeDashoffset = offset;
  }

  async function fetchStats() {
    const data = await api("/api/status", {}, true);
    if (!data) return;

    const cpuPct  = Math.round(data.cpu?.percent  ?? 0);
    const ramPct  = Math.round(data.ram?.percent  ?? 0);
    const diskPct = Math.round(data.disk?.percent ?? 0);

    setRing(dom.ringCpu,  cpuPct);
    setRing(dom.ringRam,  ramPct);
    setRing(dom.ringDisk, diskPct);

    dom.valCpu.textContent  = `${cpuPct}%`;
    dom.valRam.textContent  = `${ramPct}%`;
    dom.valDisk.textContent = `${diskPct}%`;

    if (data.temperature != null) {
      dom.valTemp.textContent = `${data.temperature}°C`;
    } else {
      dom.valTemp.textContent = "—";
    }
  }

  // ================================================================
  // VM List
  // ================================================================
  async function fetchVMs() {
    const data = await api("/api/vms", {}, true);
    if (!data) return;
    vms = data;
    renderVMCards();
  }

  function renderVMCards() {
    // Remove existing vm cards (keep empty state marker)
    dom.vmGrid.querySelectorAll(".vm-card:not(.vm-card--empty)").forEach((c) => c.remove());

    if (vms.length === 0) {
      dom.vmEmptyState.style.display = "";
      return;
    }
    dom.vmEmptyState.style.display = "none";

    vms.forEach((vm, i) => {
      const card = document.createElement("div");
      card.className = `vm-card${vm.status === "running" ? " vm-card--running" : ""}`;
      card.style.animationDelay = `${i * 0.08}s`;

      const isLinux = vm.type === "linux";
      const icon = isLinux ? "🐧" : "🪟";
      const iconClass = isLinux ? "vm-card__icon--linux" : "vm-card__icon--windows";

      card.innerHTML = `
        <div class="vm-card__header">
          <div class="vm-card__icon ${iconClass}">${icon}</div>
          <span class="vm-card__name">${escHTML(vm.name)}</span>
          <span class="vm-card__status vm-card__status--${vm.status}">${vm.status}</span>
        </div>
        <div class="vm-card__meta">
          <span>💾 ${vm.ram} MB</span>
          <span>🔲 ${vm.cpus} vCPU</span>
          ${vm.vnc_port ? `<span>🖥 VNC :${vm.vnc_port - 5900}</span>` : ""}
        </div>
        <div class="vm-card__actions">
          ${vm.status === "stopped"
            ? `<button class="btn btn--success btn--sm" onclick="PiOS.startVM('${escAttr(vm.name)}')">▶ Start</button>`
            : `<button class="btn btn--danger btn--sm" onclick="PiOS.stopVM('${escAttr(vm.name)}')">⏹ Stop</button>`
          }
          ${vm.status === "running" && vm.vnc_port
            ? `<button class="btn btn--ghost btn--sm" onclick="PiOS.openVNC('${escAttr(vm.name)}')">🖥 VNC</button>`
            : ""
          }
          ${vm.status === "stopped"
            ? `<button class="btn btn--ghost btn--sm" onclick="PiOS.deleteVM('${escAttr(vm.name)}')">🗑 Delete</button>`
            : ""
          }
        </div>`;

      dom.vmGrid.appendChild(card);
    });
  }

  // ================================================================
  // VM Actions
  // ================================================================
  async function startVM(name) {
    log(`▶ Starting VM "${name}"…`);
    const res = await api(`/api/vms/${encodeURIComponent(name)}/start`, { method: "POST" });
    if (res?.success) {
      toast(`VM "${name}" started`, "success");
      log(`✅ ${res.message}`);
    } else {
      toast(res?.message || "Failed to start", "error");
      log(`❌ ${res?.message || "Failed"}`);
    }
    fetchVMs();
  }

  async function stopVM(name) {
    log(`⏹ Stopping VM "${name}"…`);
    const res = await api(`/api/vms/${encodeURIComponent(name)}/stop`, { method: "POST" });
    if (res?.success) {
      toast(`VM "${name}" stopped`, "success");
      log(`✅ ${res.message}`);
    } else {
      toast(res?.message || "Failed to stop", "error");
      log(`❌ ${res?.message || "Failed"}`);
    }
    fetchVMs();
  }

  async function deleteVM(name) {
    if (!confirm(`Delete VM "${name}" and its disk image? This cannot be undone.`)) return;
    log(`🗑 Deleting VM "${name}"…`);
    const res = await api(`/api/vms/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res?.success) {
      toast(`VM "${name}" deleted`, "success");
      log(`✅ ${res.message}`);
    } else {
      toast(res?.message || "Failed to delete", "error");
      log(`❌ ${res?.message || "Failed"}`);
    }
    fetchVMs();
  }

  async function createVM() {
    const name = dom.vmName.value.trim();
    if (!name) {
      toast("Please enter a VM name", "error");
      return;
    }
    const diskSize = dom.vmDiskSize.value;
    log(`📦 Creating VM "${name}" (${selectedType}, ${diskSize})…`);
    closeModal();

    const res = await api(`/api/vms/${encodeURIComponent(name)}/create`, {
      method: "POST",
      body: JSON.stringify({ disk_size: diskSize, type: selectedType }),
    });

    if (res?.success) {
      toast(`VM "${name}" created`, "success");
      log(`✅ ${res.message}`);
    } else {
      toast(res?.message || "Failed to create", "error");
      log(`❌ ${res?.message || "Failed"}`);
    }
    dom.vmName.value = "";
    fetchVMs();
  }

  function openVNC(name) {
    const vm = vms.find((v) => v.name === name);
    if (!vm || !vm.vnc_port) {
      toast("VNC not available", "error");
      return;
    }
    // Open noVNC viewer or raw VNC client
    const url = `http://${window.location.hostname}:${vm.vnc_port}`;
    toast(`VNC on port ${vm.vnc_port}. Connect with a VNC viewer.`, "info");
    log(`🖥 VNC for "${name}" available at port ${vm.vnc_port}`);
  }

  // ================================================================
  // Modal
  // ================================================================
  function openModal() {
    dom.modalOverlay.classList.add("modal-overlay--active");
    dom.vmName.focus();
  }

  function closeModal() {
    dom.modalOverlay.classList.remove("modal-overlay--active");
  }

  // ================================================================
  // Logging
  // ================================================================
  function log(msg) {
    const ts = new Date().toLocaleTimeString();
    dom.logOutput.textContent += `[${ts}] ${msg}\n`;
    dom.logOutput.parentElement.scrollTop = dom.logOutput.parentElement.scrollHeight;
  }

  function clearLog() {
    dom.logOutput.textContent = "";
    log("Log cleared.");
  }

  // ================================================================
  // Toast
  // ================================================================
  function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.textContent = message;
    dom.toastContainer.appendChild(el);

    setTimeout(() => {
      el.style.animation = "toastOut 0.3s ease forwards";
      el.addEventListener("animationend", () => el.remove());
    }, 3500);
  }

  // ================================================================
  // Utilities
  // ================================================================
  function escHTML(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }
  function escAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
  }

  // ================================================================
  // "Return to Android" (close VMs and exit)
  // ================================================================
  function returnToAndroid() {
    if (!confirm("Stop all VMs and return to Android?")) return;
    log("🏠 Returning to Android… stopping all VMs.");
    toast("Stopping VMs and returning to Android…", "info");
    // Stop all running VMs
    const running = vms.filter((v) => v.status === "running");
    Promise.all(running.map((v) =>
      api(`/api/vms/${encodeURIComponent(v.name)}/stop`, { method: "POST" })
    )).then(() => {
      log("✅ All VMs stopped. You can close this browser tab.");
      toast("All VMs stopped. Return to Android home screen.", "success");
    });
  }

  // ================================================================
  // Event Listeners
  // ================================================================
  function bindEvents() {
    dom.btnCreateVm.addEventListener("click", openModal);
    dom.btnCloseModal.addEventListener("click", closeModal);
    dom.btnCancelModal.addEventListener("click", closeModal);
    dom.btnConfirmCreate.addEventListener("click", createVM);
    dom.btnClearLog.addEventListener("click", clearLog);
    dom.btnRefresh.addEventListener("click", () => { fetchStats(); fetchVMs(); });
    dom.btnAndroid.addEventListener("click", returnToAndroid);

    // Modal overlay click to close
    dom.modalOverlay.addEventListener("click", (e) => {
      if (e.target === dom.modalOverlay) closeModal();
    });

    // ESC to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    // Type selector
    dom.typeLinux.addEventListener("click", () => setType("linux"));
    dom.typeWindows.addEventListener("click", () => setType("windows"));
  }

  function setType(type) {
    selectedType = type;
    dom.typeLinux.classList.toggle("type-btn--active", type === "linux");
    dom.typeWindows.classList.toggle("type-btn--active", type === "windows");
  }

  // ================================================================
  // Polling
  // ================================================================
  function startPolling() {
    fetchStats();
    fetchVMs();
    setInterval(fetchStats, POLL_INTERVAL);
    setInterval(fetchVMs, POLL_INTERVAL * 2);
  }

  // ================================================================
  // Init
  // ================================================================
  function init() {
    bindEvents();
    log("🔌 Connecting to PiOS Hub backend…");
    updateConnectionBadge();
    startPolling();
  }

  // Expose public API for inline onclick handlers
  window.PiOS = { startVM, stopVM, deleteVM, openVNC };

  // Go!
  document.addEventListener("DOMContentLoaded", init);
})();
