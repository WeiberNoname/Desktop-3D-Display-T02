/**
 * Core 3D Model Loader & Asset Manager
 * Handles 3D asset scanning, GLTF loading, bounding box centering,
 * auto-grounding height calculations, AnimationMixer clip setup, and safe fallbacks.
 */

/**
 * Scans the assets directory for valid 3D model files (.glb, .gltf).
 * @param {Object} fs - File system module reference.
 * @param {Function} getAssetsPath - Callback returning absolute assets directory path.
 * @returns {Array<string>} Array of discovered model filenames.
 */
export function scanForModels(fs, getAssetsPath) {
  if (!fs || typeof getAssetsPath !== 'function') return [];
  const discoveredModels = [];
  const assetsDir = getAssetsPath();

  if (!fs.existsSync(assetsDir)) {
    try {
      fs.mkdirSync(assetsDir, { recursive: true });
    } catch (e) {
      console.warn("Could not create assets directory:", e);
    }
  }

  if (fs.existsSync(assetsDir)) {
    try {
      const files = fs.readdirSync(assetsDir);
      files.forEach(file => {
        if (file.endsWith('.glb') || file.endsWith('.gltf')) {
          discoveredModels.push(file);
        }
      });
    } catch (err) {
      console.error('Error scanning models:', err);
    }
  }
  return discoveredModels;
}

/**
 * Detects active model preference and loads appropriate asset.
 * @param {Object} ctx - Context dependencies (fs, path, GLTFLoader, state, callbacks).
 */
export function detectAndLoadAsset(ctx) {
  const { fs, path, getAssetsPath, currentSettings, state, callbacks } = ctx;
  state.discoveredModels = scanForModels(fs, getAssetsPath);

  if (currentSettings.activeModel === 'procedural') {
    console.log('Active mascot is procedural bunny.');
    if (callbacks.createMascot) callbacks.createMascot();
    return;
  }

  if (currentSettings.activeModel && state.discoveredModels.includes(currentSettings.activeModel)) {
    const assetsDir = getAssetsPath();
    const fullPath = path.join(assetsDir, currentSettings.activeModel);
    console.log('Loading active model:', fullPath);
    loadCustomModel(ctx, fullPath);
    return;
  }

  if (state.discoveredModels.length > 0) {
    currentSettings.activeModel = state.discoveredModels[0];
    const assetsDir = getAssetsPath();
    const fullPath = path.join(assetsDir, currentSettings.activeModel);
    console.log('Active model not found. Defaulting to first discovered model:', fullPath);
    loadCustomModel(ctx, fullPath);
    return;
  }

  console.log('No custom asset found. Defaulting to procedural mascot.');
  currentSettings.activeModel = 'procedural';
  if (callbacks.createMascot) callbacks.createMascot();
}

/**
 * Safely falls back to procedural mascot if custom model loading fails.
 * @param {Object} ctx - Context dependencies.
 */
export function fallbackToProcedural(ctx) {
  console.log('Falling back to procedural mascot.');
  const { camera, renderer, ipcRenderer, state, currentSettings, callbacks } = ctx;

  state.customModelLoaded = false;
  currentSettings.activeModel = 'procedural';

  if (state.mixer) {
    state.mixer.stopAllAction();
    state.mixer = null;
  }
  state.idleAction = null;
  state.reactAction = null;
  state.loadedAnimations = [];
  state.availableAnimations = [];

  const characterGroup = state.getCharacterGroup ? state.getCharacterGroup() : null;
  if (characterGroup && ctx.scene) {
    ctx.scene.remove(characterGroup);
  }

  const defaultSize = 350;
  if (camera) {
    camera.aspect = 1.0;
    camera.updateProjectionMatrix();
    camera.position.set(0, 0, 5.5);
  }
  if (renderer) {
    renderer.setSize(defaultSize, defaultSize);
  }
  if (ipcRenderer) {
    ipcRenderer.send('resize-window', { width: defaultSize, height: defaultSize });
  }

  if (callbacks.createMascot) callbacks.createMascot();
}

/**
 * Loads custom GLTF/GLB model from file path.
 * @param {Object} ctx - Context dependencies.
 * @param {string} filePath - Absolute path to GLTF/GLB file.
 */
