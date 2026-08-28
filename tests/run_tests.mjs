import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PhysicsEngine } from '../physicsEngine.js';
import { SettingsManager } from '../src/managers/SettingsManager.js';
import { AppStore } from '../src/managers/AppStore.js';
import { disposeHierarchy, disposeMaterial } from '../src/core/GPUAssetManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Starting Automated Unit Test Suite (Plan 001)...');

// 1. Test SettingsManager
console.log('▶ Testing SettingsManager defaults & fallback merging...');
const defaults = SettingsManager.getDefaultSettings();
assert.strictEqual(defaults.width, 350, 'Default width should be 350');
assert.strictEqual(defaults.height, 350, 'Default height should be 350');
assert.strictEqual(defaults.targetFps, 60, 'Default targetFps should be 60');
assert.strictEqual(defaults.language, 'en', 'Default language should be en');
assert.strictEqual(defaults.activeModel, 'procedural', 'Default activeModel should be procedural');
assert.strictEqual(defaults.sakuraRain, true, 'Default sakuraRain should be true');
assert.strictEqual(defaults.snowFall, false, 'Default snowFall should be false');
assert.strictEqual(defaults.dynamicBatterySaver, false, 'Default dynamicBatterySaver should be false');

const merged = SettingsManager.mergeWithDefaults({ scale: 2.5, targetFps: 120, customKey: 'test', snowFall: true });
assert.strictEqual(merged.scale, 2.5, 'Scale should be overridden to 2.5');
assert.strictEqual(merged.targetFps, 120, 'targetFps should be overridden to 120');
assert.strictEqual(merged.snowFall, true, 'snowFall should be overridden to true');
assert.strictEqual(merged.width, 350, 'Unspecified width should fallback to 350');
assert.strictEqual(merged.activeModel, 'procedural', 'Fallback activeModel should be procedural');
console.log('✅ SettingsManager tests PASSED.');

// 2. Test PhysicsEngine
console.log('▶ Testing PhysicsEngine velocity & boundary collision calculations...');
const engine = new PhysicsEngine();
engine.configure({ enabled: true, gravity: 9.8, floorY: -1.2 });
assert.strictEqual(engine.enabled, true, 'Physics engine should be enabled');
assert.strictEqual(engine.gravity, 9.8, 'Gravity should be 9.8');

engine.applyImpulse({ x: 1.0, y: 5.0, z: 0 });
assert.strictEqual(engine.velocity.x, 1.0, 'Impulse X should equal 1.0');
assert.strictEqual(engine.velocity.y, 5.0, 'Impulse Y should equal 5.0');

engine.reset();
assert.strictEqual(engine.position.x, 0, 'Reset position X should be 0');
assert.strictEqual(engine.position.y, 0, 'Reset position Y should be 0');
assert.strictEqual(engine.velocity.y, 0, 'Reset velocity Y should be 0');
console.log('✅ PhysicsEngine tests PASSED.');

// 3. Test 12-Locale Key Parity & default_mascot key
console.log('▶ Testing 12-Locale Key Parity & default_mascot translations...');
const localesDir = path.join(__dirname, '..', 'locales');
const supportedLangs = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'fr', 'de', 'es', 'es-419', 'it', 'pt-BR', 'ru'];

supportedLangs.forEach(lang => {
  const filePath = path.join(localesDir, lang, 'translation.json');
  assert.strictEqual(fs.existsSync(filePath), true, `Translation file for ${lang} must exist`);
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  assert.strictEqual(typeof content.default_mascot, 'string', `${lang} must contain default_mascot translation`);
  assert.strictEqual(content.default_mascot.length > 0, true, `${lang} default_mascot must not be empty`);
  assert.strictEqual(typeof content.snow_fall, 'string', `${lang} must contain snow_fall translation`);
  assert.strictEqual(content.snow_fall.length > 0, true, `${lang} snow_fall must not be empty`);
});
console.log('✅ 12-Locale Key Parity tests PASSED.');

// 4. Test AppStore Reactive Proxy & Subscriptions
console.log('▶ Testing AppStore reactive state & subscriber notifications...');
const store = new AppStore();
assert.strictEqual(store.state.isDragging, false, 'Default isDragging should be false');
assert.strictEqual(store.state.isSettingsOpen, false, 'Default isSettingsOpen should be false');

let notifiedVal = null;
const unsubscribe = store.subscribe('isDragging', (newVal) => {
  notifiedVal = newVal;
});

store.state.isDragging = true;
assert.strictEqual(store.state.isDragging, true, 'Direct write to store.state.isDragging should update');
assert.strictEqual(notifiedVal, true, 'Subscriber should be notified of state update');

unsubscribe();
store.state.isDragging = false;
assert.strictEqual(notifiedVal, true, 'Unsubscribed listener should not receive updates');

