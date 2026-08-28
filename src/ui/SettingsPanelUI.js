/**
 * Settings Panel UI Synchronizer & Component Module (<160 lines)
 * Handles animation dropdown population, UI form sliders state syncing, and readout label updates.
 */

export function populateAnimationDropdown({ animSelect, modelSelect, availableAnimations, currentSettings }) {
  const container = document.getElementById('anim-select-container');
  if (!animSelect) return;

  const currentModel = modelSelect ? modelSelect.value : currentSettings.activeModel;

  if (currentModel === 'procedural') {
    animSelect.innerHTML = '<option value="none">Procedural (Default Loop)</option>';
    animSelect.disabled = true;
    if (container) container.style.opacity = '0.5';
    return;
  }

  const clips = availableAnimations || [];
  if (clips.length === 0) {
    animSelect.innerHTML = '<option value="none">No Animation Clips Found</option>';
    animSelect.disabled = true;
    if (container) container.style.opacity = '0.6';
    return;
  }

  animSelect.disabled = false;
  if (container) container.style.opacity = '1.0';
  animSelect.innerHTML = '<option value="none">None (Static Pose)</option>';

  clips.forEach((clipName, idx) => {
    const option = document.createElement('option');
    const val = clipName || String(idx);
    option.value = val;
    option.textContent = clipName ? `${idx + 1}. ${clipName}` : `Animation ${idx + 1}`;
    animSelect.appendChild(option);
  });

  if (currentSettings.activeAnimation === 'none') {
    animSelect.value = 'none';
  } else if (!currentSettings.activeAnimation || currentSettings.activeAnimation === 'default') {
    animSelect.value = clips[0] || 'none';
  } else {
    const exists = Array.from(animSelect.options).some(opt => opt.value === currentSettings.activeAnimation);
    animSelect.value = exists ? currentSettings.activeAnimation : (clips[0] || 'none');
  }
}

