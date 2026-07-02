# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for Amirable Hotel Management System
# Windows 7 compatible — server-only, opens browser (no WebView2/CEF)

from PyInstaller.utils.hooks import collect_submodules

a = Analysis(
    ['backend/run_win7.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('frontend/dist', 'frontend/dist'),
        ('frontend/config.prod.json', 'config.json'),
    ],
    hiddenimports=[
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.server',
        'uvicorn.config',
        'fastapi',
        'fastapi.routing',
        'fastapi.openapi',
        'fastapi.openapi.utils',
        'pydantic',
        'pydantic.fields',
        'pydantic.main',
        'starlette',
        'starlette.routing',
        'starlette.middleware',
        'starlette.middleware.cors',
        'starlette.staticfiles',
        'starlette.responses',
        'starlette.requests',
        'starlette.datastructures',
        'starlette.background',
        'sqlalchemy',
        'sqlalchemy.ext.asyncio',
        'aiosqlite',
        'jwt',
        'bcrypt',
        'multipart',
    ] + collect_submodules('backend'),
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter', 'PyQt5', 'PySide2', 'PySide6',
        'matplotlib', 'numpy', 'scipy', 'pandas', 'PIL',
        'cv2', 'torch', 'tensorflow',
        'notebook', 'jupyter', 'IPython',
        'test', 'unittest',
        'webview', 'cefpython3',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz, a.scripts, a.binaries, a.datas, [],
    name='AmirableHM_Win7',
    debug=False,
    strip=False,
    upx=True,
    console=True,
)

COLLECT(exe, a.binaries, a.datas, [], name='AmirableHM_Win7')
