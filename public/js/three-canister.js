/**
 * THREE.JS 35MM FILM CANISTER — CHASIS NEUTRO FOTORREALISTA ESTÉTICA ANALÓGICA
 * Chasis de celuloide verde oscuro mate + detalles metálicos plata (estilo rollo fotoquímico clásico)
 * Sin textos impresos invasivos / Solo textura de material PBR
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
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

    // --- MATERIALES PBR REALISTAS (CHASIS NEUTRO VERDE OSCURO MATE + PLATA) ---
    // Cuerpo verde oscuro esmaltado mate (evoca películas fotoquímicas de alta sensibilidad)
    const canisterBodyMaterial = new THREE.MeshStandardMaterial({
        color: 0x15281e,
        roughness: 0.38,
        metalness: 0.65
    });

    // Franja decorativa plata satinada
    const silverStripeMaterial = new THREE.MeshStandardMaterial({
        color: 0xd8ded9,
        roughness: 0.22,
        metalness: 0.9
    });

    // Tapas y bordes metálicos pulidos
    const capMetalMaterial = new THREE.MeshStandardMaterial({
        color: 0x222624,
        roughness: 0.28,
        metalness: 0.92
    });

    // Felpa negra estanca del labio de salida
    const velvetMaterial = new THREE.MeshStandardMaterial({
        color: 0x050505,
        roughness: 0.98,
        metalness: 0.05
    });

    // --- GEOMETRÍA DEL CHASIS 35MM (PROPORCIONES REALES) ---
    // 1. Cuerpo Cilíndrico Principal
    const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3.2, 64);
    const bodyMesh = new THREE.Mesh(bodyGeometry, canisterBodyMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    canisterGroup.add(bodyMesh);

    // Franjas de color y metal plata en el cilindro (procedural limpio, sin texto)
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
    canisterGroup.add(bottomCap);

    // 3. Tapa Superior Estriada (Dientes de Carrete 35mm)
    const topCapGeo = new THREE.CylinderGeometry(1.24, 1.24, 0.25, 64);
    const topCap = new THREE.Mesh(topCapGeo, capMetalMaterial);
    topCap.position.y = 1.68;
    canisterGroup.add(topCap);

    // Dientes radiales de la tapa
    const gearRingGroup = new THREE.Group();
    const toothGeo = new THREE.BoxGeometry(0.04, 0.2, 0.08);
    for (let i = 0; i < 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        const tooth = new THREE.Mesh(toothGeo, capMetalMaterial);
        tooth.position.set(Math.cos(angle) * 1.23, 1.68, Math.sin(angle) * 1.23);
        tooth.rotation.y = -angle;
        gearRingGroup.add(tooth);
    }
    canisterGroup.add(gearRingGroup);

    // 4. Eje Central de Rebobinado Superior (Spool Pin)
    const pinGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.45, 32);
    const pinMesh = new THREE.Mesh(pinGeo, capMetalMaterial);
    pinMesh.position.y = 1.95;
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
    canisterGroup.add(lipMesh);

    // --- CINTA PROCEDURAL DE CELULOIDE 35MM DESPLEGABLE ---
    const filmWidth = 6.2;
    const filmHeight = 2.4;
    const filmGeo = new THREE.PlaneGeometry(filmWidth, filmHeight, 32, 1);
    
    // Generar textura de película analógica limpia con perforaciones y fotogramas
    const filmCanvas = document.createElement('canvas');
    filmCanvas.width = 2048;
    filmCanvas.height = 768;
    const fCtx = filmCanvas.getContext('2d');

    function drawFilmTexture(images) {
        fCtx.fillStyle = '#080706';
        fCtx.fillRect(0, 0, filmCanvas.width, filmCanvas.height);

        // Perforaciones 35mm arriba y abajo
        fCtx.fillStyle = '#000000';
        const numHoles = 32;
        const holeWidth = 26;
        const holeHeight = 44;
        const holeRadius = 6;

        for (let i = 0; i < numHoles; i++) {
            const x = 30 + i * 62;
            // Perforación superior
            drawRoundedRect(fCtx, x, 25, holeWidth, holeHeight, holeRadius);
            // Perforación inferior
            drawRoundedRect(fCtx, x, filmCanvas.height - 69, holeWidth, holeHeight, holeRadius);

            // Numeración sutil de fotogramas analógicos (01A, 02A...)
            fCtx.fillStyle = '#c49a5a';
            fCtx.font = 'bold 18px "Space Mono", monospace';
            if (i % 4 === 0) {
                const frameNum = String(Math.floor(i / 4) + 1).padStart(2, '0') + 'A';
                fCtx.fillText(frameNum, x - 5, filmCanvas.height - 18);
                fCtx.fillText('35mm FILM', x - 12, 20);
            }
            fCtx.fillStyle = '#000000';
        }

        // Dibujar fotogramas reales de León Feldman
        const frameW = 420;
        const frameH = 310;
        const frameY = 110;

        for (let j = 0; j < 4; j++) {
            const frameX = 80 + j * 480;
            fCtx.fillStyle = '#141310';
            fCtx.fillRect(frameX, frameY, frameW, frameH);

            if (images && images[j]) {
                try {
                    fCtx.drawImage(images[j], frameX + 8, frameY + 8, frameW - 16, frameH - 16);
                } catch (e) {
                    // Fallback silencioso
                }
            } else {
                fCtx.fillStyle = '#1c1a17';
                fCtx.fillRect(frameX + 8, frameY + 8, frameW - 16, frameH - 16);
            }
        }
        filmTexture.needsUpdate = true;
    }

    function drawRoundedRect(c, x, y, w, h, r) {
        c.beginPath();
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
        c.closePath();
        c.fill();
    }

    const filmTexture = new THREE.CanvasTexture(filmCanvas);
    const filmMaterial = new THREE.MeshStandardMaterial({
        map: filmTexture,
        roughness: 0.32,
        metalness: 0.15,
        side: THREE.DoubleSide
    });

    const filmMesh = new THREE.Mesh(filmGeo, filmMaterial);
    filmMesh.position.set(1.3 + filmWidth / 2, 0, 0.15);
    canisterGroup.add(filmMesh);

    // Escalar la tira de película inicialmente replegada
    let filmProgress = 0.08;
    let targetProgress = 0.08;

    filmMesh.scale.set(filmProgress, 1, 1);
    filmMesh.position.x = 1.3 + (filmWidth * filmProgress) / 2;

    // Cargar fotos reales locales
    const samplePhotos = [
        'Anal%C3%B3gicas/000005570003.jpg',
        'Calle/DSC08306.jpg',
        'Natura/DSC01567.jpg',
        'Analógicas/000041600005.jpg'
    ];
    const loadedImages = [];
    let loadCount = 0;
    samplePhotos.forEach((src, idx) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            loadedImages[idx] = img;
            loadCount++;
            if (loadCount >= 2) drawFilmTexture(loadedImages);
        };
        img.onerror = () => loadCount++;
        img.src = src;
    });
    drawFilmTexture(null);

    // --- INTERACTIVIDAD & DESPLIEGUE SUAVE ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationY = 0.3;
    let targetRotationX = 0.15;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        targetRotationY = 0.3 + mouseX * 0.45;
        targetRotationX = 0.15 - mouseY * 0.3;
    });

    container.addEventListener('mouseenter', () => {
        targetProgress = 0.95; // Desplegar película al 95%
    });

    container.addEventListener('mouseleave', () => {
        targetProgress = 0.08; // Regresar a reposo
    });

    container.addEventListener('click', () => {
        const lightTableSection = document.getElementById('mesa-de-luz') || document.getElementById('portfolio');
        if (lightTableSection) lightTableSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Responsive Resize
    window.addEventListener('resize', () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- ANIMATION LOOP (60 FPS PBR) ---
    function animate() {
        requestAnimationFrame(animate);

        canisterGroup.rotation.y += (targetRotationY - canisterGroup.rotation.y) * 0.06;
        canisterGroup.rotation.x += (targetRotationX - canisterGroup.rotation.x) * 0.06;

        filmProgress += (targetProgress - filmProgress) * 0.08;
        filmMesh.scale.x = filmProgress;
        filmMesh.position.x = 1.3 + (filmWidth * filmProgress) / 2;

        const positions = filmGeo.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const u = positions.getX(i);
            const zCurve = Math.sin((u / filmWidth) * Math.PI) * 0.45 * filmProgress;
            positions.setZ(i, zCurve);
        }
        filmGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }
    animate();
})();
