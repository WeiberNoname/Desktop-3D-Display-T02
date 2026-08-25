import * as THREE from 'three';
import { GLTFLoader } from './node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import { initI18n, t, changeLanguage, getCurrentLanguage } from './i18nManager.js';
import { physicsEngine } from './physicsEngine.js';
import { SettingsManager } from './src/managers/SettingsManager.js';
import { updateGearPosition as updateGearPositionUtil, showSpeechBubble } from './src/ui/uiUtils.js';
import { updateSpotlightPosition as updateSpotlightPositionUtil, updateStageLighting as updateStageLightingUtil } from './src/core/LightingManager.js';
import { createProceduralMascot } from './src/core/MascotBuilder.js';
import { setupInteraction as setupInteractionUtil } from './src/core/InteractionManager.js';
import {
  scanForModels as scanForModelsUtil,
  detectAndLoadAsset as detectAndLoadAssetUtil,
  fallbackToProcedural as fallbackToProceduralUtil,
  loadCustomModel as loadCustomModelUtil,
  applySelectedAnimation as applySelectedAnimationUtil
} from './src/core/ModelLoader.js';
import {
  generateModelPreview as generateModelPreviewUtil,
  populateModelDropdown as populateModelDropdownUtil,
  startBackgroundPreviewGenerator as startBackgroundPreviewGeneratorUtil,
  generateMascotPreviewInBackground as generateMascotPreviewInBackgroundUtil,
  forceRefreshAllPreviews as forceRefreshAllPreviewsUtil
} from './src/ui/PreviewGenerator.js';
import { setupStudioTabs as setupStudioTabsUtil } from './src/ui/StudioTabManager.js';
import { renderSpotlightCardsUI as renderSpotlightCardsUIUtil, hexToRgb, rgbToHex } from './src/ui/SpotlightCardsUI.js';
import {
  populateAnimationDropdown as populateAnimationDropdownUtil,
  syncSlidersUI as syncSlidersUIUtil
} from './src/ui/SettingsPanelUI.js';
import { handleSaveSettings as handleSaveSettingsUtil } from './src/ui/SettingsSaveHandler.js';
import { updateAnimationFrame as updateAnimationFrameUtil } from './src/core/AnimationLoopManager.js';
import { PreviewViewportEngine } from './src/ui/PreviewViewportEngine.js';
import {
  updateFPSCamera as updateFPSCameraUtil,
  updateXYZVisibility as updateXYZVisibilityUtil,
  resetCameraAndPosition as resetCameraAndPositionUtil
} from './src/ui/CameraViewManager.js';
import { initializeApp as initializeAppUtil } from './src/core/AppInitializer.js';
import { setupSettingsUI as setupSettingsUIUtil } from './src/ui/SettingsEventListeners.js';
import {
  triggerInteraction as triggerInteractionUtil,
  onWindowResize as onWindowResizeUtil
} from './src/core/MascotInteractionHandler.js';
import {
  getModelLoaderCtx as getModelLoaderCtxUtil,
  getPreviewGeneratorCtx as getPreviewGeneratorCtxUtil
} from './src/core/ModelContextManager.js';
import { createInteractionStateProxy } from './src/core/InteractionStateFactory.js';
import { createAppStateContainer } from './src/core/AppStateContainer.js';
import { buildSaveSettingsCallback } from './src/ui/FormDOMGatherer.js';
import { createFormSyncManager } from './src/ui/FormSyncManager.js';
import { createModelDelegates } from './src/core/ModelDelegates.js';
import { createRenderLoopDelegates } from './src/core/RenderLoopDelegates.js';
import { createInteractionDelegates } from './src/core/InteractionDelegates.js';
import { createSettingsUIDelegates } from './src/ui/SettingsUIDelegates.js';
import { buildInteractionStateAccessors } from './src/core/ContextFactoryDelegates.js';
import { buildSaveSettingsConfig } from './src/ui/SettingsUIConfigBuilder.js';

const { ipcRenderer } = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');
const { pathToFileURL } = window.require('url');

// Three.js Scene, Camera, Renderer, and Lighting Objects
let scene, camera, renderer, characterGroup, innerModelGroup, collisionProxy;
let axesHelper = null;
let gridHelper = null;
let stageSpotLights = [];
let stageSpotLightHelpers = [];
let ambientLight = null;
let keyLight = null;
let fillLight = null;
let rimLight = null;
let mixer;
let idleAction = null;
let reactAction = null;
let loadedAnimations = [];
let availableAnimations = [];
let customModelLoaded = false;

