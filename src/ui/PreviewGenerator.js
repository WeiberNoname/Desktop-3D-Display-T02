/**
 * Mascot Preview & Thumbnail Generator Module
 * Handles synchronous canvas snapshot preview generation,
 * background offscreen preview queuing, mascot grid card DOM population,
 * and preview thumbnail cache clearing.
 */

/**
 * Generates a PNG thumbnail preview for a specific model key from active scene renderer canvas.
 * @param {Object} ctx - Context dependencies.
 * @param {string} modelKey - Active model filename or 'procedural'.
 */
export function generateModelPreview(ctx, modelKey) {
  const { fs, path, getAssetsPath, renderer, scene, camera, callbacks } = ctx;
  const assetsDir = getAssetsPath();
  const previewsDir = path.join(assetsDir, '.previews');

  if (!fs.existsSync(previewsDir)) {
    try {
      fs.mkdirSync(previewsDir, { recursive: true });
    } catch (e) {
      console.warn("Could not create previews directory:", e);
    }
  }
  const previewPath = path.join(previewsDir, `${modelKey}.png`);
  if (fs.existsSync(previewPath)) return;

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }

  try {
    const dataUrl = renderer.domElement.toDataURL("image/png");
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync(previewPath, base64Data, 'base64');
    console.log(`Generated thumbnail preview for: ${modelKey}`);

    if (callbacks && callbacks.populateModelDropdown) {
      callbacks.populateModelDropdown();
    }
  } catch (e) {
    console.warn("Failed to save model preview thumbnail:", e);
  }
}

/**
 * Populates the mascot selection grid DOM cards in the settings panel.
 * @param {Object} ctx - Context dependencies.
 */
