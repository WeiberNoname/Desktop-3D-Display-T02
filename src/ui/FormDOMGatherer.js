/**
 * Settings Form DOM Gatherer Module (<70 lines)
 * Queries all slider, checkbox, and dropdown DOM elements and builds save settings callbacks.
 */

export function gatherSettingsFormElements() {
  return {
    langSelect: document.getElementById('lang-select'),
    widthSlider: document.getElementById('win-width'),
    heightSlider: document.getElementById('win-height'),
    scaleSlider: document.getElementById('model-scale'),
    bobbingCheck: document.getElementById('model-bobbing'),
    spinXCheck: document.getElementById('spin-x'),
    spinYCheck: document.getElementById('spin-y'),
    spinZCheck: document.getElementById('spin-z'),
    speedXSlider: document.getElementById('speed-x'),
    speedYSlider: document.getElementById('speed-y'),
    speedZSlider: document.getElementById('speed-z'),
    targetFpsSlider: document.getElementById('target-fps'),
    numTargetFps: document.getElementById('num-target-fps'),
    gpuOptimizeCheck: document.getElementById('gpu-optimize'),
    gpuLowPowerCheck: document.getElementById('gpu-low-power'),
    idleFpsSaverCheck: document.getElementById('idle-fps-saver'),
    dynamicBatterySaverCheck: document.getElementById('dynamic-battery-saver'),
    mouseOptimizeCheck: document.getElementById('mouse-optimize'),
    settingsLeftCheck: document.getElementById('settings-left'),
    lockPositionCheck: document.getElementById('lock-position'),
    viewOnlyCheck: document.getElementById('view-only'),
    enablePhysicsCheck: document.getElementById('enable-physics'),
    physicsFloorCheck: document.getElementById('physics-floor'),
    physicsGravitySlider: document.getElementById('physics-gravity'),
    physicsElasticitySlider: document.getElementById('physics-elasticity'),
    modelSelect: document.getElementById('model-select'),
    animSelect: document.getElementById('anim-select'),
    fontScaleSlider: document.getElementById('font-scale'),
    enableStudioLightsCheck: document.getElementById('enable-studio-lights'),
    ambientIntensitySlider: document.getElementById('ambient-intensity')
  };
}

export function buildSaveSettingsCallback(deps) {
  const { handleSaveSettingsUtil, context } = deps;
  return async (closeSettings) => {
    const elements = gatherSettingsFormElements();
    await handleSaveSettingsUtil({
      ...context,
      ...elements,
      closeSettings
    });
  };
}