// Application State Container
const appState = createAppStateContainer();
let { fps, ui, navigation, modifiers, animation: animationState } = appState;
let { cameraPitch, cameraYaw, fpsKeyW, fpsKeyA, fpsKeyS, fpsKeyD, fpsKeySpace, fpsKeyShift } = fps;
let { hasSettingsFile, wasConfigHealed, isSettingsOpen, isMouseOverCharacter, isMouseOverUI, isDragging, dragStartedOnMascot, isDraggingGear, dragStartScreenX, dragStartScreenY, dragMoveDistance } = ui;
let { isNavigating, navType, navStartMouseX, navStartMouseY, navStartRotationX, navStartRotationY, navStartTranslationX, navStartTranslationY, navStartTranslationZ } = navigation;
let { altKeyHeld, shiftKeyHeld, ctrlKeyHeld, keyDHeld, isPhysicsDragging } = modifiers;

// Application Settings initialized via SettingsManager
let currentSettings = SettingsManager.getDefaultSettings();
let discoveredModels = [];

function updateGearPosition() {
  updateGearPositionUtil(currentSettings);
}

async function init() {
  await initializeAppUtil({
    THREE,
    ipcRenderer,
    initI18n,
    physicsEngine,
    currentSettings,
    readSettingsFile,
    state: {
      set hasSettingsFile(v) { hasSettingsFile = v; },
      get hasSettingsFile() { return hasSettingsFile; },
      set wasConfigHealed(v) { wasConfigHealed = v; },
      get wasConfigHealed() { return wasConfigHealed; },
      set scene(s) { scene = s; },
      set camera(c) { camera = c; },
      set renderer(r) { renderer = r; },
      set ambientLight(l) { ambientLight = l; },
      set keyLight(l) { keyLight = l; },
      set fillLight(l) { fillLight = l; },
      set rimLight(l) { rimLight = l; },
      set axesHelper(h) { axesHelper = h; },
      set gridHelper(h) { gridHelper = h; },
      getIsMouseOverCharacter: () => isMouseOverCharacter,
      setIsMouseOverCharacter: (v) => { isMouseOverCharacter = v; }
    },
    callbacks: {
      updateXYZVisibility,
      updateStageLighting,
      updateSpotlightPosition,
      detectAndLoadAsset,
      setupInteraction,
      setupSettingsUI,
      updateGearPosition,
      initPreviewViewport,
      startBackgroundPreviewGenerator,
      animate,
      updateIgnoreMouseState: () => updateIgnoreMouseState()
    },
    onWindowResize
  });
}

function updateSpotlightPosition() {
  updateSpotlightPositionUtil(scene, currentSettings.spotlights, stageSpotLights, stageSpotLightHelpers, isSettingsOpen, THREE);
}

function updateStageLighting() {
  updateStageLightingUtil(ambientLight, keyLight, fillLight, rimLight, currentSettings);
}

function createMascot() {
  const result = createProceduralMascot(THREE, scene);
  if (result) {
    characterGroup = result.characterGroup;
    innerModelGroup = result.innerModelGroup;
    collisionProxy = result.collisionProxy;
  }

  // Generate preview thumbnail if missing
  setTimeout(() => {
    generateModelPreview('procedural');
  }, 150);
}

let updateIgnoreMouseState = () => {};