export function populateModelDropdown(ctx) {
  const { fs, path, pathToFileURL, getAssetsPath, currentSettings, callbacks, state } = ctx;
  if (callbacks && callbacks.scanForModels) {
    callbacks.scanForModels();
  }

  const gridContainer = document.getElementById('model-select-grid');
  const modelSelect = document.getElementById('model-select');
  if (!gridContainer || !modelSelect) return;

  gridContainer.innerHTML = '';

  const discovered = state && state.discoveredModels ? state.discoveredModels : [];
  const options = ['procedural', ...discovered];
  const assetsDir = getAssetsPath();

  options.forEach(modelKey => {
    const card = document.createElement('div');
    card.className = 'mascot-card';
    if (currentSettings.activeModel === modelKey) {
      card.classList.add('selected');
    }

    const img = document.createElement('img');
    img.className = 'mascot-thumbnail';
    img.dataset.mascot = modelKey;

    const previewPath = path.join(assetsDir, '.previews', `${modelKey}.png`);
    if (fs.existsSync(previewPath)) {
      img.src = pathToFileURL(previewPath).href + "?t=" + Date.now();
    } else {
      img.src = './assets/bunny_icon.png';
    }

    const label = document.createElement('div');
    label.className = 'mascot-card-label';
    label.textContent = modelKey === 'procedural' ? 'Pink Bunny' : modelKey.replace(/\.(glb|gltf)$/i, '');

    card.appendChild(img);
    card.appendChild(label);

    card.addEventListener('click', () => {
      gridContainer.querySelectorAll('.mascot-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      modelSelect.value = modelKey;
      modelSelect.dispatchEvent(new Event('change'));
    });

    gridContainer.appendChild(card);
  });
}

/**
 * Starts background preview generator queue for models missing PNG thumbnails.
 * @param {Object} ctx - Context dependencies.
 */
export function startBackgroundPreviewGenerator(ctx) {
  const { fs, path, getAssetsPath, state, callbacks } = ctx;
  if (callbacks && callbacks.scanForModels) {
    callbacks.scanForModels();
  }
  const assetsDir = getAssetsPath();
  const previewsDir = path.join(assetsDir, '.previews');

  if (!fs.existsSync(previewsDir)) {
    try {
      fs.mkdirSync(previewsDir, { recursive: true });
    } catch (e) {
      return;
    }
  }

  const discovered = state && state.discoveredModels ? state.discoveredModels : [];
  const allModels = ['procedural', ...discovered];
  const queue = allModels.filter(modelKey => {
    const previewPath = path.join(previewsDir, `${modelKey}.png`);
    return !fs.existsSync(previewPath);
  });

  if (queue.length > 0) {
    console.log(`Starting background preview generator for ${queue.length} models:`, queue);
    const intervalId = setInterval(() => {
      if (queue.length === 0) {
        clearInterval(intervalId);
        return;
      }

      const nextModel = queue.shift();
      generateMascotPreviewInBackground(ctx, nextModel);
    }, 2000);
  }
}

/**
 * Generates preview snapshot PNG offscreen for procedural or custom model.
 * @param {Object} ctx - Context dependencies.
 * @param {string} modelKey - Model key string.
 */
export function generateMascotPreviewInBackground(ctx, modelKey) {
  const {
    THREE,
    GLTFLoader,
    scene,
    camera,
    renderer,
    fs,
    path,
    pathToFileURL,
    getAssetsPath,
    state
  } = ctx;

  const assetsDir = getAssetsPath();
  const previewsDir = path.join(assetsDir, '.previews');
  const previewPath = path.join(previewsDir, `${modelKey}.png`);

  if (fs.existsSync(previewPath)) return;

  const characterGroup = state.getCharacterGroup ? state.getCharacterGroup() : null;
  const originalVisible = characterGroup ? characterGroup.visible : true;

  if (modelKey === 'procedural') {
    if (characterGroup) characterGroup.visible = false;

    const tempGroup = new THREE.Group();
    scene.add(tempGroup);

    const bodyGeom = new THREE.SphereGeometry(0.7, 32, 32);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0xff7597 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    tempGroup.add(body);

    const eyeGeom = new THREE.SphereGeometry(0.08, 16, 16);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(0.2, 0.25, 0.55);
    tempGroup.add(leftEye);
    const rightEye = leftEye.clone();
    rightEye.position.x = -0.2;
    tempGroup.add(rightEye);

    const earGeom = new THREE.BoxGeometry(0.18, 0.9, 0.12);
    const leftEar = new THREE.Mesh(earGeom, bodyMat);
    leftEar.position.set(0.3, 0.9, 0);
    leftEar.rotation.z = -0.15;
    tempGroup.add(leftEar);
    const rightEar = leftEar.clone();
    rightEar.position.x = -0.3;
    rightEar.rotation.z = 0.15;
    tempGroup.add(rightEar);

    const noseGeom = new THREE.ConeGeometry(0.06, 0.08, 4);
    const noseMat = new THREE.MeshBasicMaterial({ color: 0xffb7c5 });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.set(0, 0.08, 0.68);
    nose.rotation.x = Math.PI;
    tempGroup.add(nose);

    const cheekGeom = new THREE.SphereGeometry(0.09, 16, 16);
    const cheekMat = new THREE.MeshBasicMaterial({ color: 0xffa3b1 });
    const leftCheek = new THREE.Mesh(cheekGeom, cheekMat);
    leftCheek.position.set(0.35, 0.05, 0.55);
    tempGroup.add(leftCheek);
    const rightCheek = leftCheek.clone();
    rightCheek.position.x = -0.35;
    tempGroup.add(rightCheek);

    tempGroup.rotation.y = 0.4;
    tempGroup.rotation.x = 0.08;

    renderer.render(scene, camera);

    try {
      const dataUrl = renderer.domElement.toDataURL("image/png");
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
      fs.writeFileSync(previewPath, base64Data, 'base64');
      console.log(`Generated background preview for: procedural`);

      const imgEl = document.querySelector(`.mascot-thumbnail[data-mascot="procedural"]`);
      if (imgEl) {
        imgEl.src = pathToFileURL(previewPath).href + "?t=" + Date.now();
      }
    } catch (e) {
      console.warn("Failed background capture for procedural bunny:", e);
    }

    scene.remove(tempGroup);
    if (characterGroup) characterGroup.visible = originalVisible;

  } else {
    const filePath = path.join(assetsDir, modelKey);
    let fileUrl = filePath;
    try {
      fileUrl = pathToFileURL(filePath).href;
    } catch (e) { }

    const loader = new GLTFLoader();
    loader.load(fileUrl, (gltf) => {
      const tempModel = gltf.scene;
      if (characterGroup) characterGroup.visible = false;

      const tempGroup = new THREE.Group();
      scene.add(tempGroup);

      const box = new THREE.Box3().setFromObject(tempModel);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      tempModel.position.set(-center.x, -center.y, -center.z);

      const padding = 1.35;
      const innerGroup = new THREE.Group();
      innerGroup.add(tempModel);
      innerGroup.position.y = - size.y * (padding - 1) / 2;
      tempGroup.add(innerGroup);

      const origAspect = camera.aspect;
      const origPos = camera.position.clone();

      const visibleHeight = size.y * padding;
      const zPos = visibleHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
      camera.position.set(0, 0, zPos + (size.z / 2));

      renderer.render(scene, camera);

      try {
        const dataUrl = renderer.domElement.toDataURL("image/png");
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(previewPath, base64Data, 'base64');
        console.log(`Generated background preview for custom model: ${modelKey}`);

        const imgEl = document.querySelector(`.mascot-thumbnail[data-mascot="${modelKey}"]`);
        if (imgEl) {
          imgEl.src = pathToFileURL(previewPath).href + "?t=" + Date.now();
        }
      } catch (e) {
        console.warn(`Failed background capture for custom model: ${modelKey}`, e);
      }

      scene.remove(tempGroup);
      camera.aspect = origAspect;
      camera.position.copy(origPos);
      camera.updateProjectionMatrix();
      if (characterGroup) characterGroup.visible = originalVisible;

    }, undefined, (err) => {
      console.warn(`Failed to load ${modelKey} for background preview:`, err);
    });
  }
}

/**
 * Purges cached PNG previews and restarts background preview generation queue.
 * @param {Object} ctx - Context dependencies.
 */
export function forceRefreshAllPreviews(ctx) {
  const { fs, path, getAssetsPath, ipcRenderer } = ctx;
  const assetsDir = getAssetsPath();
  const previewsDir = path.join(assetsDir, '.previews');
  if (fs.existsSync(previewsDir)) {
    try {
      const files = fs.readdirSync(previewsDir);
      files.forEach(file => {
        const filePath = path.join(previewsDir, file);
        fs.unlinkSync(filePath);
      });
    } catch (e) {
      console.warn("Could not clear previews folder:", e);
    }
  }

  const thumbnails = document.querySelectorAll('.mascot-thumbnail');
  thumbnails.forEach(img => {
    img.src = './assets/bunny_icon.png';
  });

  startBackgroundPreviewGenerator(ctx);

  if (ipcRenderer) {
    ipcRenderer.send('log-diagnostic', '[Preview Refresh] All mascot thumbnail previews refreshed.');
  }
}
