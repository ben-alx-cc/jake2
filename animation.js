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
        
        // Sicherheitschecks
        if (typeof THREE === 'undefined') {
            console.error('THREE.js ist nicht geladen!');
            this.showError('Three.js konnte nicht geladen werden. Bitte Seite neu laden.');
            return;
        }
        
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
        container.appendChild(this.renderer.domElement);
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
        loading.classList.add('hidden');
        setTimeout(() => {
            loading.style.display = 'none';
        }, 1000);
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

// Diese Datei wird nur geladen wenn THREE.js verfügbar ist
// Initialisierung erfolgt in der HTML-Datei