const interactionDelegates = createInteractionDelegates({
  createInteractionStateProxy,
  setupInteractionUtil,
  THREE,
  physicsEngine,
  currentSettings,
  ipcRenderer,
  fs,
  path,
  stateAccessors: buildInteractionStateAccessors({
    isSettingsOpen: { get: () => isSettingsOpen, set: (v) => { isSettingsOpen = v; } },
    isMouseOverCharacter: { get: () => isMouseOverCharacter, set: (v) => { isMouseOverCharacter = v; } },
    isMouseOverUI: { get: () => isMouseOverUI, set: (v) => { isMouseOverUI = v; } },
    isDragging: { get: () => isDragging, set: (v) => { isDragging = v; } },
    dragStartedOnMascot: { get: () => dragStartedOnMascot, set: (v) => { dragStartedOnMascot = v; } },
    isDraggingGear: { get: () => isDraggingGear, set: (v) => { isDraggingGear = v; } },
    dragStartScreenX: { get: () => dragStartScreenX, set: (v) => { dragStartScreenX = v; } },
    dragStartScreenY: { get: () => dragStartScreenY, set: (v) => { dragStartScreenY = v; } },
    dragMoveDistance: { get: () => dragMoveDistance, set: (v) => { dragMoveDistance = v; } },
    isNavigating: { get: () => isNavigating, set: (v) => { isNavigating = v; } },
    navType: { get: () => navType, set: (v) => { navType = v; } },
    navStartMouseX: { get: () => navStartMouseX, set: (v) => { navStartMouseX = v; } },
    navStartMouseY: { get: () => navStartMouseY, set: (v) => { navStartMouseY = v; } },
    navStartRotationX: { get: () => navStartRotationX, set: (v) => { navStartRotationX = v; } },
    navStartRotationY: { get: () => navStartRotationY, set: (v) => { navStartRotationY = v; } },
    navStartTranslationX: { get: () => navStartTranslationX, set: (v) => { navStartTranslationX = v; } },
    navStartTranslationY: { get: () => navStartTranslationY, set: (v) => { navStartTranslationY = v; } },
    navStartTranslationZ: { get: () => navStartTranslationZ, set: (v) => { navStartTranslationZ = v; } },
    altKeyHeld: { get: () => altKeyHeld, set: (v) => { altKeyHeld = v; } },
    shiftKeyHeld: { get: () => shiftKeyHeld, set: (v) => { shiftKeyHeld = v; } },
    ctrlKeyHeld: { get: () => ctrlKeyHeld, set: (v) => { ctrlKeyHeld = v; } },
    keyDHeld: { get: () => keyDHeld, set: (v) => { keyDHeld = v; } },
    isPhysicsDragging: { get: () => isPhysicsDragging, set: (v) => { isPhysicsDragging = v; } },
    cameraPitch: { get: () => cameraPitch, set: (v) => { cameraPitch = v; } },
    cameraYaw: { get: () => cameraYaw, set: (v) => { cameraYaw = v; } },
    fpsKeyW: { get: () => fpsKeyW, set: (v) => { fpsKeyW = v; } },
    fpsKeyA: { get: () => fpsKeyA, set: (v) => { fpsKeyA = v; } },
    fpsKeyS: { get: () => fpsKeyS, set: (v) => { fpsKeyS = v; } },
    fpsKeyD: { get: () => fpsKeyD, set: (v) => { fpsKeyD = v; } },
    fpsKeySpace: { get: () => fpsKeySpace, set: (v) => { fpsKeySpace = v; } },
    fpsKeyShift: { get: () => fpsKeyShift, set: (v) => { fpsKeyShift = v; } }
  }),
  sceneAccessors: {
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer,
    getCharacterGroup: () => characterGroup,
    getInnerModelGroup: () => innerModelGroup,
    getCollisionProxy: () => collisionProxy
  },
  callbacks: {
    showSpeechBubble,
    triggerInteraction,
    saveSettingsFile,
    updateXYZVisibility: () => updateXYZVisibility(),
    resetCameraAndPosition,
    getAssetsPath,
    onModelImported: (fileName, destPath) => {
      if (mixer) {
        mixer.stopAllAction();
        mixer = null;
      }
      idleAction = null;
      reactAction = null;
      loadedAnimations = [];
      availableAnimations = [];
      if (characterGroup) {
        scene.remove(characterGroup);
      }
      customModelLoaded = false;

      currentSettings.activeModel = fileName;
      currentSettings.activeAnimation = 'default';
      saveSettingsFile();

      const modelSelect = document.getElementById('model-select');
      if (modelSelect) {
        populateModelDropdown();
        modelSelect.value = fileName;
      }

      loadCustomModel(destPath);
    }
  }
});

function setupInteraction() {
  updateIgnoreMouseState = interactionDelegates.setupInteraction();
}



function triggerInteraction() {
  triggerInteractionUtil({
    animationState,
    mixer,
    reactAction,
    idleAction,
    showSpeechBubble,
    currentSettings,
    saveSettingsFile
  });
}

function onWindowResize() {
  onWindowResizeUtil({ camera, renderer });
}

function getAssetsPath() {
  return ipcRenderer.sendSync('get-assets-path');
}

