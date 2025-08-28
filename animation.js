// Interactive Aurora Playground – eine verspielte 3D/Shader Experience
// - GPU-Aurora-Shader als Hintergrund
// - Reaktive Glitzer-Partikel im Raum
// - Sanfte Interaktion via Maus/Touch und DeviceOrientation

class InteractiveExperience {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.auroraMesh = null;
        this.points = null;
        this.time = 0;
        this.isMobile = window.innerWidth <= 768;
        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.velocities = [];
        this.positionsArray = null;
        this.loadingHidden = false;

        this.init();
    }

    init() {
        try {
            this.setupRenderer();
            this.setupSceneCamera();
            this.createAuroraBackground();
            this.createSparkleParticles();
            this.setupEvents();
            this.animate();
            this.hideLoading();
        } catch (err) {
            console.error('Fehler beim Initialisieren:', err);
        }
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        // Sichere Sichtbarkeit des Canvas (nicht transparent)
        this.renderer.setClearColor(0x000000, 1);

        const container = document.getElementById('home-hero-visual-container');
        if (container) {
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
        }
    }

    setupSceneCamera() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
        this.camera.position.set(0, 0, 3);
    }

    createAuroraBackground() {
        const geometry = new THREE.PlaneGeometry(2, 2, 2, 2);

        const fragmentShader = `
            precision highp float;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform vec2 u_mouse;

            // Simplex Noise (verkürzt, ausreichend für animierte Muster)
            vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
            vec2 mod289(vec2 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
            vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);} 
            float snoise(vec2 v){
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                    -0.577350269189626, 0.024390243902439);
                vec2 i = floor(v + dot(v, C.yy));
                vec2 x0 = v - i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute( permute( vec3(i.y + vec3(0.0, i1.y, 1.0)) ) + i.x + vec3(0.0, i1.x, 1.0) );
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m; m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                vec3 g;
                g.x  = a0.x * x0.x + h.x * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            float fbm(vec2 uv){
                float t = 0.0;
                float a = 0.5;
                for(int i=0;i<5;i++){
                    t += a * snoise(uv);
                    uv *= 2.0; a *= 0.5;
                }
                return t;
            }

            void main(){
                vec2 uv = (gl_FragCoord.xy / u_resolution.xy);
                uv = uv * 2.0 - 1.0;
                uv.x *= u_resolution.x / u_resolution.y;

                // Dynamik
                float t = u_time * 0.06;
                vec2 nuv = uv * 1.2 + vec2(t * 0.2, -t * 0.15);
                float n = fbm(nuv);

                // Maus-Highlight
                vec2 m = (u_mouse / u_resolution) * 2.0 - 1.0;
                m.x *= u_resolution.x / u_resolution.y;
                float d = length(uv - m);
                float glow = smoothstep(0.6, 0.0, d) * 0.7;

                // Farbpalette Aurora (Blau -> Türkis -> Lila)
                vec3 c1 = vec3(0.2, 0.5, 0.9);
                vec3 c2 = vec3(0.1, 0.9, 0.8);
                vec3 c3 = vec3(0.7, 0.4, 0.9);

                float band = smoothstep(-0.5, 0.7, n);
                vec3 col = mix(c1, c2, band);
                col = mix(col, c3, smoothstep(0.3, 0.9, n));

                // Glow additiv
                col += glow * vec3(0.8, 0.9, 1.0);
                col = pow(col, vec3(1.0));
                gl_FragColor = vec4(col, 1.0);
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                u_mouse: { value: new THREE.Vector2(window.innerWidth * 0.5, window.innerHeight * 0.5) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main(){
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader,
            depthWrite: false,
            depthTest: false
        });

        this.auroraMesh = new THREE.Mesh(geometry, material);
        // Vollbild-Quad im Clipspace: nutze eine separate Szene? Hier direkt rendern, Kamera bleibt normal
        // Wir rendern diese Fläche mit einer Orthoprojektion via NDC-Vertices (PlaneGeometry 2x2 + VertexShader -> position)
        // Damit die Fläche im Hintergrund liegt, nutzen wir einen zweiten Render-Pass (zuerst Aurora, dann Punkte)
        // Vereinfachung: Wir fügen sie in die Szene und rendern sie zuerst über renderOrder
        this.auroraMesh.renderOrder = -1;
        this.scene.add(this.auroraMesh);
    }

    createSparkleParticles() {
        const count = this.isMobile ? 600 : 1200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 6.0;
            positions[i3 + 1] = (Math.random() - 0.5) * 3.5;
            positions[i3 + 2] = (Math.random() - 0.5) * 4.0;

            const hue = 0.55 + Math.random() * 0.25; // blau-türkis-lila Range
            const c = new THREE.Color().setHSL(hue, 0.6, 0.6);
            colors[i3] = c.r;
            colors[i3 + 1] = c.g;
            colors[i3 + 2] = c.b;

            sizes[i] = Math.random() * 3 + 1;

            this.velocities.push({
                x: (Math.random() - 0.5) * 0.01,
                y: (Math.random() - 0.5) * 0.01,
                z: (Math.random() - 0.5) * 0.01
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        this.positionsArray = positions;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                uniform float u_time;
                uniform float u_pixelRatio;
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                void main(){
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = (size * 300.0 * u_pixelRatio) / -mvPosition.z;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main(){
                    vec2 c = gl_PointCoord - 0.5;
                    float d = length(c);
                    if(d > 0.5) discard;
                    float alpha = pow(1.0 - d*2.0, 2.0);
                    gl_FragColor = vec4(vColor, alpha * 0.9);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.points = new THREE.Points(geometry, material);
        this.points.renderOrder = 1;
        this.scene.add(this.points);
    }

    setupEvents() {
        window.addEventListener('resize', () => this.onResize());

        const onMove = (x, y) => {
            this.targetMouse.x = x;
            this.targetMouse.y = y;
        };

        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('deviceorientation', (event) => {
            if (!this.isMobile) return;
            const gx = event.gamma || 0; // -90..90
            const gy = event.beta || 0;  // -180..180
            const cx = (gx / 90) * window.innerWidth * 0.5 + window.innerWidth * 0.5;
            const cy = (gy / 180) * window.innerHeight * 0.5 + window.innerHeight * 0.5;
            onMove(cx, cy);
        });
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        if (this.auroraMesh && this.auroraMesh.material && this.auroraMesh.material.uniforms) {
            this.auroraMesh.material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        }
        if (this.points && this.points.material && this.points.material.uniforms) {
            this.points.material.uniforms.u_pixelRatio.value = Math.min(window.devicePixelRatio, 2);
        }
    }

    updateParticles(delta) {
        if (!this.points) return;
        const pos = this.positionsArray;
        const count = pos.length / 3;

        // Sanft zur Maus interpolieren
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.08;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.08;

        // Maus in Weltkoordinaten (approx: Ebene vor der Kamera)
        const mx = (this.mouse.x / window.innerWidth) * 2 - 1;
        const my = -(this.mouse.y / window.innerHeight) * 2 + 1;
        const mouseVec = new THREE.Vector3(mx, my, 0.0).unproject(this.camera);

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            let x = pos[i3];
            let y = pos[i3 + 1];
            let z = pos[i3 + 2];

            // Leichte Eigenbewegung
            x += this.velocities[i].x;
            y += this.velocities[i].y;
            z += this.velocities[i].z;

            // sanfte Rückstellkraft Richtung Zentrum
            x += (-x) * 0.002;
            y += (-y) * 0.002;
            z += (-z) * 0.002;

            // Interaktion: Maus-Repulsion
            const dx = x - mouseVec.x;
            const dy = y - mouseVec.y;
            const dz = z - mouseVec.z;
            const dist2 = dx*dx + dy*dy + dz*dz + 0.0001;
            const force = 0.003 / dist2; // stärker nah an Maus
            x += dx * force;
            y += dy * force;
            z += dz * force;

            // sanfte Begrenzung des Raums
            const maxR = 4.5;
            const r2 = x*x + y*y + z*z;
            if (r2 > maxR*maxR) {
                x *= 0.98; y *= 0.98; z *= 0.98;
            }

            pos[i3] = x;
            pos[i3 + 1] = y;
            pos[i3 + 2] = z;
        }

        this.points.geometry.attributes.position.needsUpdate = true;
        if (this.points.material && this.points.material.uniforms) {
            this.points.material.uniforms.u_time.value = this.time;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.time += 16.6667;

        if (this.auroraMesh && this.auroraMesh.material && this.auroraMesh.material.uniforms) {
            this.auroraMesh.material.uniforms.u_time.value = this.time * 0.001;
            this.auroraMesh.material.uniforms.u_mouse.value.set(this.mouse.x, this.mouse.y);
        }

        this.updateParticles(0.016);
        if (this.points) {
            this.points.rotation.y += 0.0015;
        }
        this.renderer.render(this.scene, this.camera);
    }

    hideLoading() {
        if (this.loadingHidden) return;
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => { loading.style.display = 'none'; }, 800);
        }
        this.loadingHidden = true;
    }
}

// Global verfügbar
window.InteractiveExperience = InteractiveExperience;
// 3D Animation für Jake2 - Inspiriert von lusion.co
class InteractiveAnimation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = [];
        this.spheres = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.time = 0;
        this.raycaster = null;
        this.mouse = null;
        this.isMobile = window.innerWidth <= 768;
        this.isLoaded = false;
        this.initTimeout = null;
        
        // Sicherheitschecks werden jetzt in HTML gemacht
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.init();
    }

    init() {
        try {
            this.setupScene();
            this.createParticleSystem();
            this.createFloatingSpheres();
            this.setupLighting();
            this.setupEventListeners();
            this.animate();
            
            // Animation nach dem Laden starten mit Timeout-Sicherheit
            this.initTimeout = setTimeout(() => {
                this.hideLoading();
            }, 3000);
            
            // Schnelleres Laden wenn alles bereit ist
            setTimeout(() => {
                if (this.renderer && this.scene) {
                    this.hideLoading();
                    if (this.initTimeout) {
                        clearTimeout(this.initTimeout);
                    }
                }
            }, 1000);
            
        } catch (error) {
            console.error('Fehler beim Initialisieren der Animation:', error);
            this.showError('Animation konnte nicht geladen werden: ' + error.message);
        }
    }

    showError(message) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.innerHTML = `
                <div class="loading-spinner" style="border-color: #ff4444; border-top-color: #ff8888;"></div>
                <div style="color: #ff6666;">${message}</div>
                <div style="margin-top: 20px; font-size: 0.9rem; opacity: 0.8;">
                    <button onclick="location.reload()" style="
                        background: #667eea; 
                        color: white; 
                        border: none; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">Seite neu laden</button>
                </div>
            `;
        }
    }

    setupScene() {
        // Szene erstellen
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x667eea, 1, 1000);

        // Kamera erstellen
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 30);

        // Renderer erstellen
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x667eea, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Renderer zum Container hinzufügen
        const container = document.getElementById('home-hero-visual-container');
        // Vorher ggf. Fallback entfernen
        if (container) {
            container.innerHTML = '';
            container.appendChild(this.renderer.domElement);
        }
    }

    createParticleSystem() {
        const particleCount = this.isMobile ? 500 : 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Zufällige Positionen in einer Kugel
            const radius = Math.random() * 100 + 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Farbverläufe
            const colorVariation = Math.random();
            colors[i3] = 0.4 + colorVariation * 0.6;     // R
            colors[i3 + 1] = 0.5 + colorVariation * 0.5; // G
            colors[i3 + 2] = 0.9 + colorVariation * 0.1; // B

            // Größen
            sizes[i] = Math.random() * 3 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Shader Material für Partikel
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                uniform float time;
                uniform float pixelRatio;
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vSize;
                
                void main() {
                    vColor = color;
                    vSize = size;
                    
                    vec3 pos = position;
                    
                    // Welleneffekt
                    pos.x += sin(time * 0.001 + position.y * 0.01) * 5.0;
                    pos.y += cos(time * 0.001 + position.x * 0.01) * 5.0;
                    pos.z += sin(time * 0.001 + position.x * 0.01 + position.y * 0.01) * 3.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = (size * pixelRatio * 300.0) / -mvPosition.z;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vSize;
                
                void main() {
                    vec2 center = gl_PointCoord - 0.5;
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - (dist * 2.0);
                    alpha = pow(alpha, 2.0);
                    
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createFloatingSpheres() {
        const sphereCount = this.isMobile ? 5 : 10;
        
        for (let i = 0; i < sphereCount; i++) {
            // Geometrie mit zufälliger Größe
            const radius = Math.random() * 3 + 1;
            const geometry = new THREE.SphereGeometry(radius, 32, 32);
            
            // Material mit Glas-Effekt
            const material = new THREE.MeshPhysicalMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.5, 0.7),
                transparent: true,
                opacity: 0.6,
                roughness: 0.1,
                metalness: 0.1,
                transmission: 0.8,
                thickness: 0.5,
                ior: 1.5,
                clearcoat: 1.0,
                clearcoatRoughness: 0.1
            });

            const sphere = new THREE.Mesh(geometry, material);
            
            // Zufällige Position
            sphere.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 30
            );
            
            // Zufällige Rotation
            sphere.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            // Custom properties für Animation
            sphere.userData = {
                originalPosition: sphere.position.clone(),
                floatSpeed: Math.random() * 0.02 + 0.01,
                rotationSpeed: Math.random() * 0.02 + 0.005,
                amplitude: Math.random() * 5 + 2
            };

            sphere.castShadow = true;
            sphere.receiveShadow = true;
            
            this.spheres.push(sphere);
            this.scene.add(sphere);
        }
    }

    setupLighting() {
        // Ambient Light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Main Light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(50, 50, 50);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);

        // Accent Lights
        const accentLight1 = new THREE.PointLight(0x667eea, 1.5, 100);
        accentLight1.position.set(-30, 20, 10);
        this.scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(0x764ba2, 1.5, 100);
        accentLight2.position.set(30, -20, 10);
        this.scene.add(accentLight2);
    }

    setupEventListeners() {
        // Maus-Events
        window.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        }, false);

        // Touch-Events für Mobile
        window.addEventListener('touchmove', (event) => {
            if (event.touches.length > 0) {
                const touch = event.touches[0];
                this.onMouseMove({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });
            }
        }, false);

        // Resize-Event
        window.addEventListener('resize', () => {
            this.onWindowResize();
        }, false);

        // Orientierungsänderung für Mobile
        window.addEventListener('deviceorientation', (event) => {
            if (this.isMobile) {
                this.onDeviceOrientation(event);
            }
        }, false);

        // Custom Cursor
        if (!this.isMobile) {
            const cursorDot = document.getElementById('cursor-dot');
            window.addEventListener('mousemove', (e) => {
                cursorDot.style.left = e.clientX + 'px';
                cursorDot.style.top = e.clientY + 'px';
            });
        }
    }

    onMouseMove(event) {
        this.targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        // Raycasting für Interaktion
        this.mouse.x = this.targetMouseX;
        this.mouse.y = this.targetMouseY;
        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.spheres);
        
        // Hovering-Effekt
        this.spheres.forEach(sphere => {
            sphere.userData.isHovered = false;
        });

        if (intersects.length > 0) {
            intersects[0].object.userData.isHovered = true;
        }
    }

    onDeviceOrientation(event) {
        if (event.gamma && event.beta) {
            this.targetMouseX = event.gamma / 90;
            this.targetMouseY = event.beta / 180;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 1000);
        }
        // Eventuellen Fallback entfernen
        const container = document.getElementById('home-hero-visual-container');
        if (container) {
            const fb = container.querySelector('.fallback-animation');
            if (fb && typeof fb.remove === 'function') {
                fb.remove();
            }
        }
        this.isLoaded = true;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 16;

        // Smooth mouse interpolation
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

        // Kamera-Bewegung basierend auf Maus/Touch
        if (this.isLoaded) {
            this.camera.position.x += (this.mouseX * 10 - this.camera.position.x) * 0.05;
            this.camera.position.y += (this.mouseY * 10 - this.camera.position.y) * 0.05;
            this.camera.lookAt(this.scene.position);
        }

        // Partikel-Animation
        if (this.particles && this.particles.material.uniforms) {
            this.particles.material.uniforms.time.value = this.time;
            this.particles.rotation.y += 0.001;
        }

        // Sphere-Animationen
        this.spheres.forEach((sphere, index) => {
            const userData = sphere.userData;
            
            // Floating-Bewegung
            const time = this.time * 0.001;
            sphere.position.y = userData.originalPosition.y + 
                Math.sin(time * userData.floatSpeed + index) * userData.amplitude;
            
            // Rotation
            sphere.rotation.x += userData.rotationSpeed;
            sphere.rotation.y += userData.rotationSpeed * 0.7;

            // Hover-Effekt
            if (userData.isHovered) {
                sphere.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
                sphere.material.opacity = Math.min(sphere.material.opacity + 0.02, 0.9);
            } else {
                sphere.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
                sphere.material.opacity = Math.max(sphere.material.opacity - 0.01, 0.6);
            }

            // Reaktion auf Mausbewegung
            if (this.isLoaded) {
                const distance = sphere.position.distanceTo(this.camera.position);
                const influence = Math.max(0, 1 - distance / 50);
                
                sphere.position.x += (this.mouseX * influence * 5 - 
                    (sphere.position.x - userData.originalPosition.x)) * 0.02;
                sphere.position.z += (this.mouseY * influence * 5 - 
                    (sphere.position.z - userData.originalPosition.z)) * 0.02;
            }
        });

        this.renderer.render(this.scene, this.camera);
    }
}

// Klasse global verfuegbar machen
window.InteractiveAnimation = InteractiveAnimation;
