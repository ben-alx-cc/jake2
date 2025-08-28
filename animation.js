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
            this.updateStatus('Renderer...');
            this.setupRenderer();
            this.updateStatus('Szene/Kamera...');
            this.setupSceneCamera();
            this.updateStatus('Aurora...');
            this.createAuroraBackground();
            this.updateStatus('Partikel...');
            this.createSparkleParticles();
            this.updateStatus('Events...');
            this.setupEvents();
            this.animate();
            this.hideLoading();
            this.updateStatus('Läuft');
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

    updateStatus(text) {
        const el = document.getElementById('status');
        if (el) el.textContent = text;
    }
}

// Global verfügbar
window.InteractiveExperience = InteractiveExperience;
