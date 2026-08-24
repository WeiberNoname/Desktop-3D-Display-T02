/**
 * Camera Controls & Viewport Utilities Module (<120 lines)
 * Encapsulates FPS camera movement, spatial axis/grid HUD visibility toggling,
 * pointer lock handling, and camera/mascot transform resets.
 */

export function updateFPSCamera({ currentSettings, camera, THREE, keys, delta }) {
  if (!currentSettings.enableFPSMode || !camera) return;

  const moveSpeed = 3.5;
  const dist = moveSpeed * delta;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);

  const right = new THREE.Vector3();
  right.crossVectors(forward, camera.up).normalize();

  if (keys.fpsKeyW) camera.position.addScaledVector(forward, dist);
  if (keys.fpsKeyS) camera.position.addScaledVector(forward, -dist);
  if (keys.fpsKeyD) camera.position.addScaledVector(right, dist);
  if (keys.fpsKeyA) camera.position.addScaledVector(right, -dist);

  if (keys.fpsKeySpace) camera.position.y += moveSpeed * delta;
  if (keys.fpsKeyShift) camera.position.y -= moveSpeed * delta;
}

export function updateXYZVisibility({ axesHelper, gridHelper, currentSettings, isSettingsOpen, renderer, isMouseOverCharacter }) {
  if (axesHelper) axesHelper.visible = !!currentSettings.showXYZCoords;
  if (gridHelper) gridHelper.visible = !!currentSettings.showGroundGrid;

  const hud = document.getElementById('xyz-hud-overlay');
  if (hud) {
    if (currentSettings.showXYZCoords) {
      hud.classList.remove('hidden');
    } else {
      hud.classList.add('hidden');
    }
  }

  const crosshair = document.getElementById('fps-crosshair');
  if (crosshair) {
    if (currentSettings.enableFPSMode && !isSettingsOpen) {
      crosshair.classList.remove('hidden');
      document.body.style.cursor = 'none';
      if (renderer && renderer.domElement && document.pointerLockElement !== renderer.domElement) {
        try {
          renderer.domElement.requestPointerLock();
        } catch (e) {
          console.warn("Could not request pointer lock:", e);
        }
      }
    } else {
      crosshair.classList.add('hidden');
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock();
        } catch (e) { }
      }
      if (!isMouseOverCharacter) {
        document.body.style.cursor = 'default';
      }
    }
  }
}

export function resetCameraAndPosition({ camera, state, characterGroup, innerModelGroup, hasSettingsFile, currentSettings, physicsEngine }) {
  if (camera) {
    camera.position.set(0, 0, 5.5);
    camera.rotation.set(0, 0, 0);
  }
  if (state) {
    state.cameraPitch = 0;
    state.cameraYaw = 0;
    state.fpsKeyW = state.fpsKeyA = state.fpsKeyS = state.fpsKeyD = state.fpsKeySpace = state.fpsKeyShift = false;
  }

  if (characterGroup) {
    characterGroup.position.set(0, 0, 0);
    characterGroup.rotation.set(0.08, 0, 0);
    const targetScale = hasSettingsFile ? currentSettings.scale : 1.0;
    characterGroup.scale.set(targetScale, targetScale, targetScale);
  }
  if (innerModelGroup) {
    innerModelGroup.position.set(0, 0, 0);
    innerModelGroup.rotation.set(0, 0, 0);
  }
  if (physicsEngine) {
    physicsEngine.reset();
  }
}
