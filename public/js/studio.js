/**
 * ESTUDIO FOTOGRÁFICO - Three.js Scene con Luces Controlables + Auto-Guardado
 */

(function () {
    const canvas = document.getElementById('studio-canvas');
    const container = document.getElementById('studio-container');
    if (!canvas || !container || typeof THREE === 'undefined') return;

    // --- ESTADO ---
    let studioConfig = null;
    let saveTimeout = null;
    let isSaving = false;

    // Three.js Core
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });

    // Objetos de luz referenciados por ID
    const lightObjects = new Map();
    const lightHelpers = new Map();

    // --- INICIALIZACIÓN RENDERER ---
    function initRenderer() {
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.shadowMap.autoUpdate = false;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;
        renderer.outputEncoding = THREE.sRGBEncoding;
    }

    // --- CÁMARA ---
    function initCamera() {
        camera.position.set(0, 0, 8.5);
        camera.lookAt(0, 0, 0);
    }

    // --- OBJETO CENTRAL (CHASIS) ---
    function createCanister() {
        const group = new THREE.Group();

        // Materiales
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x15281e, roughness: 0.38, metalness: 0.65 });
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0xd8ded9, roughness: 0.22, metalness: 0.9 });
        const capMat = new THREE.MeshStandardMaterial({ color: 0x222624, roughness: 0.28, metalness: 0.92 });
        const velvetMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.98, metalness: 0.05 });

        // Cuerpo
        const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 3.2, 64), bodyMat);
        body.castShadow = true; body.receiveShadow = true;
        group.add(body);

        // Franjas
        const stripeTop = new THREE.Mesh(new THREE.CylinderGeometry(1.206, 1.206, 0.25, 64), stripeMat);
        stripeTop.position.y = 1.0; group.add(stripeTop);
        const stripeBot = new THREE.Mesh(new THREE.CylinderGeometry(1.206, 1.206, 0.25, 64), stripeMat);
        stripeBot.position.y = -1.0; group.add(stripeBot);

        // Tapa inferior
        const botCap = new THREE.Mesh(new THREE.CylinderGeometry(1.23, 1.23, 0.18, 64), capMat);
        botCap.position.y = -1.65; botCap.castShadow = true; botCap.receiveShadow = true;
        group.add(botCap);

        // Tapa superior
        const topCap = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.25, 64), capMat);
        topCap.position.y = 1.68; topCap.castShadow = true; topCap.receiveShadow = true;
        group.add(topCap);

        // Dientes
        const gearGroup = new THREE.Group();
        const toothGeo = new THREE.BoxGeometry(0.04, 0.2, 0.08);
        for (let i = 0; i < 40; i++) {
            const a = (i / 40) * Math.PI * 2;
            const tooth = new THREE.Mesh(toothGeo, capMat);
            tooth.position.set(Math.cos(a) * 1.23, 1.68, Math.sin(a) * 1.23);
            tooth.rotation.y = -a; tooth.castShadow = true;
            gearGroup.add(tooth);
        }
        group.add(gearGroup);

        // Pin
        const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.45, 32), capMat);
        pin.position.y = 1.95; pin.castShadow = true; group.add(pin);
        const pinHole = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.2, 32), new THREE.MeshBasicMaterial({ color: 0x020202 }));
        pinHole.position.y = 2.12; group.add(pinHole);

        // Labio
        const lip = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.9, 0.35), velvetMat);
        lip.position.set(1.18, 0, 0.15); lip.rotation.y = -0.15; lip.castShadow = true; lip.receiveShadow = true;
        group.add(lip);

        return group;
    }

    const canisterGroup = createCanister();
    scene.add(canisterGroup);

    // --- PLANO DE SUELO (para sombras) ---
    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.8;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- LUCES DESDE CONFIG ---
    function createLightFromConfig(cfg) {
        let light;
        const color = new THREE.Color(cfg.color);
        const intensity = cfg.intensity ?? 1;

        switch (cfg.type) {
            case 'DirectionalLight':
                light = new THREE.DirectionalLight(color, intensity);
                if (cfg.target) light.target.position.fromArray(cfg.target);
                if (cfg.castShadow) {
                    light.castShadow = true;
                    light.shadow.mapSize.width = cfg.shadow?.mapSize ?? 512;
                    light.shadow.mapSize.height = cfg.shadow?.mapSize ?? 512;
                    light.shadow.bias = cfg.shadow?.bias ?? -0.001;
                    light.shadow.camera.near = 0.1;
                    light.shadow.camera.far = 20;
                    light.shadow.camera.left = -5;
                    light.shadow.camera.right = 5;
                    light.shadow.camera.top = 5;
                    light.shadow.camera.bottom = -5;
                }
                break;
            case 'PointLight':
                light = new THREE.PointLight(color, intensity, cfg.distance ?? 20, cfg.decay ?? 2);
                break;
            case 'SpotLight':
                light = new THREE.SpotLight(color, intensity, cfg.distance ?? 20, cfg.angle ?? Math.PI / 4, cfg.penumbra ?? 0.5, cfg.decay ?? 2);
                if (cfg.target) light.target.position.fromArray(cfg.target);
                if (cfg.castShadow) {
                    light.castShadow = true;
                    light.shadow.mapSize.width = cfg.shadow?.mapSize ?? 512;
                    light.shadow.mapSize.height = cfg.shadow?.mapSize ?? 512;
                }
                break;
            case 'RectAreaLight':
                light = new THREE.RectAreaLight(color, intensity, cfg.width ?? 4, cfg.height ?? 2);
                break;
            case 'AmbientLight':
                light = new THREE.AmbientLight(color, intensity);
                break;
            case 'HemisphereLight':
                light = new THREE.HemisphereLight(cfg.colorGround ?? 0xffffff, cfg.colorSky ?? 0xffffff, intensity);
                break;
            default:
                light = new THREE.DirectionalLight(color, intensity);
        }

        if (cfg.position) light.position.fromArray(cfg.position);
        light.visible = cfg.enabled !== false;
        light.userData.configId = cfg.id;
        light.userData.originalConfig = { ...cfg };

        // Helper visual para luces direccionales/spot/point
        if (['DirectionalLight', 'SpotLight', 'PointLight'].includes(cfg.type) && cfg.type !== 'AmbientLight') {
            let helper;
            if (cfg.type === 'DirectionalLight') helper = new THREE.DirectionalLightHelper(light, 1, color);
            else if (cfg.type === 'SpotLight') helper = new THREE.SpotLightHelper(light, color);
            else helper = new THREE.PointLightHelper(light, 0.5, color);
            helper.visible = light.visible;
            scene.add(helper);
            lightHelpers.set(cfg.id, helper);
        }

        scene.add(light);
        lightObjects.set(cfg.id, light);
        return light;
    }

    function removeAllLights() {
        lightObjects.forEach(light => {
            scene.remove(light);
            if (light.target && light.target.parent) scene.remove(light.target);
        });
        lightHelpers.forEach(h => scene.remove(h));
        lightObjects.clear();
        lightHelpers.clear();
    }

    function updateLightFromConfig(cfg) {
        let light = lightObjects.get(cfg.id);
        if (!light) {
            light = createLightFromConfig(cfg);
            return;
        }

        const color = new THREE.Color(cfg.color);
        light.color.set(color);
        light.intensity = cfg.intensity ?? 1;
        light.visible = cfg.enabled !== false;

        if (cfg.position) light.position.fromArray(cfg.position);
        if (cfg.target && light.target) light.target.position.fromArray(cfg.target);

        if (light.type === 'PointLight' || light.type === 'SpotLight') {
            light.distance = cfg.distance ?? light.distance;
            light.decay = cfg.decay ?? light.decay;
        }
        if (light.type === 'SpotLight') {
            light.angle = cfg.angle ?? light.angle;
            light.penumbra = cfg.penumbra ?? light.penumbra;
        }
        if (light.type === 'RectAreaLight') {
            light.width = cfg.width ?? light.width;
            light.height = cfg.height ?? light.height;
        }
        if (light.type === 'DirectionalLight' && light.shadow) {
            light.shadow.mapSize.width = cfg.shadow?.mapSize ?? 512;
            light.shadow.mapSize.height = cfg.shadow?.mapSize ?? 512;
            light.shadow.bias = cfg.shadow?.bias ?? -0.001;
        }

        const helper = lightHelpers.get(cfg.id);
        if (helper) {
            helper.visible = light.visible;
            helper.color.set(color);
            helper.update();
        }
    }

    // --- UI CONTROLES ---
    const controlsContainer = document.getElementById('studio-controls');
    const presetContainer = document.getElementById('preset-buttons');

    const PRESETS = {
        'Rembrandt': {
            lights: [
                { id: 'key', type: 'DirectionalLight', name: 'Key', enabled: true, position: [4, 5, 4], target: [0, 0.5, 0], intensity: 3, color: '#fff8f0', castShadow: true },
                { id: 'fill', type: 'DirectionalLight', name: 'Fill', enabled: true, position: [-3, 1, 3], target: [0, 0.5, 0], intensity: 0.6, color: '#88aaff' },
                { id: 'rim', type: 'PointLight', name: 'Rim', enabled: true, position: [-2, 3, -4], intensity: 2, color: '#ffccaa', distance: 15 },
                { id: 'ambient', type: 'AmbientLight', name: 'Ambient', enabled: true, intensity: 0.3, color: '#222233' }
            ]
        },
        'Split': {
            lights: [
                { id: 'key', type: 'DirectionalLight', name: 'Key', enabled: true, position: [6, 0, 0], target: [0, 0, 0], intensity: 4, color: '#ffffff', castShadow: true },
                { id: 'fill', type: 'DirectionalLight', name: 'Fill', enabled: false, position: [-3, 1, 3], intensity: 0.3, color: '#88aaff' },
                { id: 'rim', type: 'PointLight', name: 'Rim', enabled: true, position: [-3, 2, -3], intensity: 1.5, color: '#ffaa88', distance: 15 },
                { id: 'ambient', type: 'AmbientLight', name: 'Ambient', enabled: true, intensity: 0.15, color: '#111122' }
            ]
        },
        'Butterfly': {
            lights: [
                { id: 'key', type: 'DirectionalLight', name: 'Key', enabled: true, position: [0, 6, 4], target: [0, 0.5, 0], intensity: 3.5, color: '#fffaf0', castShadow: true },
                { id: 'fill', type: 'DirectionalLight', name: 'Fill', enabled: true, position: [0, -1, 4], target: [0, 0.5, 0], intensity: 1, color: '#fff8f0' },
                { id: 'rim', type: 'PointLight', name: 'Rim', enabled: true, position: [0, 3, -4], intensity: 2, color: '#ffeedd', distance: 15 },
                { id: 'ambient', type: 'AmbientLight', name: 'Ambient', enabled: true, intensity: 0.4, color: '#333344' }
            ]
        },
        'Cinematic': {
            lights: [
                { id: 'key', type: 'DirectionalLight', name: 'Key', enabled: true, position: [5, 7, 6], target: [0, 1, 0], intensity: 3, color: '#ffeedd', castShadow: true },
                { id: 'fill', type: 'DirectionalLight', name: 'Fill', enabled: true, position: [-4, 2, 3], target: [0, 1, 0], intensity: 0.8, color: '#88aacc' },
                { id: 'kicker', type: 'SpotLight', name: 'Kicker', enabled: true, position: [-3, 4, -3], target: [0, 1, 0], intensity: 2.5, color: '#ffccaa', distance: 20, angle: 0.5, penumbra: 0.4 },
                { id: 'rim', type: 'PointLight', name: 'Rim', enabled: true, position: [2, 5, -5], intensity: 3, color: '#ffaa88', distance: 25 },
                { id: 'ambient', type: 'AmbientLight', name: 'Ambient', enabled: true, intensity: 0.25, color: '#1a1a2e' }
            ]
        },
        'Noir': {
            lights: [
                { id: 'key', type: 'SpotLight', name: 'Key', enabled: true, position: [4, 5, 4], target: [0, 0.8, 0], intensity: 5, color: '#ffffff', distance: 20, angle: 0.35, penumbra: 0.5, castShadow: true },
                { id: 'fill', type: 'DirectionalLight', name: 'Fill', enabled: false, position: [-3, 1, 3], intensity: 0.2, color: '#444466' },
                { id: 'rim', type: 'PointLight', name: 'Rim', enabled: true, position: [-2, 3, -4], intensity: 1, color: '#666688', distance: 15 },
                { id: 'ambient', type: 'AmbientLight', name: 'Ambient', enabled: true, intensity: 0.08, color: '#0a0a12' }
            ]
        },
        'High-Key': {
            lights: [
                { id: 'key', type: 'DirectionalLight', name: 'Key', enabled: true, position: [4, 5, 4], target: [0, 0.5, 0], intensity: 2.5, color: '#fffef8', castShadow: true },
                { id: 'fill', type: 'DirectionalLight', name: 'Fill', enabled: true, position: [-4, 3, 4], target: [0, 0.5, 0], intensity: 2, color: '#fffef8' },
                { id: 'back', type: 'DirectionalLight', name: 'Back', enabled: true, position: [0, 4, -5], target: [0, 0.5, 0], intensity: 2, color: '#fffef8' },
                { id: 'ambient', type: 'AmbientLight', name: 'Ambient', enabled: true, intensity: 0.8, color: '#f0f0f0' }
            ]
        }
    };

    function renderLightControls() {
        if (!studioConfig || !controlsContainer) return;

        controlsContainer.innerHTML = '';

        studioConfig.lights.forEach((cfg, idx) => {
            const div = document.createElement('div');
            div.className = `light-control ${cfg.enabled ? 'enabled' : 'disabled'}`;
            div.dataset.lightId = cfg.id;

            const params = buildParamsForLight(cfg);

            div.innerHTML = `
                <div class="light-control-header">
                    <div class="light-control-title">
                        <span class="light-type-badge">${cfg.type.replace('Light', '')}</span>
                        <span class="light-name">${cfg.name || cfg.id}</span>
                    </div>
                    <button class="light-toggle ${cfg.enabled ? 'active' : ''}" onclick="toggleLight('${cfg.id}')" title="Activar/Desactivar"></button>
                </div>
                <div class="light-params" id="params-${cfg.id}">
                    ${params}
                </div>
            `;
            controlsContainer.appendChild(div);
        });

        renderPresets();
    }

    function buildParamsForLight(cfg) {
        let html = '';

        // Posición (siempre)
        html += `
            <div class="param-group">
                <label class="param-label">Posición XYZ</label>
                <div class="vec3-inputs">
                    <input type="number" step="0.1" value="${cfg.position?.[0] ?? 0}" onchange="updateLightParam('${cfg.id}', 'position', 0, this.valueAsNumber)">
                    <input type="number" step="0.1" value="${cfg.position?.[1] ?? 0}" onchange="updateLightParam('${cfg.id}', 'position', 1, this.valueAsNumber)">
                    <input type="number" step="0.1" value="${cfg.position?.[2] ?? 0}" onchange="updateLightParam('${cfg.id}', 'position', 2, this.valueAsNumber)">
                </div>
            </div>
        `;

        // Target (para luces con target)
        if (['DirectionalLight', 'SpotLight'].includes(cfg.type)) {
            html += `
                <div class="param-group">
                    <label class="param-label">Target XYZ</label>
                    <div class="vec3-inputs">
                        <input type="number" step="0.1" value="${cfg.target?.[0] ?? 0}" onchange="updateLightParam('${cfg.id}', 'target', 0, this.valueAsNumber)">
                        <input type="number" step="0.1" value="${cfg.target?.[1] ?? 0}" onchange="updateLightParam('${cfg.id}', 'target', 1, this.valueAsNumber)">
                        <input type="number" step="0.1" value="${cfg.target?.[2] ?? 0}" onchange="updateLightParam('${cfg.id}', 'target', 2, this.valueAsNumber)">
                    </div>
                </div>
            `;
        }

        // Intensidad
        html += `
            <div class="param-group">
                <label class="param-label">Intensidad</label>
                <div class="param-input-row">
                    <input type="range" min="0" max="10" step="0.1" value="${cfg.intensity ?? 1}" oninput="updateLightParam('${cfg.id}', 'intensity', null, this.valueAsNumber); this.nextElementSibling.value = this.valueAsNumber.toFixed(1)">
                    <input type="number" step="0.1" min="0" max="20" value="${cfg.intensity ?? 1}" onchange="updateLightParam('${cfg.id}', 'intensity', null, this.valueAsNumber); this.previousElementSibling.value = this.valueAsNumber">
                </div>
            </div>
        `;

        // Color
        html += `
            <div class="param-group">
                <label class="param-label">Color</label>
                <div class="param-input-row">
                    <input type="color" value="${cfg.color ?? '#ffffff'}" onchange="updateLightParam('${cfg.id}', 'color', null, this.value)">
                </div>
            </div>
        `;

        // Parámetros específicos por tipo
        if (cfg.type === 'PointLight' || cfg.type === 'SpotLight') {
            html += `
                <div class="param-group">
                    <label class="param-label">Distancia</label>
                    <div class="param-input-row">
                        <input type="range" min="0" max="50" step="1" value="${cfg.distance ?? 20}" oninput="updateLightParam('${cfg.id}', 'distance', null, this.valueAsNumber); this.nextElementSibling.value = this.value">
                        <input type="number" step="1" min="0" max="100" value="${cfg.distance ?? 20}" onchange="updateLightParam('${cfg.id}', 'distance', null, this.valueAsNumber); this.previousElementSibling.value = this.value">
                    </div>
                </div>
                <div class="param-group">
                    <label class="param-label">Decay</label>
                    <div class="param-input-row">
                        <input type="range" min="0" max="5" step="0.1" value="${cfg.decay ?? 2}" oninput="updateLightParam('${cfg.id}', 'decay', null, this.valueAsNumber); this.nextElementSibling.value = this.valueAsNumber.toFixed(1)">
                        <input type="number" step="0.1" min="0" max="5" value="${cfg.decay ?? 2}" onchange="updateLightParam('${cfg.id}', 'decay', null, this.valueAsNumber); this.previousElementSibling.value = this.valueAsNumber">
                    </div>
                </div>
            `;
        }

        if (cfg.type === 'SpotLight') {
            html += `
                <div class="param-group">
                    <label class="param-label">Ángulo (rad)</label>
                    <div class="param-input-row">
                        <input type="range" min="0.1" max="${Math.PI/2}" step="0.05" value="${cfg.angle ?? 0.5}" oninput="updateLightParam('${cfg.id}', 'angle', null, this.valueAsNumber); this.nextElementSibling.value = this.valueAsNumber.toFixed(2)">
                        <input type="number" step="0.05" min="0.1" max="1.57" value="${cfg.angle ?? 0.5}" onchange="updateLightParam('${cfg.id}', 'angle', null, this.valueAsNumber); this.previousElementSibling.value = this.valueAsNumber">
                    </div>
                </div>
                <div class="param-group">
                    <label class="param-label">Penumbra</label>
                    <div class="param-input-row">
                        <input type="range" min="0" max="1" step="0.05" value="${cfg.penumbra ?? 0.5}" oninput="updateLightParam('${cfg.id}', 'penumbra', null, this.valueAsNumber); this.nextElementSibling.value = this.valueAsNumber.toFixed(2)">
                        <input type="number" step="0.05" min="0" max="1" value="${cfg.penumbra ?? 0.5}" onchange="updateLightParam('${cfg.id}', 'penumbra', null, this.valueAsNumber); this.previousElementSibling.value = this.valueAsNumber">
                    </div>
                </div>
            `;
        }

        if (cfg.type === 'RectAreaLight') {
            html += `
                <div class="param-group">
                    <label class="param-label">Width</label>
                    <div class="param-input-row">
                        <input type="number" step="0.1" min="0.1" value="${cfg.width ?? 4}" onchange="updateLightParam('${cfg.id}', 'width', null, this.valueAsNumber)">
                    </div>
                </div>
                <div class="param-group">
                    <label class="param-label">Height</label>
                    <div class="param-input-row">
                        <input type="number" step="0.1" min="0.1" value="${cfg.height ?? 2}" onchange="updateLightParam('${cfg.id}', 'height', null, this.valueAsNumber)">
                    </div>
                </div>
            `;
        }

        // Sombras (DirectionalLight)
        if (cfg.type === 'DirectionalLight') {
            html += `
                <div class="param-group">
                    <label class="param-label">Sombras</label>
                    <div class="param-input-row">
                        <label style="font-family:var(--font-mono);font-size:0.65rem;cursor:pointer;display:flex;align-items:center;gap:0.4rem;">
                            <input type="checkbox" ${cfg.castShadow ? 'checked' : ''} onchange="updateLightParam('${cfg.id}', 'castShadow', null, this.checked)">
                            Activar
                        </label>
                    </div>
                </div>
            `;
        }

        return html;
    }

    function renderPresets() {
        if (!presetContainer) return;
        presetContainer.innerHTML = '';
        Object.keys(PRESETS).forEach(name => {
            const btn = document.createElement('button');
            btn.className = 'preset-btn';
            btn.textContent = name;
            btn.onclick = () => applyPreset(name);
            presetContainer.appendChild(btn);
        });
    }

    function applyPreset(name) {
        const preset = PRESETS[name];
        if (!preset) return;

        // Merge con config actual manteniendo luces extra
        const newLights = [...preset.lights];
        studioConfig.lights.forEach(existing => {
            if (!newLights.find(l => l.id === existing.id)) {
                newLights.push(existing);
            }
        });
        studioConfig.lights = newLights;

        // Recrear luces
        removeAllLights();
        studioConfig.lights.forEach(createLightFromConfig);
        renderLightControls();
        triggerAutoSave();
        showToast(`Preset "${name}" aplicado`);
    }

    // --- AUTO-GUARDADO ---
    function triggerAutoSave() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveStudioConfig, 800);
    }

    async function saveStudioConfig() {
        if (isSaving || !studioConfig) return;
        isSaving = true;

        try {
            const token = localStorage.getItem('studio_token') || localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/studio', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(studioConfig)
            });
            const data = await res.json();
            if (data.success) {
                studioConfig = data.studio;
                showToast('Configuración guardada ✦');
            } else {
                showToast('Error guardando: ' + (data.error || 'desconocido'), true);
            }
        } catch (e) {
            console.error('Save failed:', e);
            showToast('Error de red al guardar', true);
        } finally {
            isSaving = false;
        }
    }

    async function resetStudioConfig() {
        if (!confirm('¿Restaurar configuración por defecto?')) return;
        try {
            const token = localStorage.getItem('studio_token') || localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/studio/reset', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                studioConfig = data.studio;
                removeAllLights();
                studioConfig.lights.forEach(createLightFromConfig);
                renderLightControls();
                showToast('Estudio reseteado');
            }
        } catch (e) {
            showToast('Error reseteando', true);
        }
    }

    // --- FUNCIONES GLOBALES PARA UI ---
    window.toggleLight = function (id) {
        const light = studioConfig.lights.find(l => l.id === id);
        if (light) {
            light.enabled = !light.enabled;
            const obj = lightObjects.get(id);
            if (obj) obj.visible = light.enabled;
            const helper = lightHelpers.get(id);
            if (helper) helper.visible = light.enabled;
            const control = document.querySelector(`.light-control[data-light-id="${id}"]`);
            if (control) control.classList.toggle('enabled', light.enabled);
            const toggle = control?.querySelector('.light-toggle');
            if (toggle) toggle.classList.toggle('active', light.enabled);
            triggerAutoSave();
        }
    };

    window.updateLightParam = function (id, key, index, value) {
        const light = studioConfig.lights.find(l => l.id === id);
        if (!light) return;

        if (index !== null && Array.isArray(light[key])) {
            light[key][index] = value;
        } else {
            light[key] = value;
        }

        updateLightFromConfig(light);
        triggerAutoSave();
    };

    // --- TOAST ---
    function showToast(msg, isError = false) {
        let toast = document.getElementById('studio-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'studio-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.borderColor = isError ? 'var(--danger)' : 'var(--accent)';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    // --- CARGAR CONFIG INICIAL ---
    async function loadStudioConfig() {
        try {
            const res = await fetch('/api/studio');
            const data = await res.json();
            if (data.success) {
                studioConfig = data.studio;
            } else {
                studioConfig = getDefaultStudioConfig();
            }
        } catch {
            studioConfig = getDefaultStudioConfig();
        }

        // Crear luces
        studioConfig.lights.forEach(createLightFromConfig);
        renderLightControls();
    }

    function getDefaultStudioConfig() {
        return {
            version: 1,
            object: { type: 'canister', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
            camera: { position: [0, 0, 8.5], fov: 40, target: [0, 0, 0] },
            lights: [
                { id: 'key', type: 'DirectionalLight', name: 'Key Light', enabled: true, position: [5, 6, 7], target: [0, 0, 0], intensity: 2.6, color: '#fff4e6', castShadow: true, shadow: { mapSize: 512, bias: -0.001 } },
                { id: 'fill', type: 'DirectionalLight', name: 'Fill Light', enabled: true, position: [-6, -2, 4], target: [0, 0, 0], intensity: 0.9, color: '#90b8d0' },
                { id: 'rim', type: 'PointLight', name: 'Rim Light', enabled: true, position: [2, 4, -4], target: [0, 0, 0], intensity: 3.2, color: '#c49a5a', distance: 20, decay: 2 },
                { id: 'ambient', type: 'AmbientLight', name: 'Ambient', enabled: true, intensity: 0.6, color: '#fff8ee' }
            ],
            background: { type: 'solid', color: '#040605' },
            renderer: { toneMapping: 'ACESFilmic', exposure: 1.15, pixelRatio: 1.5 }
        };
    }

    // --- CONTROL DE CÁMARA (Orbit simple) ---
    let isDragging = false;
    let lastX = 0, lastY = 0;
    let targetRotY = 0, targetRotX = 0.15;

    canvas.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.studio-panel')) return;
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        targetRotY -= dx * 0.005;
        targetRotX = THREE.MathUtils.clamp(targetRotX - dy * 0.005, -Math.PI/2.2, Math.PI/2.2);
        lastX = e.clientX;
        lastY = e.clientY;
    });

    window.addEventListener('pointerup', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });

    // Zoom con wheel
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        camera.position.z = THREE.MathUtils.clamp(camera.position.z + e.deltaY * 0.01, 3, 20);
    }, { passive: false });

    // --- RESIZE ---
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- ANIMATION LOOP ---
    function animate() {
        requestAnimationFrame(animate);

        // Rotación suave del objeto
        canisterGroup.rotation.y += (targetRotY - canisterGroup.rotation.y) * 0.04;
        canisterGroup.rotation.x += (targetRotX - canisterGroup.rotation.x) * 0.04;

        // Actualizar helpers
        lightHelpers.forEach(h => h.update());

        // Sombras solo cuando cambian
        renderer.shadowMap.needsUpdate = true;
        renderer.render(scene, camera);
    }

    // --- INIT ---
    initRenderer();
    initCamera();
    loadStudioConfig().then(() => {
        canvas.style.cursor = 'grab';
        animate();
    });
})();