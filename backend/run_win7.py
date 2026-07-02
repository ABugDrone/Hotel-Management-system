import sys
import os
import threading
import time
import urllib.request
import webbrowser

if getattr(sys, "frozen", False):
    os.environ["AMIRABLE_BASE_DIR"] = sys._MEIPASS
else:
    os.environ["AMIRABLE_BASE_DIR"] = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

import uvicorn


def wait_for_server(url, timeout=60):
    for _ in range(timeout):
        try:
            urllib.request.urlopen(url, timeout=2)
            return True
        except Exception:
            time.sleep(1)
    return False


if __name__ == "__main__":
    print("=" * 55)
    print("  Amirable Hotel Management System")
    print("  Starting server...")
    print("=" * 55)

    port = 8000
    thread = threading.Thread(
        target=lambda: uvicorn.run(
            "backend.main:app",
            host="127.0.0.1",
            port=port,
            log_level="warning",
        ),
        daemon=True,
    )
    thread.start()

    url = f"http://127.0.0.1:{port}"
    if wait_for_server(f"{url}/health"):
        print(f"\n  Server ready at: {url}")
        print("  Opening browser...\n")
        webbrowser.open(url)
    else:
        print("\n  ERROR: Server failed to start in time.")
        print("  Check firewall or port availability.\n")
        input("Press Enter to exit...")
        sys.exit(1)

    print("  Press Ctrl+C to stop the server.\n")
    try:
        while thread.is_alive():
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n  Shutting down...")