function getModelLoaderCtx() {
  return getModelLoaderCtxUtil({
    THREE,
    GLTFLoader,
    scene,
    camera,
    renderer,
    fs,
    path,
    pathToFileURL,
    currentSettings,
    ipcRenderer,
    getAssetsPath,
    state: {
      hasSettingsFile,
      get discoveredModels() { return discoveredModels; },
      set discoveredModels(v) { discoveredModels = v; },
      get customModelLoaded() { return customModelLoaded; },
      set customModelLoaded(v) { customModelLoaded = v; },
      get mixer() { return mixer; },
      set mixer(v) { mixer = v; },
      get idleAction() { return idleAction; },
      set idleAction(v) { idleAction = v; },
      get reactAction() { return reactAction; },
      set reactAction(v) { reactAction = v; },
      get loadedAnimations() { return loadedAnimations; },
      set loadedAnimations(v) { loadedAnimations = v; },
      get availableAnimations() { return availableAnimations; },
      set availableAnimations(v) { availableAnimations = v; },
      getCharacterGroup: () => characterGroup,
      setCharacterGroup: (g) => { characterGroup = g; },
      getInnerModelGroup: () => innerModelGroup,
      setInnerModelGroup: (g) => { innerModelGroup = g; },
      getCollisionProxy: () => collisionProxy,
      setCollisionProxy: (c) => { collisionProxy = c; }
    },
    callbacks: {
      createMascot,
      generateModelPreview,
      populateAnimationDropdown: () => {
        if (typeof populateAnimationDropdown === 'function') populateAnimationDropdown();
      }
    }
  });
}

const modelDelegates = createModelDelegates({
  fs,
  getAssetsPath,
  getModelLoaderCtx: () => getModelLoaderCtx(),
  getPreviewGeneratorCtx: () => getPreviewGeneratorCtx(),
  scanForModelsUtil,
  detectAndLoadAssetUtil,
  fallbackToProceduralUtil,
  loadCustomModelUtil,
  applySelectedAnimationUtil,
  generateModelPreviewUtil,
  populateModelDropdownUtil,
  startBackgroundPreviewGeneratorUtil,
  generateMascotPreviewInBackgroundUtil,
  forceRefreshAllPreviewsUtil,
  state: {
    set discoveredModels(v) { discoveredModels = v; },
    get discoveredModels() { return discoveredModels; }
  }
});

function readSettingsFile() {
  const result = SettingsManager.readSettingsFile({
    fs,
    path,
    getAssetsPath,
    currentSettings,
    ipcRenderer
  });
  if (result && result.wasConfigHealed) {
    wasConfigHealed = true;
  }
  return result ? result.hasSettingsFile : false;
}

function saveSettingsFile() {
  SettingsManager.saveSettingsFile({
    fs,
    path,
    getAssetsPath,
    currentSettings
  });
}

function getPreviewGeneratorCtx() {
  return getPreviewGeneratorCtxUtil({
    THREE,
    GLTFLoader,
    scene,
    camera,
    renderer,
    fs,
    path,
    pathToFileURL,
    getAssetsPath,
    currentSettings,
    ipcRenderer,
    t,
    state: {
      discoveredModels,
      getCharacterGroup: () => characterGroup
    },
    callbacks: {
      scanForModels,
      populateModelDropdown
    }
  });
}

const scanForModels = modelDelegates.scanForModels;
const detectAndLoadAsset = modelDelegates.detectAndLoadAsset;
const fallbackToProcedural = modelDelegates.fallbackToProcedural;
const loadCustomModel = modelDelegates.loadCustomModel;
const applySelectedAnimation = modelDelegates.applySelectedAnimation;
const generateModelPreview = modelDelegates.generateModelPreview;
const populateModelDropdown = modelDelegates.populateModelDropdown;
const startBackgroundPreviewGenerator = modelDelegates.startBackgroundPreviewGenerator;
const generateMascotPreviewInBackground = modelDelegates.generateMascotPreviewInBackground;
const forceRefreshAllPreviews = modelDelegates.forceRefreshAllPreviews;

