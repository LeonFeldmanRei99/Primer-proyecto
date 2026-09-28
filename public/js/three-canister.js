/**
 * THREE.JS 35MM FILM CANISTER — CHASIS NEUTRO FOTORREALISTA 360°
 * Chasis de celuloide verde oscuro mate + detalles metálicos plata
 * Control total de rotación (drag + auto-rotate) / Sin tira de película
 */

(function () {
    const container = document.getElementById('canvas-3d-container');
    if (!container || typeof THREE === 'undefined') return;

    // --- ESCENA, CÁMARA Y RENDERER ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- GRUPO PRINCIPAL DEL CHASIS ---
    const canisterGroup = new THREE.Group();
    scene.add(canisterGroup);
    canisterGroup.position.set(-0.8, 0, 0);

    // --- ILUMINACIÓN FOTOGRÁFICA DE ESTUDIO (CINEMA SETUP) ---
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 0.6);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.6);
    keyLight.position.set(5, 6, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 512;
    keyLight.shadow.mapSize.height = 512;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill Light fría
    const fillLight = new THREE.DirectionalLight(0x90b8d0, 0.9);
    fillLight.position.set(-6, -2, 4);
    scene.add(fillLight);

    // Rim Light posterior
    const rimLight = new THREE.PointLight(0xc49a5a, 3.2, 20);
    rimLight.position.set(2, 4, -4);
    scene.add(rimLight);

    // --- MATERIALES PBR REALISTAS ---
    const canisterBodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x15281e,
        roughness: 0.38,
        metalness: 0.65
    });

    const silverStripeMaterial = new THREE.MeshStandardMaterial({
        color: 0xd8ded9,
        roughness: 0.22,
        metalness: 0.9
    });

    const capMetalMaterial = new THREE.MeshStandardMaterial({
        color: 0x222624,
        roughness: 0.28,
        metalness: 0.92
    });

    const velvetMaterial = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.98,
        metalness: 0.05
    });

    // --- GEOMETRÍA DEL CHASIS 35MM (SIN TIR DE PELÍCULA) ---
    // 1. Cuerpo Cilíndrico Principal
    const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3.2, 64);
    const bodyMesh = new THREE.Mesh(bodyGeometry, canisterBodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    canisterGroup.add(bodyMesh);

    // Franjas decorativas plata
    const stripeGeoTop = new THREE.CylinderGeometry(1.206, 1.206, 0.25, 64);
    const stripeMeshTop = new THREE.Mesh(stripeGeoTop, silverStripeMaterial);
    stripeMeshTop.position.y = 1.0;
    canisterGroup.add(stripeMeshTop);

    const stripeGeoBottom = new THREE.CylinderGeometry(1.206, 1.206, 0.25, 64);
    const stripeMeshBottom = new THREE.Mesh(stripeGeoBottom, silverStripeMaterial);
    stripeMeshBottom.position.y = -1.0;
    canisterGroup.add(stripeMeshBottom);

    // 2. Tapa Inferior Plana
    const bottomCapGeo = new THREE.CylinderGeometry(1.23, 1.23, 0.18, 64);
    const bottomCap = new THREE.Mesh(bottomCapGeo, capMetalMaterial);
    bottomCap.position.y = -1.65;
    bottomCap.castShadow = true;
    bottomCap.receiveShadow = true;
    canisterGroup.add(bottomCap);

    // 3. Tapa Superior Estriada (Dientes de Carrete 35mm)
    const topCapGeo = new THREE.CylinderGeometry(1.24, 1.24, 0.25, 64);
    const topCap = new THREE.Mesh(topCapGeo, capMetalMaterial);
    topCap.position.y = 1.68;
    topCap.castShadow = true;
    topCap.receiveShadow = true;
    canisterGroup.add(topCap);

    // Dientes radiales de la tapa
    const gearRingGroup = new THREE.Group();
    const toothGeo = new THREE.BoxGeometry(0.04, 0.2, 0.08);
    for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        const tooth = new THREE.Mesh(toothGeo, capMetalMaterial);
        tooth.position.set(Math.cos(angle) * 1.23, 1.68, Math.sin(angle) * 1.23);
        tooth.rotation.y = -angle;
        tooth.castShadow = true;
        gearRingGroup.add(tooth);
    }
    canisterGroup.add(gearRingGroup);

    // 4. Eje Central de Rebobinado Superior (Spool Pin)
    const pinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.45, 32);
    const pinMesh = new THREE.Mesh(pinGeo, capMetalMaterial);
    pinMesh.position.y = 1.95;
    pinMesh.castShadow = true;
    canisterGroup.add(pinMesh);

    const pinHoleGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.2, 32);
    const pinHole = new THREE.Mesh(pinHoleGeo, new THREE.MeshBasicMaterial({ color: 0x020202 }));
    pinHole.position.y = 2.12;
    canisterGroup.add(pinHole);

    // 5. Labio de Felpa Negra de Salida
    const lipGeo = new THREE.BoxGeometry(0.25, 2.9, 0.35);
    const lipMesh = new THREE.Mesh(lipGeo, velvetMaterial);
    lipMesh.position.set(1.18, 0, 0.15);
    lipMesh.rotation.y = -0.15;
    lipMesh.castShadow = true;
    lipMesh.receiveShadow = true;
    canisterGroup.add(lipMesh);

    // --- CONTROLES DE ROTACIÓN 360° ---
    let isUserInteracting = false;
    let isAutoRotating = true;
    let autoRotateSpeed = 0.0015;
    let targetRotationY = 0;
    let targetRotationX = 0.15;
    let velocityX = 0;
    let velocityY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;

    // Drag to rotate
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
        targetRotationX = THREE.MathUtils.clamp(targetRotationX + velocityY, -Math.PI / 2.5, Math.PI / 2.5);
        
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    }

    function onPointerUp() {
        isUserInteracting = false;
        container.style.cursor = 'grab';
        
        // Resume auto-rotate after 3 seconds of inactivity
        setTimeout(() => {
            if (!isUserInteracting) isAutoRotating = true;
        }, 3000);
    }

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointerleave', onPointerUp);

    // Touch support
    container.addEventListener('touchstart', (e) => onPointerDown(e.touches[0]), { passive: true });
    window.addEventListener('touchmove', (e) => onPointerMove(e.touches[0]), { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Click to navigate to portfolio
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

        // Auto-rotate when not interacting
        if (isAutoRotating) {
            targetRotationY += autoRotateSpeed;
        }

        // Smooth rotation with inertia
        canisterGroup.rotation.y += (targetRotationY - canisterGroup.rotation.y) * 0.05;
        canisterGroup.rotation.x += (targetRotationX - canisterGroup.rotation.x) * 0.05;

        // Apply velocity decay when not interacting
        if (!isUserInteracting) {
            velocityX *= 0.95;
            velocityY *= 0.95;
            targetRotationY += velocityX;
            targetRotationX = THREE.MathUtils.clamp(targetRotationX + velocityY, -Math.PI / 2.5, Math.PI / 2.5);
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

    // Initial cursor
    container.style.cursor = 'grab';
    animate();
})();