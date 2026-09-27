/**
 * THREE.JS 35MM FILM CANISTER — PIEZA 3D INTERACTIVA FOTORREALISTA
 * Autor: León Feldman Reinoso — Dirección Visual & Fotografía Analógica
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
    const ambientLight = new THREE.AmbientLight(0xfff4e6, 0.6);
    scene.add(ambientLight);

    // Key Light cálida
    const keyLight = new THREE.DirectionalLight(0xffebd2, 2.5);
    keyLight.position.set(5, 6, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill Light fría sutil
    const fillLight = new THREE.DirectionalLight(0xa6c8e0, 0.8);
    fillLight.position.set(-6, -2, 4);
    scene.add(fillLight);

    // Rim Light posterior para recortar el metal del chasis
    const rimLight = new THREE.PointLight(0xc49a5a, 3.5, 20);
    rimLight.position.set(2, 4, -4);
    scene.add(rimLight);

    // --- MATERIALES PBR REALISTAS ---
    // Metal oscuro esmaltado para el cuerpo del chasis
    const canisterMetalMaterial = new THREE.MeshStandardMaterial({
        color: 0x11100e,
        roughness: 0.35,
        metalness: 0.85
    });

    // Metal pulido para tapas y rebordes
    const capMetalMaterial = new THREE.MeshStandardMaterial({
        color: 0x24201a,
        roughness: 0.25,
        metalness: 0.95
    });

    // Felpa / terciopelo negro mate estanco
    const velvetMaterial = new THREE.MeshStandardMaterial({
        color: 0x050404,
        roughness: 0.98,
        metalness: 0.05
    });

    // --- GEOMETRÍA DEL CHASIS 35MM (PROPORCIONES REALES) ---
    // 1. Cuerpo Cilíndrico Principal
    const bodyGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3.2, 64);
    const bodyMesh = new THREE.Mesh(bodyGeometry, canisterMetalMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    canisterGroup.add(bodyMesh);

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

    // 5. Labio de Felpa / Terciopelo Negro de Salida (Slot)
    const lipGeo = new THREE.BoxGeometry(0.25, 2.9, 0.35);
    const lipMesh = new THREE.Mesh(lipGeo, velvetMaterial);
    lipMesh.position.set(1.18, 0, 0.15);
    lipMesh.rotation.y = -0.15;
    canisterGroup.add(lipMesh);

    // --- ETIQUETA TIPOGRÁFICA PROCEDURAL 35MM (CANVAS TEXTURE) ---
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 1024;
    labelCanvas.height = 512;
    const ctx = labelCanvas.getContext('2d');

    ctx.fillStyle = '#100e0b';
    ctx.fillRect(0, 0, labelCanvas.width, labelCanvas.height);

    // Bandas doradas analógicas
    ctx.fillStyle = '#c49a5a';
    ctx.fillRect(0, 40, labelCanvas.width, 12);
    ctx.fillRect(0, labelCanvas.height - 52, labelCanvas.width, 12);

    // Tipografía técnica
    ctx.fillStyle = '#f5f0e6';
    ctx.font = 'bold 52px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('LEÓN FELDMAN REINOSO', 60, 180);

    ctx.fillStyle = '#c49a5a';
    ctx.font = '28px "Space Mono", monospace';
    ctx.fillText('35mm CELULOIDE FOTOQUÍMICO', 60, 240);

    ctx.fillStyle = '#888';
    ctx.font = '22px "Space Mono", monospace';
    ctx.fillText('36 EXPOSICIONES • KODAK SAFETY FILM • ISO 400', 60, 310);
    ctx.fillText('PROCESO C-41 / D-76 • BUENOS AIRES', 60, 350);

    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    const labelMaterial = new THREE.MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.4,
        metalness: 0.3
    });

    const labelMeshGeo = new THREE.CylinderGeometry(1.205, 1.205, 2.4, 64, 1, true, -Math.PI * 0.4, Math.PI * 0.9);
    const labelMesh = new THREE.Mesh(labelMeshGeo, labelMaterial);
    canisterGroup.add(labelMesh);

    // --- CINTA PROCEDURAL DE CELULOIDE 35MM DESPLEGABLE ---
    const filmWidth = 6.2;
    const filmHeight = 2.4;
    const filmGeo = new THREE.PlaneGeometry(filmWidth, filmHeight, 32, 1);
    
    // Generar textura de película analógica con perforaciones y fotogramas
    const filmCanvas = document.createElement('canvas');
    filmCanvas.width = 2048;
    filmCanvas.height = 768;
    const fCtx = filmCanvas.getContext('2d');

    function drawFilmTexture(images) {
        fCtx.fillStyle = '#0a0806';
        fCtx.fillRect(0, 0, filmCanvas.width, filmCanvas.height);

        // Perforaciones 35mm arriba y abajo
        fCtx.fillStyle = '#020101';
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

            // Numeración de fotogramas analógicos
            fCtx.fillStyle = '#c49a5a';
            fCtx.font = 'bold 18px "Space Mono", monospace';
            if (i % 4 === 0) {
                const frameNum = String(Math.floor(i / 4) + 1).padStart(2, '0') + 'A';
                fCtx.fillText(frameNum, x - 5, filmCanvas.height - 18);
                fCtx.fillText('KODAK 400', x - 15, 20);
            }
            fCtx.fillStyle = '#020101';
        }

        // Dibujar fotogramas reales cargados o placeholders elegantes
        const frameW = 420;
        const frameH = 310;
        const frameY = 110;

        for (let j = 0; j < 4; j++) {
            const frameX = 80 + j * 480;
            fCtx.fillStyle = '#161410';
            fCtx.fillRect(frameX, frameY, frameW, frameH);

            if (images && images[j]) {
                try {
                    fCtx.drawImage(images[j], frameX + 8, frameY + 8, frameW - 16, frameH - 16);
                } catch (e) {
                    // Fallback
                }
            } else {
                fCtx.fillStyle = '#222';
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
        roughness: 0.3,
        metalness: 0.15,
        side: THREE.DoubleSide
    });

    const filmMesh = new THREE.Mesh(filmGeo, filmMaterial);
    // Posicionar anclado en la salida del chasis
    filmMesh.position.set(1.3 + filmWidth / 2, 0, 0.15);
    canisterGroup.add(filmMesh);

    // Escalar la tira de film inicialmente replegada
    let filmProgress = 0.08; // 8% visible por defecto (lider del rollo)
    let targetProgress = 0.08;

    filmMesh.scale.set(filmProgress, 1, 1);
    filmMesh.position.x = 1.3 + (filmWidth * filmProgress) / 2;

    // Cargar fotos reales locales para pintar en la tira de película
    const samplePhotos = [
        'Analógicas/000005570003.jpg',
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
        img.onerror = () => {
            loadCount++;
        };
        img.src = src;
    });
    drawFilmTexture(null);

    // --- INTERACTIVIDAD 3D & PARALLAX DEL MOUSE ---
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationY = 0.3;
    let targetRotationX = 0.15;
    let isHovered = false;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
        targetRotationY = 0.3 + mouseX * 0.45;
        targetRotationX = 0.15 - mouseY * 0.3;
    });

    container.addEventListener('mouseenter', () => {
        isHovered = true;
        targetProgress = 0.95; // Desplegar película al 95%
    });

    container.addEventListener('mouseleave', () => {
        isHovered = false;
        targetProgress = 0.08; // Regresar a posición de reposo
    });

    container.addEventListener('click', () => {
        const portfolioSection = document.getElementById('portfolio');
        if (portfolioSection) portfolioSection.scrollIntoView({ behavior: 'smooth' });
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

        // Suavizado e inercia de rotación del chasis
        canisterGroup.rotation.y += (targetRotationY - canisterGroup.rotation.y) * 0.06;
        canisterGroup.rotation.x += (targetRotationX - canisterGroup.rotation.x) * 0.06;

        // Despliegue animado y elástico de la tira de celuloide
        filmProgress += (targetProgress - filmProgress) * 0.08;
        filmMesh.scale.x = filmProgress;
        filmMesh.position.x = 1.3 + (filmWidth * filmProgress) / 2;

        // Curvatura sutil en Z de la película en el espacio tridimensional
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
