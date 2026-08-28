/**
 * 3D Snow Fall Particle Engine
 * Creates realistic, glistening 3D snowflakes with soft fluttering,
 * micro-turbulence drift, depth parallax, and dynamic lighting response.
 */

export class SnowFallManager {
  /**
   * @param {Object} THREE - Three.js instance
   * @param {Object} scene - THREE.Scene instance
   * @param {number} count - Total number of falling snowflakes (default: 80)
   */
  constructor(THREE, scene, count = 80) {
    this.THREE = THREE;
    this.scene = scene;
    this.count = count;
    this.group = null;
    this.snowflakes = [];
    this.enabled = false;
    this.init();
  }

  /**
   * Creates organic crystalline snowflake geometry with soft 6-point radial symmetry.
   */
  createSnowflakeGeometry() {
    const THREE = this.THREE;
    const shape = new THREE.Shape();

    // 6-pointed crystalline star snowflake outline
    const points = 6;
    const outerRadius = 0.09;
    const innerRadius = 0.035;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i / (points * 2)) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape, 8);
    
    // Add subtle 3D facet beveling to catch lighting highlights
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      pos.setZ(i, (outerRadius - dist) * 0.15);
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  /**
   * Initializes snowflakes across the 3D viewport.
   */
  init() {
    if (!this.THREE || !this.scene) return;
    const THREE = this.THREE;

    this.group = new THREE.Group();
    this.group.name = 'SnowFallGroup';
    this.group.visible = this.enabled;

    const snowGeom = this.createSnowflakeGeometry();

    // Curated winter snow crystal palettes (pure white, crystal ice blue, soft frost)
    const snowColors = [
      0xffffff, // Pure Frost White
      0xf0f8ff, // Alice Ice Blue
      0xe6f3ff, // Glacial Crystal
      0xfafaff, // Snow Light
      0xd9edff  // Deep Crystal Flake
    ];

    const materials = snowColors.map(colorHex => {
      return new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
        depthWrite: false
      });
    });

    for (let i = 0; i < this.count; i++) {
      const mat = materials[i % materials.length];
      const mesh = new THREE.Mesh(snowGeom, mat);

      // Random scale variation
      const scale = 0.5 + Math.random() * 0.7;
      mesh.scale.set(scale, scale, scale);

      // Initial distributed 3D spatial position
      const x = (Math.random() - 0.5) * 5.2;
      const y = -1.8 + Math.random() * 5.5;
      const z = (Math.random() - 0.5) * 4.2;
      mesh.position.set(x, y, z);

      // Random initial orientation
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );

      const snowData = {
        mesh,
        fallSpeed: 0.35 + Math.random() * 0.45,
        driftSpeed: 0.8 + Math.random() * 1.2,
        driftMagnitude: 0.18 + Math.random() * 0.22,
        rotSpeedX: (Math.random() - 0.5) * 1.5,
        rotSpeedY: (Math.random() - 0.5) * 1.8,
        rotSpeedZ: (Math.random() - 0.5) * 2.2,
        phase: Math.random() * Math.PI * 2,
        baseX: x,
        baseZ: z
      };

      this.snowflakes.push(snowData);
      this.group.add(mesh);
    }

    this.scene.add(this.group);
  }

  /**
   * Updates snowflake positions and fluttering rotations per frame.
   * @param {number} delta - Frame delta time in seconds
   * @param {number} elapsed - Total elapsed time in seconds
   */
  update(delta, elapsed) {
    if (!this.enabled || !this.group || !this.group.visible) return;

    const clampedDelta = Math.min(delta, 0.1);

    for (let i = 0; i < this.snowflakes.length; i++) {
      const s = this.snowflakes[i];
      const mesh = s.mesh;

      // 1. Gentle downward snowfall descent
      mesh.position.y -= s.fallSpeed * clampedDelta;

      // 2. Soft horizontal meandering breeze drift
      const driftTime = elapsed * s.driftSpeed + s.phase;
      mesh.position.x = s.baseX + Math.sin(driftTime) * s.driftMagnitude + Math.sin(driftTime * 0.3) * 0.1;
      mesh.position.z = s.baseZ + Math.cos(driftTime * 0.7) * (s.driftMagnitude * 0.7);

      // 3. Gentle 3D spin
      mesh.rotation.x += s.rotSpeedX * clampedDelta;
      mesh.rotation.y += s.rotSpeedY * clampedDelta;
      mesh.rotation.z += s.rotSpeedZ * clampedDelta;

      // 4. Boundary wrapping
      if (mesh.position.y < -2.2) {
        mesh.position.y = 3.2 + Math.random() * 0.5;
        s.baseX = (Math.random() - 0.5) * 5.2;
        s.baseZ = (Math.random() - 0.5) * 4.2;
        mesh.position.x = s.baseX;
        mesh.position.z = s.baseZ;
      }
    }
  }

  /**
   * Toggle visibility / active state of Snow fall.
   * @param {boolean} enabled 
   */
  setEnabled(enabled) {
    this.enabled = !!enabled;
    if (this.group) {
      this.group.visible = this.enabled;
    }
  }

  /**
   * Cleans up meshes and removes group from scene.
   */
  dispose() {
    if (this.group && this.scene) {
      this.scene.remove(this.group);
      this.snowflakes.forEach(s => {
        if (s.mesh.geometry) s.mesh.geometry.dispose();
      });
      this.snowflakes = [];
      this.group = null;
    }
  }
}
