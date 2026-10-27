/**
 * CookMate - Real 3D Chef Character with Three.js
 * Articulated procedural 3D Cartoon Chef with 4 interactive animation states:
 * - IDLE
 * - LISTENING
 * - THINKING
 * - SPEAKING
 */

class Chef3DCharacter {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.currentState = 'idle'; // 'idle', 'listening', 'thinking', 'speaking'
    this.clock = new THREE.Clock();
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.mouthOpenFactor = 0;

    this.initScene();
    this.buildChefModel();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  initScene() {
    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
    this.camera.position.set(0, 1.35, 3.4);

    // 3. Renderer with antialiasing & shadow map
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xfff3e6, 0.9);
    this.scene.add(ambientLight);

    // Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.4);
    keyLight.position.set(2, 4, 3);
    keyLight.castShadow = true;
    this.scene.add(keyLight);

    // Subtle Amber Fill Light
    const fillLight = new THREE.DirectionalLight(0xff7733, 0.6);
    fillLight.position.set(-2.5, 2, 2);
    this.scene.add(fillLight);

    // Cyan Rim Light for separation
    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.5);
    rimLight.position.set(0, 3, -3);
    this.scene.add(rimLight);
  }

  buildChefModel() {
    this.chefGroup = new THREE.Group();
    this.chefGroup.position.set(0, -0.65, 0);

    // Common Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfc4,
      roughness: 0.5,
      metalness: 0.05
    });

    const blushMat = new THREE.MeshStandardMaterial({
      color: 0xfca5a5,
      roughness: 0.8
    });

    const whiteClothMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6,
      metalness: 0.05
    });

    const redScarfMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.4,
      metalness: 0.1
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.3
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1
    });

    const eyeIrisMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.2
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.6
    });

    // --- BODY (Double-breasted Chef Jacket) ---
    const bodyGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.95, 24);
    const bodyMesh = new THREE.Mesh(bodyGeo, whiteClothMat);
    bodyMesh.position.y = 0.58;
    bodyMesh.castShadow = true;
    this.chefGroup.add(bodyMesh);

    // Double-breasted buttons
    const btnGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.015, 12);
    btnGeo.rotateX(Math.PI / 2);
    for (let r = 0; r < 3; r++) {
      const yPos = 0.76 - r * 0.16;
      const b1 = new THREE.Mesh(btnGeo, darkMat);
      b1.position.set(-0.09, yPos, 0.40);
      this.chefGroup.add(b1);

      const b2 = new THREE.Mesh(btnGeo, darkMat);
      b2.position.set(0.09, yPos, 0.40);
      this.chefGroup.add(b2);
    }

    // --- NECK & RED SCARF ---
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.20, 0.2, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 1.12;
    this.chefGroup.add(neckMesh);

    // Scarf Collar Knot
    const scarfKnotGeo = new THREE.TorusGeometry(0.24, 0.065, 16, 24);
    scarfKnotGeo.rotateX(Math.PI / 2);
    const scarfKnot = new THREE.Mesh(scarfKnotGeo, redScarfMat);
    scarfKnot.position.y = 1.1;
    this.chefGroup.add(scarfKnot);

    // Scarf Hanging Ribbons
    const ribbonGeo = new THREE.BoxGeometry(0.09, 0.28, 0.04);
    const ribbon1 = new THREE.Mesh(ribbonGeo, redScarfMat);
    ribbon1.position.set(-0.04, 0.96, 0.40);
    ribbon1.rotation.z = 0.15;
    this.chefGroup.add(ribbon1);

    const ribbon2 = new THREE.Mesh(ribbonGeo, redScarfMat);
    ribbon2.position.set(0.04, 0.96, 0.40);
    ribbon2.rotation.z = -0.15;
    this.chefGroup.add(ribbon2);

    // --- HEAD GROUP ---
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.35, 0);

    // Head Sphere
    const headGeo = new THREE.SphereGeometry(0.42, 32, 28);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Cheeks
    const cheekGeo = new THREE.SphereGeometry(0.09, 16, 16);
    cheekGeo.scale(1, 0.6, 0.4);
    const leftCheek = new THREE.Mesh(cheekGeo, blushMat);
    leftCheek.position.set(-0.25, -0.06, 0.35);
    this.headGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, blushMat);
    rightCheek.position.set(0.25, -0.06, 0.35);
    this.headGroup.add(rightCheek);

    // Cute Nose
    const noseGeo = new THREE.SphereGeometry(0.06, 16, 16);
    noseGeo.scale(1, 0.8, 1);
    const noseMesh = new THREE.Mesh(noseGeo, blushMat);
    noseMesh.position.set(0, -0.02, 0.42);
    this.headGroup.add(noseMesh);

    // Eyes Group (Left & Right)
    this.leftEye = this.createEye(eyeWhiteMat, eyeIrisMat, darkMat);
    this.leftEye.position.set(-0.15, 0.08, 0.36);
    this.headGroup.add(this.leftEye);

    this.rightEye = this.createEye(eyeWhiteMat, eyeIrisMat, darkMat);
    this.rightEye.position.set(0.15, 0.08, 0.36);
    this.headGroup.add(this.rightEye);

    // Mouth Mesh (Animated when speaking)
    const mouthGeo = new THREE.BoxGeometry(0.16, 0.04, 0.06);
    this.mouthMesh = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({ color: 0x991b1b }));
    this.mouthMesh.position.set(0, -0.16, 0.39);
    this.headGroup.add(this.mouthMesh);

    // Hair Locks
    const hairGeo = new THREE.SphereGeometry(0.44, 24, 20);
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 0.08, -0.05);
    this.headGroup.add(hairMesh);

    // Front Hair Bangs
    const bangGeo = new THREE.ConeGeometry(0.12, 0.3, 8);
    for (let i = -2; i <= 2; i++) {
      const bang = new THREE.Mesh(bangGeo, hairMat);
      bang.position.set(i * 0.1, 0.32, 0.36);
      bang.rotation.x = Math.PI * 0.85;
      bang.rotation.z = -i * 0.15;
      this.headGroup.add(bang);
    }

    // --- TALL CHEF HAT ---
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 0.36, 0);

    // Hat Band
    const bandGeo = new THREE.CylinderGeometry(0.39, 0.41, 0.22, 24);
    const bandMesh = new THREE.Mesh(bandGeo, whiteClothMat);
    hatGroup.add(bandMesh);

    // Hat Crown (Puff)
    const puffGeo = new THREE.CylinderGeometry(0.55, 0.39, 0.48, 24);
    const puffMesh = new THREE.Mesh(puffGeo, whiteClothMat);
    puffMesh.position.y = 0.32;
    hatGroup.add(puffMesh);

    const topPuffGeo = new THREE.SphereGeometry(0.55, 24, 16);
    topPuffGeo.scale(1, 0.35, 1);
    const topPuff = new THREE.Mesh(topPuffGeo, whiteClothMat);
    topPuff.position.y = 0.55;
    hatGroup.add(topPuff);

    // Hat Logo Badge ("CookMate")
    const badgeGeo = new THREE.BoxGeometry(0.24, 0.08, 0.02);
    const badgeMesh = new THREE.Mesh(badgeGeo, new THREE.MeshBasicMaterial({ color: 0xff5722 }));
    badgeMesh.position.set(0, 0.04, 0.41);
    hatGroup.add(badgeMesh);

    this.headGroup.add(hatGroup);
    this.chefGroup.add(this.headGroup);

    // --- ARMS & HANDS ---
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.48, 0.95, 0);
    const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.52, 16);
    const leftArmMesh = new THREE.Mesh(armGeo, whiteClothMat);
    leftArmMesh.position.y = -0.24;
    this.leftArmGroup.add(leftArmMesh);

    const handGeo = new THREE.SphereGeometry(0.09, 16, 16);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.y = -0.52;
    this.leftArmGroup.add(leftHand);
    this.chefGroup.add(this.leftArmGroup);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.48, 0.95, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, whiteClothMat);
    rightArmMesh.position.y = -0.24;
    this.rightArmGroup.add(rightArmMesh);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.y = -0.52;
    this.rightArmGroup.add(rightHand);
    this.chefGroup.add(this.rightArmGroup);

    this.scene.add(this.chefGroup);
  }

  createEye(whiteMat, irisMat, pupilMat) {
    const eyeGroup = new THREE.Group();

    // Sclera
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 16), whiteMat);
    eyeGroup.add(sclera);

    // Iris
    const iris = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), irisMat);
    iris.rotateX(Math.PI / 2);
    iris.position.z = 0.065;
    eyeGroup.add(iris);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.022, 12), pupilMat);
    pupil.rotateX(Math.PI / 2);
    pupil.position.z = 0.07;
    eyeGroup.add(pupil);

    return eyeGroup;
  }

  setState(state) {
    this.currentState = state;
    const pill = document.getElementById('chef-state-text');
    const dot = document.getElementById('chef-state-dot');

    if (pill) {
      if (state === 'idle') pill.textContent = 'Chef: Ready to Help';
      else if (state === 'listening') pill.textContent = 'Chef: Listening to You...';
      else if (state === 'thinking') pill.textContent = 'Chef: Thinking...';
      else if (state === 'speaking') pill.textContent = 'Chef: Speaking Answer...';
    }

    if (dot) {
      dot.className = `state-dot ${state}`;
    }
  }

  onWindowResize() {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Blinking cycle every 3-4 seconds
    this.blinkTimer += delta;
    if (this.blinkTimer > 3.2) {
      this.isBlinking = true;
      if (this.blinkTimer > 3.35) {
        this.isBlinking = false;
        this.blinkTimer = 0;
      }
    }

    const eyeScaleY = this.isBlinking ? 0.1 : 1.0;
    this.leftEye.scale.y = eyeScaleY;
    this.rightEye.scale.y = eyeScaleY;

    // State-based dynamic animations
    switch (this.currentState) {
      case 'idle':
        // Gentle breathing and natural body bob
        this.chefGroup.position.y = -0.65 + Math.sin(time * 2) * 0.015;
        this.headGroup.rotation.y = Math.sin(time * 1.2) * 0.06;
        this.headGroup.rotation.x = Math.sin(time * 1.5) * 0.02;

        this.leftArmGroup.rotation.z = 0.15 + Math.sin(time * 1.8) * 0.04;
        this.rightArmGroup.rotation.z = -0.15 - Math.sin(time * 1.8) * 0.04;
        this.leftArmGroup.rotation.x = 0;
        this.rightArmGroup.rotation.x = 0;

        this.mouthMesh.scale.set(1, 0.4, 1);
        break;

      case 'listening':
        // Attentive tilt forward, leaning towards user
        this.chefGroup.position.y = -0.63;
        this.headGroup.rotation.y = 0.18 + Math.sin(time * 3) * 0.04;
        this.headGroup.rotation.x = 0.12;

        // Welcoming hand gesture toward the microphone
        this.rightArmGroup.rotation.x = -0.7 + Math.sin(time * 4) * 0.08;
        this.rightArmGroup.rotation.z = -0.4;
        this.leftArmGroup.rotation.z = 0.25;

        this.mouthMesh.scale.set(1.1, 0.7, 1);
        break;

      case 'thinking':
        // Head tilted up, right hand near chin
        this.chefGroup.position.y = -0.65 + Math.sin(time * 3) * 0.01;
        this.headGroup.rotation.y = -0.16 + Math.sin(time * 2) * 0.05;
        this.headGroup.rotation.x = -0.18;

        this.rightArmGroup.rotation.x = -1.35;
        this.rightArmGroup.rotation.z = -0.6;
        this.leftArmGroup.rotation.z = 0.2;

        this.mouthMesh.scale.set(0.8, 0.5, 1);
        break;

      case 'speaking':
        // Mouth opens and closes dynamically in sync with speech rhythm
        this.mouthOpenFactor = 0.5 + Math.sin(time * 14) * 0.45;
        this.mouthMesh.scale.set(1.3, this.mouthOpenFactor * 2.2, 1);

        // Expressive head nodding and gestures
        this.headGroup.rotation.x = Math.sin(time * 5) * 0.08;
        this.headGroup.rotation.y = Math.sin(time * 3) * 0.12;

        this.leftArmGroup.rotation.x = -0.5 + Math.sin(time * 4) * 0.2;
        this.leftArmGroup.rotation.z = 0.45;

        this.rightArmGroup.rotation.x = -0.6 + Math.sin(time * 4.5 + 1) * 0.25;
        this.rightArmGroup.rotation.z = -0.45;
        break;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Global 3D Chef instance
window.chef3D = null;

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('chef-3d-canvas');
  if (canvas && typeof THREE !== 'undefined') {
    try {
      window.chef3D = new Chef3DCharacter('chef-3d-canvas');
    } catch (e) {
      console.warn('Three.js 3D initialization failed, using fallback card:', e);
      const fallback = document.getElementById('chef-fallback-card');
      if (fallback) fallback.classList.add('active');
    }
  }
});