export function loadCustomModel(ctx, filePath) {
  const {
    THREE,
    GLTFLoader,
    scene,
    camera,
    renderer,
    path,
    pathToFileURL,
    currentSettings,
    ipcRenderer,
    state,
    callbacks
  } = ctx;

  let fileUrl = filePath;
  try {
    fileUrl = pathToFileURL(filePath).href;
  } catch (e) {
    console.warn("Could not convert path to file URL, using raw path:", e);
  }

  // Create temporary empty group so scene doesn't break
  let charGroup = new THREE.Group();
  scene.add(charGroup);
  state.setCharacterGroup(charGroup);

  try {
    const loader = new GLTFLoader();
    loader.load(fileUrl, (gltf) => {
      let existingGroup = state.getCharacterGroup();
      if (existingGroup) scene.remove(existingGroup);

      charGroup = new THREE.Group();
      scene.add(charGroup);
      state.setCharacterGroup(charGroup);

      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.set(-center.x, -center.y, -center.z);

      const padding = 1.35;
      const innerGroup = new THREE.Group();
      innerGroup.add(model);
      innerGroup.position.y = - size.y * (padding - 1) / 2;

      charGroup.add(innerGroup);
      state.setInnerModelGroup(innerGroup);

      const proxyGeom = new THREE.BoxGeometry(size.x, size.y, size.z);
      const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
      const collisionProxy = new THREE.Mesh(proxyGeom, proxyMat);
      collisionProxy.position.set(0, 0, 0);
      innerGroup.add(collisionProxy);
      state.setCollisionProxy(collisionProxy);

      const pixelsPerUnit = 175;

      if (state.hasSettingsFile) {
        charGroup.scale.set(currentSettings.scale, currentSettings.scale, currentSettings.scale);

        const targetW = currentSettings.width - 20;
        const targetH = currentSettings.height - 20;
        camera.aspect = targetW / targetH;
        camera.updateProjectionMatrix();
        renderer.setSize(targetW, targetH);

        const visibleHeight = size.y * currentSettings.scale * padding;
        const zPos = visibleHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
        camera.position.set(0, 0, zPos + ((size.z * currentSettings.scale) / 2));

        if (ipcRenderer) ipcRenderer.send('resize-window', { width: currentSettings.width, height: currentSettings.height });
      } else {
        charGroup.scale.set(1, 1, 1);

        let winWidth = Math.round(size.x * pixelsPerUnit * padding);
        let winHeight = Math.round(size.y * pixelsPerUnit * padding);
        winWidth = Math.max(150, Math.min(800, winWidth));
        winHeight = Math.max(150, Math.min(800, winHeight));

        const targetW = winWidth - 20;
        const targetH = winHeight - 20;
        camera.aspect = targetW / targetH;
        camera.updateProjectionMatrix();
        renderer.setSize(targetW, targetH);

        const visibleHeight = size.y * padding;
        const zPos = visibleHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
        camera.position.set(0, 0, zPos + (size.z / 2));

        if (ipcRenderer) ipcRenderer.send('resize-window', { width: winWidth, height: winHeight });
      }

      state.loadedAnimations = gltf.animations || [];
      state.availableAnimations = state.loadedAnimations.map(clip => clip.name || '');

      state.idleAction = null;
      state.reactAction = null;
      if (state.loadedAnimations.length > 0) {
        state.mixer = new THREE.AnimationMixer(model);
        applySelectedAnimation(ctx);
      }

      state.customModelLoaded = true;
      console.log('Successfully loaded custom model at original scale:', filePath);

      const fileName = path.basename(filePath);
      setTimeout(() => {
        if (callbacks.generateModelPreview) callbacks.generateModelPreview(fileName);
      }, 150);
    }, undefined, (error) => {
      console.error('Failed to load custom GLB/GLTF model:', error);
      fallbackToProcedural(ctx);
    });
  } catch (err) {
    console.error('Synchronous loader crash:', err);
    fallbackToProcedural(ctx);
  }
}

/**
 * Applies selected animation loop based on activeAnimation setting or auto-keyword matching.
 * @param {Object} ctx - Context dependencies.
 */
export function applySelectedAnimation(ctx) {
  const { THREE, state, currentSettings } = ctx;
  if (!state.mixer) return;

  state.mixer.stopAllAction();
  state.idleAction = null;
  state.reactAction = null;

  if (currentSettings.activeAnimation === 'none') {
    console.log('Animation is set to none (static pose).');
    return;
  }

  let targetClip = null;

  if (currentSettings.activeAnimation !== 'default') {
    targetClip = state.loadedAnimations.find(clip => clip.name === currentSettings.activeAnimation);
  }

  if (!targetClip && state.loadedAnimations.length > 0) {
    const idleKeywords = ['idle', 'stay', 'breathe', 'stand', 'look', 'loop', 'default'];
    targetClip = state.loadedAnimations.find(clip => {
      const name = clip.name.toLowerCase();
      return idleKeywords.some(keyword => name.includes(keyword));
    });
    if (!targetClip) {
      targetClip = state.loadedAnimations[0];
    }
  }

  if (state.loadedAnimations.length > 1) {
    const reactKeywords = ['jump', 'spin', 'click', 'react', 'interact', 'pet', 'wave', 'dance', 'happy'];
    const reactClip = state.loadedAnimations.find(clip => {
      const name = clip.name.toLowerCase();
      return reactKeywords.some(keyword => name.includes(keyword)) && clip !== targetClip;
    });
    if (reactClip) {
      state.reactAction = state.mixer.clipAction(reactClip);
      state.reactAction.setLoop(THREE.LoopOnce);
      state.reactAction.clampWhenFinished = true;
      console.log('Auto-detected reaction animation:', reactClip.name);
    }
  }

  if (targetClip) {
    console.log('Playing active animation loop:', targetClip.name);
    state.idleAction = state.mixer.clipAction(targetClip);
    state.idleAction.play();
  }
}