function setupSettingsUI() {
  const { syncSlidersUI, populateAnimationDropdown, renderSpotlightCardsUI } = createFormSyncManager({
    currentSettings,
    getAvailableAnimations: () => availableAnimations,
    syncSlidersUIUtil,
    populateAnimationDropdownUtil,
    renderSpotlightCardsUIUtil,
    updateXYZVisibility: () => updateXYZVisibility(),
    updateStageLighting,
    updateSpotlightPosition,
    saveSettingsFile,
    t
  });

  const settingsUIDelegates = createSettingsUIDelegates({
    setupSettingsUIUtil,
    currentSettings,
    ipcRenderer,
    t,
    showSpeechBubble,
    updateSpotlightPosition,
    updateStageLighting,
    saveSettingsFile,
    syncSlidersUI,
    populateModelDropdown,
    populateAnimationDropdown,
    forceRefreshAllPreviews,
    renderSpotlightCardsUI,
    setupStudioTabsUtil,
    applySelectedAnimation,
    fallbackToProcedural,
    loadCustomModel,
    getAssetsPath,
    path,
    handleSaveSettings: buildSaveSettingsCallback({
      handleSaveSettingsUtil,
      context: buildSaveSettingsConfig({
        currentSettings,
        changeLanguage,
        updateStageLighting,
        updateSpotlightPosition,
        physicsEngine,
        saveSettingsFile,
        state: {
          cameraPitch,
          cameraYaw,
          fpsKeyW,
          fpsKeyA,
          fpsKeyS,
          fpsKeyD,
          fpsKeySpace,
          fpsKeyShift,
          mixer,
          idleAction,
          reactAction,
          loadedAnimations,
          availableAnimations,
          customModelLoaded,
          getCharacterGroup: () => characterGroup
        },
        THREE,
        scene,
        camera,
        renderer,
        path,
        getAssetsPath,
        ipcRenderer,
        fallbackToProcedural,
        loadCustomModel,
        applySelectedAnimation,
        updateGearPosition,
        updateXYZVisibility,
        populateModelDropdown
      })
    }),
    resetCameraAndPosition,
    updateIgnoreMouseState: () => updateIgnoreMouseState(),
    stateAccessors: {
      set isMouseOverUI(v) { isMouseOverUI = v; },
      get isMouseOverUI() { return isMouseOverUI; },
      set isDragging(v) { isDragging = v; },
      get isDragging() { return isDragging; },
      set dragStartScreenX(v) { dragStartScreenX = v; },
      set dragStartScreenY(v) { dragStartScreenY = v; },
      set dragMoveDistance(v) { dragMoveDistance = v; },
      get dragMoveDistance() { return dragMoveDistance; },
      set isSettingsOpen(v) { isSettingsOpen = v; },
      get isSettingsOpen() { return isSettingsOpen; }
    }
  });

  settingsUIDelegates.setupSettingsUI();
}

function resetCameraAndPosition() {
  resetCameraAndPositionUtil({
    camera,
    THREE,
    state: {
      customModelLoaded,
      set cameraPitch(v) { cameraPitch = v; },
      set cameraYaw(v) { cameraYaw = v; },
      set fpsKeyW(v) { fpsKeyW = v; },
      set fpsKeyS(v) { fpsKeyS = v; },
      set fpsKeyA(v) { fpsKeyA = v; },
      set fpsKeyD(v) { fpsKeyD = v; },
      set fpsKeySpace(v) { fpsKeySpace = v; },
      set fpsKeyShift(v) { fpsKeyShift = v; }
    },
    characterGroup,
    innerModelGroup,
    hasSettingsFile,
    currentSettings,
    physicsEngine
  });
}

const clock = new THREE.Clock();
const previewViewportEngine = new PreviewViewportEngine(THREE);

const renderLoopDelegates = createRenderLoopDelegates({
  clock,
  THREE,
  updateAnimationFrameUtil,
  updateFPSCameraUtil,
  updateXYZVisibilityUtil,
  previewViewportEngine,
  getContext: () => ({
    mixer,
    innerModelGroup,
    characterGroup,
    animationState,
    currentSettings,
    hasSettingsFile,
    reactAction,
    idleAction,
    customModelLoaded,
    physicsEngine,
    camera,
    axesHelper,
    gridHelper,
    renderer,
    scene,
    renderPreviewViewport,
    updateFPSCamera,
    isSettingsOpen,
    isMouseOverCharacter,
    stageSpotLightHelpers,
    t,
    keys: { fpsKeyW, fpsKeyS, fpsKeyA, fpsKeyD, fpsKeySpace, fpsKeyShift }
  })
});

const animate = renderLoopDelegates.animate;
const updateFPSCamera = renderLoopDelegates.updateFPSCamera;
const updateXYZVisibility = renderLoopDelegates.updateXYZVisibility;
const initPreviewViewport = renderLoopDelegates.initPreviewViewport;
const renderPreviewViewport = renderLoopDelegates.renderPreviewViewport;

// Initialize on load
window.addEventListener('DOMContentLoaded', init);
