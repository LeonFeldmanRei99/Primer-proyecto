/**
 * THREE.JS CLASSICAL HUMAN BUST — ESCULTURA PROCEDURAL 360°
 * Busto humano estilizado: cabeza, cuello, hombros sobre base
 * Material piedra/arcilla mate + detalles sutiles
 * Control total de rotación (drag + auto-rotate) / Sin dependencias externas
 */

(function () {
    const container = document.getElementById('canvas-3d-container');
    if (!container || typeof THREE === 'undefined') return;

    // --- ESCENA, CÁMARA Y RENDERER ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.2, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // --- GRUPO PRINCIPAL DEL BUSTO ---
    const bustGroup = new THREE.Group();
    scene.add(bustGroup);
    bustGroup.position.set(0, -0.3, 0);

    // --- ILUMINACIÓN ESCULTÓRICA (ESTUDIO DE ESCULTURA) ---
    const ambientLight = new THREE.AmbientLight(0xf5f0e8, 0.45);
    scene.add(ambientLight);

    // Key Light - lateral superior (resalta volumen)
    const keyLight = new THREE.DirectionalLight(0xfff8f0, 2.2);
    keyLight.position.set(4, 5, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    keyLight.shadow.bias = -0.001;
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    scene.add(keyLight);

    // Fill Light - opuesta, más suave
    const fillLight = new THREE.DirectionalLight(0xe8e0d8, 0.7);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    // Rim Light - contorno posterior
    const rimLight = new THREE.PointLight(0xd4c8b8, 2.5, 15);
    rimLight.position.set(-1, 3, -4);
    scene.add(rimLight);

    // Light inferior sutil (rebote)
    const bounceLight = new THREE.DirectionalLight(0xf0e8e0, 0.35);
    bounceLight.position.set(0, -4, 0);
    scene.add(bounceLight);

    // --- MATERIALES PBR ESCULTÓRICOS ---
    // Piedra/arcilla mate cálida
    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0xe8ddd4,
        roughness: 0.85,
        metalness: 0.02,
        clearcoat: 0.05,
        clearcoatRoughness: 0.9
    });

    // Base más oscura
    const baseMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3632,
        roughness: 0.75,
        metalness: 0.05
    });

    // Detalles sutiles (ojos, boca) - ligeramente más oscuros
    const detailMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2622,
        roughness: 0.9,
        metalness: 0.0
    });

    // --- GEOMETRÍA DEL BUSTO (PROCEDURAL) ---

    // 1. CABEZA (esfera achatada)
    const headGeometry = new THREE.SphereGeometry(1.15, 64, 48, 0, Math.PI * 2, 0, Math.PI * 0.95);
    const headMesh = new THREE.Mesh(headGeometry, stoneMaterial);
    headMesh.position.y = 1.35;
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    // Aplanar ligeramente la parte trasera
    const headPos = headGeometry.attributes.position;
    for (let i = 0; i < headPos.count; i++) {
        const z = headPos.getZ(i);
        if (z < -0.2) {
            headPos.setZ(i, z * 0.85);
        }
    }
    headGeometry.computeVertexNormals();
    bustGroup.add(headMesh);

    // 2. CUELLO (cilindro cónico)
    const neckGeometry = new THREE.CylinderGeometry(0.42, 0.52, 1.0, 32);
    const neckMesh = new THREE.Mesh(neckGeometry, stoneMaterial);
    neckMesh.position.y = 0.55;
    neckMesh.castShadow = true;
    neckMesh.receiveShadow = true;
    bustGroup.add(neckMesh);

    // 3. HOMBROS / TORSO SUPERIOR (esfera achatada grande cortada)
    const shouldersGeometry = new THREE.SphereGeometry(1.45, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.48);
    const shouldersMesh = new THREE.Mesh(shouldersGeometry, stoneMaterial);
    shouldersMesh.position.y = -0.05;
    shouldersMesh.scale.set(1.0, 0.7, 0.65);
    shouldersMesh.castShadow = true;
    shouldersMesh.receiveShadow = true;
    bustGroup.add(shouldersMesh);

    // 4. BASE CILÍNDRICA (pedestal clásico)
    const baseGeo = new THREE.CylinderGeometry(0.85, 1.0, 0.6, 48);
    const baseMesh = new THREE.Mesh(baseGeo, baseMaterial);
    baseMesh.position.y = -0.85;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    bustGroup.add(baseMesh);

    // Base superior (moldura)
    const baseTopGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.08, 48);
    const baseTopMesh = new THREE.Mesh(baseTopGeo, baseMaterial);
    baseTopMesh.position.y = -0.53;
    baseTopMesh.castShadow = true;
    bustGroup.add(baseTopMesh);

    // Base inferior (moldura)
    const baseBotGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.08, 48);
    const baseBotMesh = new THREE.Mesh(baseBotGeo, baseMaterial);
    baseBotMesh.position.y = -1.17;
    baseBotMesh.castShadow = true;
    bustGroup.add(baseBotMesh);

    // 5. DETALLES FACIALES SUTILES (sugeridos, no realistas)

    // Orbitas oculares (depresiones sutiles)
    const eyeSocketGeo = new THREE.SphereGeometry(0.18, 16, 12);
    const leftEyeSocket = new THREE.Mesh(eyeSocketGeo, detailMaterial);
    leftEyeSocket.position.set(-0.32, 1.48, 0.92);
    leftEyeSocket.scale.set(1, 0.7, 0.3);
    bustGroup.add(leftEyeSocket);

    const rightEyeSocket = new THREE.Mesh(eyeSocketGeo, detailMaterial);
    rightEyeSocket.position.set(0.32, 1.48, 0.92);
    rightEyeSocket.scale.set(1, 0.7, 0.3);
    bustGroup.add(rightEyeSocket);

    // Nariz (volumen simple)
    const noseGeo = new THREE.ConeGeometry(0.08, 0.35, 8);
    const noseMesh = new THREE.Mesh(noseGeo, stoneMaterial);
    noseMesh.position.set(0, 1.32, 1.08);
    noseMesh.rotation.x = Math.PI * 0.55;
    noseMesh.castShadow = true;
    noseMesh.receiveShadow = true;
    bustGroup.add(noseMesh);

    // Línea de la boca (depresión sutil)
    const mouthGeo = new THREE.TorusGeometry(0.12, 0.02, 8, 24, Math.PI);
    const mouthMesh = new THREE.Mesh(mouthGeo, detailMaterial);
    mouthMesh.position.set(0, 1.05, 1.02);
    mouthMesh.rotation.x = -Math.PI * 0.5;
    bustGroup.add(mouthMesh);

    // 6. OREJAS (formas simples)
    const earGeo = new THREE.SphereGeometry(0.14, 12, 10);
    const leftEar = new THREE.Mesh(earGeo, stoneMaterial);
    leftEar.position.set(-0.98, 1.32, 0.1);
    leftEar.scale.set(0.6, 1.1, 0.35);
    leftEar.rotation.y = Math.PI * 0.5;
    bustGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, stoneMaterial);
    rightEar.position.set(0.98, 1.32, 0.1);
    rightEar.scale.set(0.6, 1.1, 0.35);
    rightEar.rotation.y = -Math.PI * 0.5;
    bustGroup.add(rightEar);

    // --- PLANO DE SUELO (para sombras) ---
    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.12 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.45;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- CONTROLES DE ROTACIÓN 360° ---
    let isUserInteracting = false;
    let isAutoRotating = true;
    let autoRotateSpeed = 0.0012;
    let targetRotationY = 0;
    let targetRotationX = 0.1;
    let velocityX = 0;
    let velocityY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;

    function onPointerDown(e) {
        isUserInteracting = true;
        isAutoRotating = false;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        container.style.cursor = 'grabbing';
    }

    function onPointerMove(e) {
        if (!isUserInteracting) return;
        const deltaX = e.clientX - lastMouseX;
        const deltaY = e.clientY - lastMouseY;
        velocityX = deltaX * 0.004;
        velocityY = deltaY * 0.004;
        targetRotationY += velocityX;
        targetRotationX = THREE.MathUtils.clamp(targetRotationX + velocityY, -Math.PI / 2.2, Math.PI / 2.2);
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }

    function onPointerUp() {
        isUserInteracting = false;
        container.style.cursor = 'grab';
        setTimeout(() => { if (!isUserInteracting) isAutoRotating = true; }, 3000);
    }

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointerleave', onPointerUp);

    container.addEventListener('touchstart', (e) => onPointerDown(e.touches[0]), { passive: true });
    window.addEventListener('touchmove', (e) => onPointerMove(e.touches[0]), { passive: true });
    window.addEventListener('touchend', onPointerUp);

    container.addEventListener('click', (e) => {
        if (Math.abs(velocityX) < 0.001 && Math.abs(velocityY) < 0.001) {
            const lightTableSection = document.getElementById('mesa-de-luz') || document.getElementById('portfolio');
            if (lightTableSection) lightTableSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Responsive Resize
    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- ANIMATION LOOP ---
    let isTabVisible = true;
    let shadowNeedsUpdate = true;

    function animate() {
        if (!isTabVisible) {
            requestAnimationFrame(animate);
            return;
        }
        requestAnimationFrame(animate);

        if (isAutoRotating) {
            targetRotationY += autoRotateSpeed;
        }

        bustGroup.rotation.y += (targetRotationY - bustGroup.rotation.y) * 0.05;
        bustGroup.rotation.x += (targetRotationX - bustGroup.rotation.x) * 0.05;

        if (!isUserInteracting) {
            velocityX *= 0.95;
            velocityY *= 0.95;
            targetRotationY += velocityX;
            targetRotationX = THREE.MathUtils.clamp(targetRotationX + velocityY, -Math.PI / 2.2, Math.PI / 2.2);
        }

        if (shadowNeedsUpdate) {
            renderer.shadowMap.needsUpdate = true;
            shadowNeedsUpdate = false;
        }

        renderer.render(scene, camera);
    }

    document.addEventListener('visibilitychange', () => {
        isTabVisible = !document.hidden;
        if (isTabVisible) shadowNeedsUpdate = true;
    });

    container.style.cursor = 'grab';
    animate();
})();