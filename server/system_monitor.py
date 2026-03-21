"""
SystemMonitor — Real-time CPU, RAM, and disk usage for the Pi dashboard.
"""

import psutil


class SystemMonitor:
    """Provides system resource statistics."""

    def __init__(self, disk_path: str = "/"):
        self.disk_path = disk_path

    def get_stats(self) -> dict:
        """Return current CPU, RAM, and disk usage as a dict."""
        cpu_percent = psutil.cpu_percent(interval=0.5)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage(self.disk_path)

        return {
            "cpu": {
                "percent": cpu_percent,
                "cores": psutil.cpu_count(logical=True),
            },
            "ram": {
                "total_mb": round(mem.total / (1024 ** 2)),
                "used_mb": round(mem.used / (1024 ** 2)),
                "percent": mem.percent,
            },
            "disk": {
                "total_gb": round(disk.total / (1024 ** 3), 1),
                "used_gb": round(disk.used / (1024 ** 3), 1),
                "free_gb": round(disk.free / (1024 ** 3), 1),
                "percent": disk.percent,
            },
            "temperature": self._get_temperature(),
        }

    @staticmethod
    def _get_temperature() -> float | None:
        """Attempt to read the Pi CPU temperature."""
        try:
            temps = psutil.sensors_temperatures()
            if "cpu_thermal" in temps:
                return temps["cpu_thermal"][0].current
            # fallback – try reading sysfs directly
            with open("/sys/class/thermal/thermal_zone0/temp") as f:
                return round(int(f.read().strip()) / 1000, 1)
        except Exception:
            return None