export function syncSlidersUI(deps) {
  const {
    currentSettings,
    langSelect,
    widthSlider,
    heightSlider,
    scaleSlider,
    bobbingCheck,
    spinXCheck,
    spinYCheck,
    spinZCheck,
    speedXSlider,
    speedYSlider,
    speedZSlider,
    targetFpsSlider,
    numTargetFps,
    gpuOptimizeCheck,
    gpuLowPowerCheck,
    idleFpsSaverCheck,
    mouseOptimizeCheck,
    settingsLeftCheck,
    lockPositionCheck,
    viewOnlyCheck,
    enablePhysicsCheck,
    physicsFloorCheck,
    physicsGravitySlider,
    physicsElasticitySlider,
    modelSelect,
    valWidth,
    valHeight,
    valScale,
    valSpeedX,
    valSpeedY,
    valSpeedZ,
    valTargetFps,
    valPhysicsGravity,
    valPhysicsElasticity,
    fontScaleSlider,
    valFontScale,
    panel,
    enableStudioLightsCheck,
    ambientIntensitySlider,
    valAmbientIntensity,
    updateXYZVisibility,
    populateAnimationDropdown,
    renderSpotlightCardsUI,
    updateStageLighting,
    updateSpotlightPosition
  } = deps;

  if (langSelect) langSelect.value = currentSettings.language || 'en';
  if (widthSlider) widthSlider.value = currentSettings.width;
  if (heightSlider) heightSlider.value = currentSettings.height;
  if (scaleSlider) scaleSlider.value = currentSettings.scale;
  if (bobbingCheck) bobbingCheck.checked = currentSettings.bobbing;

  if (spinXCheck) spinXCheck.checked = currentSettings.spinX;
  if (spinYCheck) spinYCheck.checked = currentSettings.spinY;
  if (spinZCheck) spinZCheck.checked = currentSettings.spinZ;

  if (speedXSlider) speedXSlider.value = currentSettings.speedX;
  if (speedYSlider) speedYSlider.value = currentSettings.speedY;
  if (speedZSlider) speedZSlider.value = currentSettings.speedZ;

  const targetFpsVal = currentSettings.targetFps || 60;
  if (targetFpsSlider) targetFpsSlider.value = targetFpsVal;
  if (numTargetFps) numTargetFps.value = targetFpsVal;
  if (valTargetFps) valTargetFps.innerText = targetFpsVal;

  if (gpuOptimizeCheck) gpuOptimizeCheck.checked = currentSettings.gpuOptimize;
  const gpuLowPowerDom = gpuLowPowerCheck || document.getElementById('gpu-low-power');
  const idleFpsSaverDom = idleFpsSaverCheck || document.getElementById('idle-fps-saver');
  const dynamicBatterySaverDom = deps.dynamicBatterySaverCheck || document.getElementById('dynamic-battery-saver');
  if (gpuLowPowerDom) gpuLowPowerDom.checked = !!currentSettings.gpuLowPower;
  if (idleFpsSaverDom) idleFpsSaverDom.checked = !!currentSettings.idleFpsSaver;
  if (dynamicBatterySaverDom) dynamicBatterySaverDom.checked = !!currentSettings.dynamicBatterySaver;
  if (mouseOptimizeCheck) mouseOptimizeCheck.checked = currentSettings.mouseOptimize;
  if (settingsLeftCheck) settingsLeftCheck.checked = currentSettings.settingsLeft;
  if (lockPositionCheck) lockPositionCheck.checked = currentSettings.lockPosition;
  if (viewOnlyCheck) viewOnlyCheck.checked = currentSettings.viewOnly;
  const sakuraRainDom = deps.sakuraRainCheck || document.getElementById('sakura-rain');
  if (sakuraRainDom) sakuraRainDom.checked = currentSettings.sakuraRain !== false;
  const snowFallDom = deps.snowFallCheck || document.getElementById('snow-fall');
  if (snowFallDom) snowFallDom.checked = currentSettings.snowFall === true;
  if (enablePhysicsCheck) enablePhysicsCheck.checked = currentSettings.enablePhysics;
  if (physicsFloorCheck) physicsFloorCheck.checked = currentSettings.physicsFloor;
  if (physicsGravitySlider) physicsGravitySlider.value = currentSettings.physicsGravity;
  if (physicsElasticitySlider) physicsElasticitySlider.value = currentSettings.physicsElasticity;

  const showXYZCheck = document.getElementById('show-xyz-coords');
  const showGridCheck = document.getElementById('show-ground-grid');
  const enableFpsCheck = document.getElementById('enable-fps-mode');
  if (showXYZCheck) showXYZCheck.checked = !!currentSettings.showXYZCoords;
  if (showGridCheck) showGridCheck.checked = !!currentSettings.showGroundGrid;
  if (enableFpsCheck) enableFpsCheck.checked = !!currentSettings.enableFPSMode;

  if (updateXYZVisibility) updateXYZVisibility();
  if (modelSelect) modelSelect.value = currentSettings.activeModel;
  if (populateAnimationDropdown) populateAnimationDropdown();

  if (valWidth) valWidth.innerText = currentSettings.width;
  if (valHeight) valHeight.innerText = currentSettings.height;
  if (valScale) valScale.innerText = currentSettings.scale.toFixed(2);

  if (valSpeedX) valSpeedX.innerText = currentSettings.speedX.toFixed(1);
  if (valSpeedY) valSpeedY.innerText = currentSettings.speedY.toFixed(1);
  if (valSpeedZ) valSpeedZ.innerText = currentSettings.speedZ.toFixed(1);

  if (valPhysicsGravity && physicsGravitySlider) valPhysicsGravity.innerText = parseFloat(physicsGravitySlider.value).toFixed(1);
  if (valPhysicsElasticity && physicsElasticitySlider) valPhysicsElasticity.innerText = parseFloat(physicsElasticitySlider.value).toFixed(2);

  if (fontScaleSlider) {
    fontScaleSlider.value = currentSettings.fontSizeScale;
    if (valFontScale) valFontScale.innerText = currentSettings.fontSizeScale.toFixed(2);
  }
  if (panel) panel.style.setProperty('--panel-font-scale', currentSettings.fontSizeScale);

  if (renderSpotlightCardsUI) renderSpotlightCardsUI();
  if (enableStudioLightsCheck) enableStudioLightsCheck.checked = currentSettings.enableStudioLights !== false;
  if (ambientIntensitySlider) ambientIntensitySlider.value = currentSettings.ambientIntensity ?? 0.70;
  if (valAmbientIntensity && ambientIntensitySlider) valAmbientIntensity.innerText = parseFloat(ambientIntensitySlider.value).toFixed(2);

  if (updateStageLighting) updateStageLighting();
  if (updateSpotlightPosition) updateSpotlightPosition();
}
