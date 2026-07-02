# -*- mode: python ; coding: utf-8 -*-
# PyInstaller spec for Amirable Hotel Management System
# Bundles Python backend + React frontend into a native desktop app (WebView2)

import sys
from PyInstaller.utils.hooks import collect_data_files, collect_submodules

a = Analysis(
    ['backend/desktop.py'],
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
        'uvicorn.supervisors',
        'uvicorn._subprocess',
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
        'webview',
        'webview.platforms',
        'webview.platforms.edgechromium',
    ] + collect_submodules('backend'),
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'PyQt5',
        'PySide2',
        'PySide6',
        'matplotlib',
        'numpy',
        'scipy',
        'pandas',
        'PIL',
        'cv2',
        'torch',
        'tensorflow',
        'notebook',
        'jupyter',
        'IPython',

        'test',
        'unittest',
    ],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='AmirableHM',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    contents_directory='.',
)

COLLECT(
    exe,
    a.binaries,
    a.datas,
    [],
    name='AmirableHM',
)
