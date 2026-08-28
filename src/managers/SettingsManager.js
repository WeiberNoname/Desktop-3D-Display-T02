export class SettingsManager {
  static getDefaultSettings() {
    return {
      width: 350,
      height: 350,
      scale: 1.0,
      bobbing: true,
      spinX: false,
      spinY: false,
      spinZ: false,
      speedX: 1.0,
      speedY: 1.0,
      speedZ: 1.0,
      gpuOptimize: true,
      gpuLowPower: false,
      idleFpsSaver: false,
      dynamicBatterySaver: false,
      mouseOptimize: true,
      settingsLeft: false,
      lockPosition: false,
      viewOnly: false,
      sakuraRain: true,
      snowFall: false,
      enablePhysics: false,
      physicsGravity: 9.8,
      physicsElasticity: 0.7,
      physicsFloor: true,
      showXYZCoords: false,
      showGroundGrid: false,
      enableFPSMode: false,
      spotlights: [
        { id: 1, enabled: true, angleH: 45, angleV: 60, cone: 35, intensity: 2.0, color: '#ffffff' }
      ],
      enableStudioLights: true,
      ambientIntensity: 0.70,
      activeModel: 'procedural',
      activeAnimation: 'default',
      clickCount: 0,
      fontSizeScale: 1.0,
      targetFps: 60,
      language: 'en'
    };
  }

  static mergeWithDefaults(savedSettings) {
    const defaults = SettingsManager.getDefaultSettings();
    if (!savedSettings || typeof savedSettings !== 'object') {
      return defaults;
    }
    return Object.assign({}, defaults, savedSettings);
  }

  static readSettingsFile({ fs, path, getAssetsPath, currentSettings, ipcRenderer }) {
    if (!fs || !path || typeof getAssetsPath !== 'function' || !currentSettings) {
      return { hasSettingsFile: false, wasConfigHealed: false };
    }

    const assetsDir = getAssetsPath();
    const settingsFile = path.join(assetsDir, 'settings');
    const settingsTxtFile = path.join(assetsDir, 'settings.txt');

    let filePath = null;
    if (fs.existsSync(settingsFile)) filePath = settingsFile;
    else if (fs.existsSync(settingsTxtFile)) filePath = settingsTxtFile;

    const defaultContent = `width=350
height=350
scale=1.0
bobbing=true
spinX=false
spinY=false
spinZ=false
speedX=1.0
speedY=1.0
speedZ=1.0
gpuOptimize=true
mouseOptimize=true
settingsLeft=false
lockPosition=false
viewOnly=false
activeModel=procedural
activeAnimation=default
clickCount=0
fontSizeScale=1.0
targetFps=60
sakuraRain=true
language=en`;

    if (!filePath) {
      filePath = settingsFile;
      if (!fs.existsSync(assetsDir)) {
        try {
          fs.mkdirSync(assetsDir, { recursive: true });
        } catch (e) {
          console.warn("Could not create assets directory:", e);
        }
      }
      try {
        const tmpPath = filePath + '.tmp';
        fs.writeFileSync(tmpPath, defaultContent, 'utf8');
        fs.renameSync(tmpPath, filePath);
        console.log('Created default settings file at:', filePath);
      } catch (e) {
        console.error('Error creating default settings file:', e);
      }
    }

    let wasConfigHealed = false;

    if (filePath && fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf8');
        if (!data || data.trim() === '') {
          throw new Error('Settings file is empty');
        }
        const lines = data.split('\n');
        let validKeysParsed = 0;
        lines.forEach(line => {
          const parts = line.split('=');
          if (parts.length === 2) {
            const key = parts[0].trim();
            const val = parts[1].trim();
            if (key === 'width') { currentSettings.width = parseInt(val, 10) || 350; validKeysParsed++; }
            if (key === 'height') { currentSettings.height = parseInt(val, 10) || 350; validKeysParsed++; }
            if (key === 'scale') { currentSettings.scale = parseFloat(val) || 1.0; validKeysParsed++; }
            if (key === 'bobbing') { currentSettings.bobbing = (val !== 'false'); validKeysParsed++; }
            if (key === 'spinX') { currentSettings.spinX = (val === 'true'); validKeysParsed++; }
            if (key === 'spinY') { currentSettings.spinY = (val === 'true'); validKeysParsed++; }
            if (key === 'spinZ') { currentSettings.spinZ = (val === 'true'); validKeysParsed++; }
            if (key === 'speedX') { currentSettings.speedX = parseFloat(val) || 1.0; validKeysParsed++; }
            if (key === 'speedY') { currentSettings.speedY = parseFloat(val) || 1.0; validKeysParsed++; }
            if (key === 'speedZ') { currentSettings.speedZ = parseFloat(val) || 1.0; validKeysParsed++; }
            if (key === 'gpuOptimize') { currentSettings.gpuOptimize = (val !== 'false'); validKeysParsed++; }
            if (key === 'gpuLowPower') { currentSettings.gpuLowPower = (val === 'true'); validKeysParsed++; }
            if (key === 'idleFpsSaver') { currentSettings.idleFpsSaver = (val === 'true'); validKeysParsed++; }
            if (key === 'dynamicBatterySaver') { currentSettings.dynamicBatterySaver = (val === 'true'); validKeysParsed++; }
            if (key === 'mouseOptimize') { currentSettings.mouseOptimize = (val !== 'false'); validKeysParsed++; }
            if (key === 'settingsLeft') { currentSettings.settingsLeft = (val === 'true'); validKeysParsed++; }
            if (key === 'lockPosition') { currentSettings.lockPosition = (val === 'true'); validKeysParsed++; }
            if (key === 'viewOnly') { currentSettings.viewOnly = (val === 'true'); validKeysParsed++; }
            if (key === 'sakuraRain') { currentSettings.sakuraRain = (val !== 'false'); validKeysParsed++; }
            if (key === 'snowFall') { currentSettings.snowFall = (val === 'true'); validKeysParsed++; }
            if (key === 'enablePhysics') { currentSettings.enablePhysics = (val === 'true'); validKeysParsed++; }
            if (key === 'physicsGravity') { currentSettings.physicsGravity = parseFloat(val) || 9.8; validKeysParsed++; }
            if (key === 'physicsElasticity') { currentSettings.physicsElasticity = parseFloat(val) || 0.7; validKeysParsed++; }
            if (key === 'physicsFloor') { currentSettings.physicsFloor = (val !== 'false'); validKeysParsed++; }
            if (key === 'showXYZCoords') { currentSettings.showXYZCoords = (val === 'true'); validKeysParsed++; }
            if (key === 'showGroundGrid') { currentSettings.showGroundGrid = (val === 'true'); validKeysParsed++; }
            if (key === 'enableFPSMode') { currentSettings.enableFPSMode = (val === 'true'); validKeysParsed++; }
            if (key === 'spotlights') {
              try {
                currentSettings.spotlights = JSON.parse(val);
              } catch (e) {
                currentSettings.spotlights = null;
              }
              validKeysParsed++;
            }
            if (key === 'enableSpotlight') { currentSettings.enableSpotlight = (val === 'true'); validKeysParsed++; }
            if (key === 'spotlightAngleH') { currentSettings.spotlightAngleH = parseInt(val, 10) || 45; validKeysParsed++; }
            if (key === 'spotlightAngleV') { currentSettings.spotlightAngleV = parseInt(val, 10) || 60; validKeysParsed++; }
            if (key === 'spotlightCone') { currentSettings.spotlightCone = parseInt(val, 10) || 35; validKeysParsed++; }
            if (key === 'spotlightIntensity') { currentSettings.spotlightIntensity = parseFloat(val) || 2.0; validKeysParsed++; }
            if (key === 'spotlightColor') { currentSettings.spotlightColor = val || '#ffffff'; validKeysParsed++; }
            if (key === 'enableStudioLights') { currentSettings.enableStudioLights = (val !== 'false'); validKeysParsed++; }
            if (key === 'ambientIntensity') { currentSettings.ambientIntensity = parseFloat(val) !== undefined && !isNaN(parseFloat(val)) ? parseFloat(val) : 0.70; validKeysParsed++; }
            if (key === 'activeModel') { currentSettings.activeModel = val || 'procedural'; validKeysParsed++; }
            if (key === 'activeAnimation') { currentSettings.activeAnimation = val || 'default'; validKeysParsed++; }
            if (key === 'clickCount') { currentSettings.clickCount = parseInt(val, 10) || 0; validKeysParsed++; }
            if (key === 'fontSizeScale') { currentSettings.fontSizeScale = parseFloat(val) || 1.0; validKeysParsed++; }
            if (key === 'targetFps') { currentSettings.targetFps = parseInt(val, 10) || 60; validKeysParsed++; }
            if (key === 'language') { currentSettings.language = val || 'en'; validKeysParsed++; }
          }
        });
        if (validKeysParsed === 0) {
          throw new Error('No valid keys could be parsed from settings file');
        }
        return { hasSettingsFile: true, wasConfigHealed: false };
      } catch (e) {
        console.error('Error reading/parsing settings file. Resetting to defaults:', e);
        wasConfigHealed = true;
        if (ipcRenderer) {
          ipcRenderer.send('log-diagnostic', `[Config Recovery] Settings file corrupted/empty: ${e.message || e}. Restoring factory defaults and rewriting file.`);
        }

        const defaults = SettingsManager.getDefaultSettings();
        Object.assign(currentSettings, defaults);

        try {
          const tmpPath = filePath + '.tmp';
          fs.writeFileSync(tmpPath, defaultContent, 'utf8');
          fs.renameSync(tmpPath, filePath);
          console.log('Successfully recovered and rewrote settings file from defaults');
        } catch (err) {
          console.error('Failed to write recovery settings file:', err);
        }
        return { hasSettingsFile: true, wasConfigHealed: true };
      }
    }

    return { hasSettingsFile: false, wasConfigHealed: false };
  }

  static saveSettingsFile({ fs, path, getAssetsPath, currentSettings }) {
    if (!fs || !path || typeof getAssetsPath !== 'function' || !currentSettings) return;

    const assetsDir = getAssetsPath();
    const settingsFile = path.join(assetsDir, 'settings');
    const settingsTxtFile = path.join(assetsDir, 'settings.txt');
    const filePath = fs.existsSync(settingsTxtFile) ? settingsTxtFile : settingsFile;

    const content = `width=${currentSettings.width}
height=${currentSettings.height}
scale=${currentSettings.scale}
bobbing=${currentSettings.bobbing}
spinX=${currentSettings.spinX}
spinY=${currentSettings.spinY}
spinZ=${currentSettings.spinZ}
speedX=${currentSettings.speedX}
speedY=${currentSettings.speedY}
speedZ=${currentSettings.speedZ}
gpuOptimize=${currentSettings.gpuOptimize}
gpuLowPower=${currentSettings.gpuLowPower}
idleFpsSaver=${currentSettings.idleFpsSaver}
dynamicBatterySaver=${currentSettings.dynamicBatterySaver === true}
mouseOptimize=${currentSettings.mouseOptimize}
settingsLeft=${currentSettings.settingsLeft}
lockPosition=${currentSettings.lockPosition}
viewOnly=${currentSettings.viewOnly}
sakuraRain=${currentSettings.sakuraRain !== false}
snowFall=${currentSettings.snowFall === true}
enablePhysics=${currentSettings.enablePhysics}
physicsGravity=${currentSettings.physicsGravity}
physicsElasticity=${currentSettings.physicsElasticity}
physicsFloor=${currentSettings.physicsFloor}
showXYZCoords=${currentSettings.showXYZCoords}
showGroundGrid=${currentSettings.showGroundGrid}
enableFPSMode=${currentSettings.enableFPSMode}
spotlights=${JSON.stringify(currentSettings.spotlights || [])}
enableStudioLights=${currentSettings.enableStudioLights}
ambientIntensity=${currentSettings.ambientIntensity}
activeModel=${currentSettings.activeModel}
activeAnimation=${currentSettings.activeAnimation}
clickCount=${currentSettings.clickCount}
fontSizeScale=${currentSettings.fontSizeScale}
targetFps=${currentSettings.targetFps || 60}
language=${currentSettings.language}`;

    try {
      const tmpPath = filePath + '.tmp';
      fs.writeFileSync(tmpPath, content, 'utf8');
      fs.renameSync(tmpPath, filePath);
      console.log('Saved settings atomically to file:', filePath);
    } catch (e) {
      console.error('Error writing settings file atomically:', e);
    }
  }
}