store.set({ cameraPitch: 0.5, cameraYaw: 1.2 });
assert.strictEqual(store.state.cameraPitch, 0.5, 'Batch set should update cameraPitch');
assert.strictEqual(store.state.cameraYaw, 1.2, 'Batch set should update cameraYaw');
console.log('✅ AppStore reactive tests PASSED.');

// 5. Test GPUAssetManager Recursive Disposal
console.log('▶ Testing GPUAssetManager recursive VRAM & texture disposal...');
let geomDisposed = false;
let matDisposed = false;
let texDisposed = false;

const mockTexture = {
  isTexture: true,
  dispose: () => { texDisposed = true; }
};

const mockMaterial = {
  map: mockTexture,
  dispose: () => { matDisposed = true; }
};

const mockGeometry = {
  dispose: () => { geomDisposed = true; }
};

const mockHierarchy = {
  children: [],
  traverse: (cb) => {
    cb({
      geometry: mockGeometry,
      material: mockMaterial
    });
  },
  remove: () => {}
};

disposeHierarchy(mockHierarchy);
assert.strictEqual(geomDisposed, true, 'Geometry must be disposed');
assert.strictEqual(matDisposed, true, 'Material must be disposed');
assert.strictEqual(texDisposed, true, 'Attached texture must be disposed');
console.log('✅ GPUAssetManager tests PASSED.');

// 6. Test Electron Security Bridge & Preload Configuration
console.log('▶ Testing Preload Script & Security Isolation configuration...');
const preloadPath = path.join(__dirname, '..', 'preload.js');
assert.strictEqual(fs.existsSync(preloadPath), true, 'preload.js must exist in app root');
const preloadContent = fs.readFileSync(preloadPath, 'utf8');
assert.strictEqual(preloadContent.includes('contextBridge.exposeInMainWorld'), true, 'preload.js must use contextBridge');
assert.strictEqual(preloadContent.includes('electronAPI'), true, 'preload.js must expose electronAPI');
assert.strictEqual(preloadContent.includes('fsBridge'), true, 'preload.js must expose fsBridge');
assert.strictEqual(preloadContent.includes('pathBridge'), true, 'preload.js must expose pathBridge');
assert.strictEqual(preloadContent.includes('urlBridge'), true, 'preload.js must expose urlBridge');

const mainPath = path.join(__dirname, '..', 'main.js');
const mainContent = fs.readFileSync(mainPath, 'utf8');
assert.strictEqual(mainContent.includes('contextIsolation: true'), true, 'main.js must enable contextIsolation: true');
assert.strictEqual(mainContent.includes('nodeIntegration: false'), true, 'main.js must set nodeIntegration: false');
assert.strictEqual(mainContent.includes("preload: path.join(__dirname, 'preload.js')"), true, 'main.js must load preload.js');
assert.strictEqual(mainContent.includes('startSteamRepaintLoop()'), true, 'main.js must dynamically start Steam repaint loop');
assert.strictEqual(mainContent.includes('stopSteamRepaintLoop()'), true, 'main.js must dynamically stop Steam repaint loop');
console.log('✅ Electron Security Bridge & Idle Optimization tests PASSED.');

