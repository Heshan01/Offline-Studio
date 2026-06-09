# Local Compilation & Packaging Guide

This guide details how to run the Video Compressor application in local development mode and compile it into a standalone, 100% offline desktop application (`.exe` or `.app`).

---

## 1. Prerequisites

Before starting, ensure your local development machine has the following tools installed:

1. **Node.js**: Version 18.0.0 or higher.
2. **Python**: Version 3.8 or higher.
3. **FFmpeg**: Installed and added to your system's Environment Variables (`PATH`).
   - *To verify FFmpeg is in path, open a terminal and run:* `ffmpeg -version`

---

## 2. Local Development Setup

To test and run the application locally without compiling it first:

1. **Install Node Packages**:
   Open a terminal in the project root directory and run:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   Launch the concurrent development environment (starts Vite + launches Electron):
   ```bash
   npm run electron:dev
   ```
   *During development, Electron runs the Python code directly as a script (`backend/app_engine.py`) using the local `python` command.*

---

## 3. Step 1: Package the Python Compressor Engine

To make the app standalone, you must compile the Python script into a native executable so the user doesn't need Python installed.

1. **Install PyInstaller**:
   ```bash
   pip install pyinstaller
   ```

2. **Compile backend/app_engine.py**:
   Run the compilation command in your terminal. We output the binary to a dedicated sub-folder (`backend/dist/app_engine`) so that it is isolated from the React frontend build artifacts:
   ```bash
   pyinstaller --onefile --distpath backend/dist/app_engine backend/app_engine.py
   ```
   - This creates:
     - Windows: `backend/dist/app_engine/app_engine.exe`
     - macOS/Linux: `backend/dist/app_engine/app_engine`
   - *Note: You can safely delete the generated `build/` folder and `app_engine.spec` file.*

---

## 4. Step 2: Package the Electron Desktop Application

Now that the Python binary is compiled, you can package the React frontend and the Electron shell together.

1. **Build and Package**:
   Run the following command in the project root directory:
   ```bash
   npm run package
   ```

2. **What this command does**:
   - Compiles the React frontend using Vite into static HTML/JS/CSS assets inside `/dist`.
   - Invokes `electron-builder` to package the app.
   - Copies the PyInstaller binary from `backend/dist/app_engine` to the Electron application package resources using the `extraResources` configuration in `package.json`.
   - Packages the application into a single executable installer inside the `/release` folder.

3. **Output Artifacts**:
   - Look in the `/release` folder.
   - On Windows, you will find a portable executable named: `Offline Video Compressor <version>.exe`.
   - On macOS, you will find a `.dmg` image containing the application.

---

## 5. Bundling FFmpeg (Optional Production Standard)

To make the desktop application *completely* self-contained (so the end user does not need to install FFmpeg on their system), you can bundle FFmpeg inside the app:

1. Download the static binary of FFmpeg for your OS.
2. Place the `ffmpeg` binary inside a new folder, e.g., `bin/`.
3. Modify the command execution inside `backend/app_engine.py` to point to this local `bin/ffmpeg` relative path instead of relying on the global system binary.
4. Add the `bin/` directory to the `extraResources` array in your `package.json` so Electron bundles it during the build process.
