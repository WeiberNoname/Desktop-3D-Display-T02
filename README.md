# 3D Desktop Mascot Pet 🐰

A borderless, transparent, interactive 3D desktop companion pet for Windows powered by **Electron**, **Three.js**, and **i18next**.

> 📖 **Full User Manual:** For complete guides on controls, custom 3D model loading, FPS camera flight, physics throwing, stage spotlights, Z-axis roll spin, panel edge resizing, dynamic battery saver mode, and 12-language setup, please see **[USER_MANUAL.md](file:///c:/Users/space/.gemini/antigravity-ide/scratch/Desktop-3D-Display-T03/USER_MANUAL.md)**.

---

## 🛠️ How to Rebuild Executable from GitHub Repository

Follow these step-by-step instructions to clone, set up dependencies, run tests, and compile the standalone Windows executable from the source code.

### 1. System Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **Git**: ([Download Git](https://git-scm.com/))
- **Windows OS**: Windows 10 or 11 (x64)

---

### 2. Clone the Repository
Open Command Prompt (`cmd`) or Terminal and clone the repository:
```bash
git clone https://github.com/your-username/desktop-3d-pet.git
cd desktop-3d-pet
```

---

### 3. Install Dependencies
Install all required Node modules (`three`, `i18next`, `@skyatnpm/steamworks-js`, `electron`, `electron-packager`):
```bash
npm install
```

---

## 🌐 Language Localization Prerequisites & Setup

Desktop Pet uses **i18next** to support **12 core mainstream languages** natively across all UI controls, studio tabs, 3D preview viewports, and HUD badges (accounting for >95% of active global desktop users). Unlisted system languages automatically fall back to English (`en`).

### 1. Localization Prerequisites
- **`i18next` Package**: Installed automatically during `npm install` (`"i18next": "^26.3.6"` in `package.json`).
- **Locale Folder Structure**: The application expects translation files in `locales/<lang-code>/translation.json`.

### 2. Generating & Building Locale Files (Mandatory)
Before starting the dev server or packaging the application executable, you **must run the locale generator script**:
```bash
node scratch_create_locales.js
```
This script performs a 100% key parity build across all 12 core language codes:
- Creates `locales/<lang>/translation.json` for all 12 core languages.
- Ensures all **103 UI keys** exist in every language dictionary with fallback protection to guarantee no missing text errors.

### 3. Supported Languages Scope (12 Core Locales)
| Language Code | Language Name |
| :--- | :--- |
| `en` | English |
| `zh-CN` | 简体中文 (Simplified Chinese) |
| `zh-TW` | 繁體中文 (Traditional Chinese) |
| `ja` | 日本語 (Japanese) |
| `ko` | 한국어 (Korean) |
| `fr` | Français (French) |
| `de` | Deutsch (German) |
| `es` | Español - España (Spanish - Spain) |
| `es-419` | Español - Latinoamérica (Spanish - Latin America) |
| `it` | Italiano (Italian) |
| `pt-BR` | Português - Brasil (Portuguese - Brazil) |
| `ru` | Русский (Russian) |

### 4. Adding or Updating Custom Translations
If you add new UI elements or want to edit existing translations:
1. Open `scratch_create_locales.js`.
2. Add or modify translation keys inside `newTranslations`.
3. Run `node scratch_create_locales.js` to propagate the changes to all 12 `translation.json` files.
4. Rebuild the app binary with `npm run build`.

---

## 🚀 Running, Testing & Packaging

### 1. Run & Test in Development Mode
Launch the application in development mode:
```bash
npm start
```
To run the automated unit test suite (SettingsManager & PhysicsEngine tests):
```bash
# Standard Command Prompt / Bash:
npm test

# Direct Node execution (works in all Windows PowerShell environments):
node tests/run_tests.mjs
```

### 2. Build Standalone Production Executable
To package the app into a standalone Windows executable binary (`DesktopPet.exe` inside `DesktopPet-win32-x64/`):
```cmd
# Standard Command Prompt (cmd) / PowerShell (via cmd wrapper):
cmd /c npm run build
```

Alternatively, if building directly via Command Prompt:
```cmd
npx electron-packager . DesktopPet --platform=win32 --arch=x64 --overwrite
```

---

### ⚠️ PowerShell Script Execution Policy Troubleshooting

If running `npm run build` or `npm test` inside PowerShell returns an execution policy restriction error:
> *npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.*

**Solution Option A (Recommended):** Wrap command execution with standard Windows Command Prompt (`cmd`):
```cmd
cmd /c npm run build
cmd /c npm test
```

**Solution Option B:** Temporarily bypass script execution policy in PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
npm run build
```

---

## 📁 Output Build Artifacts

After running `npm run build`, the production output will be generated at:
```
DesktopPet-win32-x64/
  ├── DesktopPet.exe         <-- Standalone executable
  ├── resources/app/         <-- Bundled source code & assets
  ├── steam_appid.txt        <-- Steam integration configuration
  └── ...
```
Double-click `DesktopPet.exe` to launch the standalone application!

---

## 🏗️ Codebase Architecture & Modular Structure

The project follows a modular, decoupled domain structure designed for performance, maintainability, and clean separation of concerns:

```
src/
├── core/                       <-- 3D WebGL & Application Core
│   ├── AnimationLoopManager.js <-- Main RAF render loop manager
│   ├── AppInitializer.js       <-- Application bootstrap & WebGL setup
│   ├── AppStateContainer.js    <-- Centralized state store proxy
│   ├── LightingManager.js      <-- Multi-source stage spotlight controls
│   ├── MascotBuilder.js        <-- Procedural 3D mesh fallback builder
│   ├── ModelLoader.js          <-- GLTF/GLB asset importer & bounding box parser
│   └── ...
├── managers/                   <-- State & Persistence Managers
│   └── SettingsManager.js      <-- Atomic settings JSON staging & config healing
├── main/                       <-- Electron Main Process Services
│   ├── Logger.js               <-- File log streams
│   └── SteamService.js         <-- Steamworks API wrapper
└── ui/                         <-- Studio UI & Viewport Controls
    ├── PreviewViewportEngine.js<-- Secondary WebGL preview canvas renderer
    ├── SettingsPanelResizeHandler.js <-- Settings panel edge drag-to-resize handler
    ├── SettingsPanelUI.js      <-- 6-tab studio control suite UI
    ├── SpotlightCardsUI.js     <-- Real-time spotlight card visualizers
    └── ...
```

---

## 🤖 AI Companion Readiness & Expansion Roadmap

While Desktop Pet is currently a 100% deterministic 3D desktop graphics engine, its decoupled IPC architecture, transparent overlay, dynamic GLTF animation mixer, and WebGL rendering pipeline serve as an ideal foundation for an **AI Agent Companion Avatar**:

- **Phase 1 (Conversational Brain)**: Connect local LLM servers (e.g. Ollama, Llama.cpp) or Cloud APIs (Gemini, OpenAI) for dialogue.
- **Phase 2 (Voice & Lip-Sync)**: Integrate Whisper STT and Kokoro/Piper TTS with Three.js morph-target viseme animation drivers.
- **Phase 3 (Vision Perception)**: Implement periodic desktop screen capture via Electron `desktopCapturer` passed to Vision-Language Models (VLMs).
- **Phase 4 (Autonomous Agent Loop)**: Replace fixed bobbing with an AI emotional state machine and desktop tool-calling capabilities.