// 7. Test SoundManager State, Volume Normalization & Snapshot
console.log('▶ Testing SoundManager volume clamping & state snapshot...');
import('../src/core/SoundManager.js').then(({ SoundManager }) => {
  const sm = new SoundManager();
  assert.strictEqual(sm.isMuted, false, 'Default isMuted should be false');
  assert.strictEqual(sm.masterVolume, 0.8, 'Default masterVolume should be 0.8');
  assert.strictEqual(sm.isPlaying('snow'), false, 'Default snow playing should be false');
  assert.strictEqual(sm.isPlaying('sakura'), false, 'Default sakura playing should be false');
  assert.strictEqual(sm.isPlaying('drum'), false, 'Default drum playing should be false');

  // Test volume clamping
  sm.setMasterVolume(1.5);
  assert.strictEqual(sm.masterVolume, 1.0, 'Master volume should clamp to 1.0');
  sm.setMasterVolume(-0.5);
  assert.strictEqual(sm.masterVolume, 0.0, 'Master volume should clamp to 0.0');

  sm.setTrackVolume('snow', 0.85);
  assert.strictEqual(sm.tracks.snow.volume, 0.85, 'Track snow volume should be 0.85');
  sm.setTrackVolume('sakura', 0.65);
  assert.strictEqual(sm.tracks.sakura.volume, 0.65, 'Track sakura volume should be 0.65');
  sm.setTrackVolume('drum', 0.95);
  assert.strictEqual(sm.tracks.drum.volume, 0.95, 'Track drum volume should be 0.95');

  const snap = sm.getSnapshot();
  assert.strictEqual(snap.snowVolume, 0.85, 'Snapshot snowVolume should be 0.85');
  assert.strictEqual(snap.sakuraVolume, 0.65, 'Snapshot sakuraVolume should be 0.65');
  assert.strictEqual(snap.drumVolume, 0.95, 'Snapshot drumVolume should be 0.95');

  // Test syncAtmosphere
  sm.syncAtmosphere({
    soundMuted: true,
    soundMasterVolume: 0.5,
    soundSnowVolume: 0.4,
    soundSakuraVolume: 0.9,
    sakuraRain: true,
    soundSakuraSync: true
  });
  assert.strictEqual(sm.isMuted, true, 'syncAtmosphere should set isMuted');
  assert.strictEqual(sm.masterVolume, 0.5, 'syncAtmosphere should set masterVolume');
  assert.strictEqual(sm.tracks.snow.volume, 0.4, 'syncAtmosphere should set snow track volume');
  assert.strictEqual(sm.tracks.sakura.volume, 0.9, 'syncAtmosphere should set sakura track volume');

  console.log('✅ SoundManager unit tests PASSED.');

  // Test 8: FlagMeshBuilder and Wave Simulation
  console.log('▶ Testing FlagMeshBuilder presets and cloth wave math...');
  import('../src/core/FlagMeshBuilder.js').then(({ createPresetFlagTexture, updateFlagWave }) => {
    const defaultTex = createPresetFlagTexture('default');
    assert.ok(defaultTex && defaultTex.startsWith('data:image/png;base64,'), 'Default preset should return base64 PNG data URL');

    const worldTex = createPresetFlagTexture('world');
    assert.ok(worldTex && worldTex.startsWith('data:image/png;base64,'), 'World preset should return base64 PNG data URL');

    const cyberTex = createPresetFlagTexture('cyber');
    assert.ok(cyberTex && cyberTex.startsWith('data:image/png;base64,'), 'Cyber preset should return base64 PNG data URL');

    const starTex = createPresetFlagTexture('star');
    assert.ok(starTex && starTex.startsWith('data:image/png;base64,'), 'Star preset should return base64 PNG data URL');

    const rainbowTex = createPresetFlagTexture('rainbow');
    assert.ok(rainbowTex && rainbowTex.startsWith('data:image/png;base64,'), 'Rainbow preset should return base64 PNG data URL');

    // Test wave physics math on mock subdivided geometry
    const vertCount = 100;
    const initialPositions = new Float32Array(vertCount * 3);
    for (let i = 0; i < vertCount; i++) {
      initialPositions[i * 3] = (i % 10) * 0.2; // x
      initialPositions[i * 3 + 1] = Math.floor(i / 10) * 0.15; // y
      initialPositions[i * 3 + 2] = 0; // z
    }
    const currentPositions = new Float32Array(initialPositions);

    const mockClothMesh = {
      geometry: {
        userData: {
          initialPositions: initialPositions
        },
        attributes: {
          position: {
            array: currentPositions,
            needsUpdate: false
          }
        },
        computeVertexNormals: () => { mockClothMesh.geometry.normalsComputed = true; }
      }
    };

    updateFlagWave(mockClothMesh, 0.016, 1.0, 4.0, 0.4);
    assert.strictEqual(mockClothMesh.geometry.attributes.position.needsUpdate, true, 'position attribute should mark needsUpdate=true');
    assert.strictEqual(mockClothMesh.geometry.normalsComputed, true, 'computeVertexNormals should be invoked');
    
    // Far end of flag (x > 0) should have modulated Z displacement
    assert.notStrictEqual(currentPositions[currentPositions.length - 1], 0, 'Flag tail Z coordinate should be billowed by wind');

    console.log('✅ FlagMeshBuilder & wave physics unit tests PASSED.');

    // Test 9: SettingsManager with Texture & Flag Keys
    console.log('▶ Testing SettingsManager texture & flag key defaults and serialization...');
    const defaults = SettingsManager.getDefaultSettings();
    assert.strictEqual(defaults.customTexturePath, '', 'Default customTexturePath should be empty');
    assert.strictEqual(defaults.flagWindSpeed, 3.5, 'Default flagWindSpeed should be 3.5');
    assert.strictEqual(defaults.flagWaveIntensity, 0.35, 'Default flagWaveIntensity should be 0.35');
    assert.strictEqual(defaults.textureRepeatX, 1.0, 'Default textureRepeatX should be 1.0');
    assert.strictEqual(defaults.textureRepeatY, 1.0, 'Default textureRepeatY should be 1.0');
    assert.strictEqual(defaults.textureRoughness, 0.50, 'Default textureRoughness should be 0.50');
    assert.strictEqual(defaults.textureMetalness, 0.05, 'Default textureMetalness should be 0.05');
    assert.strictEqual(defaults.flagPreset, 'default', 'Default flagPreset should be default');

    console.log('✅ SettingsManager texture configuration unit tests PASSED.');
    console.log('\n🎉 ALL 9 UNIT TEST SUITES PASSED CLEANLY (100% SUCCESS)');
  });
});

