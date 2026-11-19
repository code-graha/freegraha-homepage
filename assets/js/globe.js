// freegraha.in — rotating 3D Earth (Three.js).
// Adapted from webgraha.com/assets/js/globe.js: sized to the hero instead of the
// window, and paused while the hero is scrolled out of view.
(function () {
    var canvas = document.getElementById('globe-canvas');
    if (!window.THREE || !canvas) return;

    // Defer WebGL init + texture fetch until the browser is idle so the
    // textures never compete with first paint.
    var schedule = window.requestIdleCallback || function (cb) { setTimeout(cb, 200); };
    schedule(init, { timeout: 1500 });

    function init() {
        var THREE = window.THREE;
        var host = canvas.parentElement;
        var w = host.clientWidth, h = host.clientHeight;

        var renderer;
        try {
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
        } catch (e) {
            return; // No WebGL: the glow behind the hero is enough.
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(33, w / h, 0.1, 100);
        camera.position.set(0, 0, 4.6);

        var group = new THREE.Group();
        group.rotation.z = 0.32;
        scene.add(group);

        // Full size on wide screens; shrink on tall/narrow (phone) screens so
        // the globe doesn't swallow the whole hero.
        function fitGlobe() {
            var aspect = w / h;
            var s = 1.15 * (aspect >= 1 ? 1 : Math.max(0.6, aspect * 1.35));
            group.scale.set(s, s, s);
        }
        fitGlobe();

        scene.add(new THREE.AmbientLight(0x3c4a64, 0.7));
        scene.add(new THREE.HemisphereLight(0x5a86ab, 0x5a4630, 0.55));
        var dirLight = new THREE.DirectionalLight(0xfff3dc, 2.1);
        dirLight.position.set(-2.1, -0.85, 2.3);
        scene.add(dirLight);

        function makeFallbackTexture() {
            var c = document.createElement('canvas');
            c.width = 1024; c.height = 512;
            var ctx = c.getContext('2d');
            var g = ctx.createLinearGradient(0, 0, 0, 512);
            g.addColorStop(0, '#1a365d'); g.addColorStop(1, '#0a1128');
            ctx.fillStyle = g; ctx.fillRect(0, 0, 1024, 512);
            for (var i = 0; i < 2400; i++) {
                var r = Math.random() * 22 + 4;
                ctx.fillStyle = Math.random() < 0.5
                    ? 'rgba(44,76,59,' + (Math.random() * 0.5 + 0.2).toFixed(2) + ')'
                    : 'rgba(74,59,44,' + (Math.random() * 0.4 + 0.15).toFixed(2) + ')';
                ctx.beginPath();
                ctx.arc(Math.random() * 1024, Math.random() * 512, r, 0, Math.PI * 2);
                ctx.fill();
            }
            return new THREE.CanvasTexture(c);
        }

        var base = 'assets/vendor/three-globe/';
        var loader = new THREE.TextureLoader();
        var material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0xc3cdd6),
            metalness: 0.28,
            roughness: 0.72
        });
        var renderOnce = function () { renderer.render(scene, camera); };
        material.map = loader.load(base + 'earth-blue-marble.jpg',
            function () { material.needsUpdate = true; renderOnce(); },
            undefined,
            function () { material.map = makeFallbackTexture(); material.needsUpdate = true; renderOnce(); }
        );
        material.bumpMap = loader.load(base + 'earth-topology.jpg');
        material.bumpScale = 0.018;
        material.metalnessMap = loader.load(base + 'earth-water.jpg');

        var earth = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 96), material);
        earth.rotation.y = -1.6;
        group.add(earth);

        var atmosphere = new THREE.Mesh(
            new THREE.SphereGeometry(1, 64, 64),
            new THREE.ShaderMaterial({
                uniforms: { uStrength: { value: 1.0 } },
                vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
                fragmentShader: 'varying vec3 vN; uniform float uStrength; void main(){ float i = pow(0.58 - dot(vN, vec3(0.0,0.0,1.0)), 3.0); i = clamp(i,0.0,1.0)*uStrength; gl_FragColor = vec4(vec3(0.36,0.56,0.48), 1.0) * i; }',
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true,
                depthWrite: false
            })
        );
        atmosphere.scale.set(1.16, 1.16, 1.16);
        group.add(atmosphere);

        var tx = 0, ty = 0, px = 0, py = 0;
        window.addEventListener('mousemove', function (e) {
            tx = (e.clientX / window.innerWidth) * 2 - 1;
            ty = (e.clientY / window.innerHeight) * 2 - 1;
        });

        function resize() {
            w = host.clientWidth; h = host.clientHeight;
            if (!w || !h) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
            fitGlobe();
            renderOnce();
        }
        window.addEventListener('resize', resize);

        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var visible = true, running = false;

        function frame() {
            if (!visible) { running = false; return; }
            requestAnimationFrame(frame);
            earth.rotation.y += 0.0011 * 1.1; // slow, smooth, continuous
            px += (tx - px) * 0.045;
            py += (ty - py) * 0.045;
            group.position.x = px * 0.07;
            group.rotation.x = py * 0.10;
            renderer.render(scene, camera);
        }
        function start() { if (!running && !reduceMotion) { running = true; frame(); } }

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                visible = entries[0].isIntersecting;
                if (visible) start();
            }).observe(host);
        }

        renderOnce();
        start();
    }
})();
