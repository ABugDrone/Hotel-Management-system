import asyncio
import threading
import time
import sys
import os
import urllib.request
import uvicorn
from uvicorn.config import Config
from uvicorn.server import Server
import webview


class UvicornThread(threading.Thread):
    def __init__(self, host="127.0.0.1", port=8000):
        super().__init__(daemon=True)
        self.host = host
        self.port = port
        self.server = None
        self.ready = threading.Event()
        self.error = None

    def run(self):
        try:
            config = Config(
                "backend.main:app",
                host=self.host,
                port=self.port,
                log_level="warning",
            )
            self.server = Server(config)
            self.ready.set()
            asyncio.run(self.server.serve())
        except Exception as e:
            self.error = e
            self.ready.set()

    def stop(self):
        if self.server:
            self.server.should_exit = True


def wait_for_server(url, timeout=15):
    for _ in range(timeout):
        try:
            urllib.request.urlopen(url, timeout=1)
            return True
        except Exception:
            time.sleep(1)
    return False


def get_icon():
    base = os.environ.get("AMIRABLE_BASE_DIR") or (
        sys._MEIPASS if getattr(sys, "frozen", False)
        else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )
    icon_path = os.path.join(base, "icon.ico")
    return icon_path if os.path.exists(icon_path) else None


if __name__ == "__main__":
    if getattr(sys, "frozen", False):
        os.environ["AMIRABLE_BASE_DIR"] = sys._MEIPASS

    server_thread = UvicornThread()
    server_thread.start()
    server_thread.ready.wait()

    if server_thread.error:
        import ctypes
        ctypes.windll.user32.MessageBoxW(
            0, f"Failed to start server:\n{server_thread.error}",
            "Amirable Error", 0x10
        )
        sys.exit(1)

    if not wait_for_server("http://127.0.0.1:8000/health"):
        import ctypes
        ctypes.windll.user32.MessageBoxW(
            0, "Server did not become ready in time.",
            "Amirable Error", 0x10
        )
        sys.exit(1)

    webview.create_window(
        "Amirable Hotel Management",
        "http://127.0.0.1:8000",
        width=1280,
        height=800,
        resizable=True,
        min_size=(900, 600),
    )

    webview.start(
        gui="edgechromium",
        debug=False,
        icon=get_icon(),
        private_mode=False,
    )

    server_thread.stop()
