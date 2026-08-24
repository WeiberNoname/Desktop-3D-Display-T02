/**
 * Settings Panel Edge Resize Handler Module
 * Enables real-time drag-to-resize window behavior when hovering and dragging the edges/corners of the settings panel.
 */

export function setupSettingsPanelResize(deps) {
  const {
    panel,
    currentSettings,
    ipcRenderer,
    saveSettingsFile,
    widthSlider,
    heightSlider,
    valWidth,
    valHeight,
    state
  } = deps;

  if (!panel) return null;

  const detectEdge = (e) => {
    if (!state || !state.isSettingsOpen) return null;
    const rect = panel.getBoundingClientRect();
    const margin = 10; // 10px hit region along outer/inner edges of panel
    const nearLeft = Math.abs(e.clientX - rect.left) <= margin;
    const nearRight = Math.abs(e.clientX - rect.right) <= margin;
    const nearTop = Math.abs(e.clientY - rect.top) <= margin;
    const nearBottom = Math.abs(e.clientY - rect.bottom) <= margin;

    if (nearRight && nearBottom) return 'se';
    if (nearLeft && nearBottom) return 'sw';
    if (nearRight && nearTop) return 'ne';
    if (nearLeft && nearTop) return 'nw';
    if (nearRight) return 'e';
    if (nearBottom) return 's';
    if (nearLeft) return 'w';
    if (nearTop) return 'n';
    return null;
  };

  const getCursorForEdge = (edge) => {
    switch (edge) {
      case 'se': case 'nw': return 'nwse-resize';
      case 'sw': case 'ne': return 'nesw-resize';
      case 'e': case 'w': return 'ew-resize';
      case 's': case 'n': return 'ns-resize';
      default: return 'default';
    }
  };

  window.addEventListener('mousemove', (e) => {
    if (!state || !state.isSettingsOpen) return;

    if (state.isResizingPanel) {
      const deltaX = e.screenX - state.resizeStartMouseX;
      const deltaY = e.screenY - state.resizeStartMouseY;
      const edge = state.resizeEdge;

      let newW = state.resizeStartWidth;
      let newH = state.resizeStartHeight;

      if (edge.includes('e')) newW += deltaX;
      if (edge.includes('w')) newW -= deltaX;
      if (edge.includes('s')) newH += deltaY;
      if (edge.includes('n')) newH -= deltaY;

      const maxW = window.screen ? window.screen.width : 1920;
      const maxH = window.screen ? window.screen.height : 1080;
      newW = Math.max(300, Math.min(maxW, Math.round(newW)));
      newH = Math.max(300, Math.min(maxH, Math.round(newH)));

      currentSettings.width = newW;
      currentSettings.height = newH;

      if (widthSlider) widthSlider.value = newW;
      if (valWidth) valWidth.innerText = newW;
      if (heightSlider) heightSlider.value = newH;
      if (valHeight) valHeight.innerText = newH;

      const activeCamera = deps.camera || (deps.getCamera ? deps.getCamera() : null);
      const activeRenderer = deps.renderer || (deps.getRenderer ? deps.getRenderer() : null);

      if (activeCamera && activeRenderer) {
        activeCamera.aspect = newW / newH;
        activeCamera.updateProjectionMatrix();
        activeRenderer.setSize(newW, newH);
      }

      if (ipcRenderer) {
        ipcRenderer.send('resize-window', { width: newW, height: newH });
      }
      return;
    }

    if (!state.isDragging) {
      const edge = detectEdge(e);
      if (edge) {
        const cursor = getCursorForEdge(edge);
        panel.style.cursor = cursor;
        document.body.style.cursor = cursor;
      } else {
        if (panel.style.cursor && panel.style.cursor.includes('resize')) {
          panel.style.cursor = 'default';
          document.body.style.cursor = 'default';
        }
      }
    }
  });

  panel.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !state || !state.isSettingsOpen) return;
    const edge = detectEdge(e);
    if (edge) {
      e.stopPropagation();
      e.preventDefault();
      state.isResizingPanel = true;
      state.resizeEdge = edge;
      state.resizeStartMouseX = e.screenX;
      state.resizeStartMouseY = e.screenY;
      state.resizeStartWidth = currentSettings.width || window.innerWidth;
      state.resizeStartHeight = currentSettings.height || window.innerHeight;
      panel.classList.add('resizing');
      const cursor = getCursorForEdge(edge);
      document.body.style.cursor = cursor;
      if (deps.updateIgnoreMouseState) deps.updateIgnoreMouseState();
    }
  });

  window.addEventListener('mouseup', () => {
    if (state && state.isResizingPanel) {
      state.isResizingPanel = false;
      panel.classList.remove('resizing');
      panel.style.cursor = 'default';
      document.body.style.cursor = 'default';
      if (saveSettingsFile) saveSettingsFile();
      if (deps.updateIgnoreMouseState) deps.updateIgnoreMouseState();
    }
  });

  return detectEdge;
}
