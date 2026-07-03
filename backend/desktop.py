import sys
import os
import threading
import time
import asyncio
import urllib.request
import ctypes
import uvicorn
from uvicorn.config import Config
from uvicorn.server import Server
import webview


def _msgbox(title, message, icon=0x10):
    ctypes.windll.user32.MessageBoxW(0, message, title, icon)


def _global_exc_hook(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    _msgbox("Amirable Error", f"An unexpected error occurred.\n\n{exc_type.__name__}: {exc_value}")

sys.excepthook = _global_exc_hook


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
                loop="asyncio",
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


def wait_for_server(url, timeout=60):
    for _ in range(timeout):
        try:
            urllib.request.urlopen(url, timeout=2)
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
        _msgbox("Amirable Error", f"Failed to start server:\n{server_thread.error}")
        sys.exit(1)

    if not wait_for_server("http://127.0.0.1:8000/health"):
        _msgbox("Amirable Error", "Server did not become ready within 60 seconds.\nThis may indicate a port conflict or slow hardware.")
        sys.exit(1)

    try:
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
    except Exception as e:
        _msgbox("Amirable Error", f"Application window error:\n{e}")
    finally:
        server_thread.stop()
