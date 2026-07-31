(function() {
    'use strict';

    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');

    let width, height, dpr;
    let particles = [];
    let targetParticles = [];
    let animationId = null;
    let time = 0;
    let startTime = 0;
    let mouseX = 0, mouseY = 0;
    let mouseInCanvas = false;
    let currentMode = 'particles';
    let currentTheme = 'dark';
    let isDissolving = false;
    let dissolveStartTime = 0;
    const dissolveDuration = 5000;
    let currentSource = 'preset';
    let currentImageData = null;

    const defaultParams = {
        scale: 1.0,
        density: 5000,
        size: 3.0,
        brightness: 2.5,
        duration: 3000,
        pulse: 0.5,
        drift: 0.1,
        attractR: 180,
        attractStr: 0.06,
        repelR: 100,
        repelStr: 1.2,
        dispersion: 0.1,
        iridescence: 0.8,
        roughness: 0.15,
        specular: 2.7,
        fresnel: 0.55,
        flowSpeed: 0.5,
        distortion: 0.6,
        brushAngle: 2.2
    };

    let params = { ...defaultParams };

    const themes = {
        dark: {
            bg: '#000000',
            particle: '#ffffff',
            glow: 'rgba(255,255,255,0.3)'
        },
        light: {
            bg: '#f5f5f5',
            particle: '#333333',
            glow: 'rgba(0,0,0,0.1)'
        },
        cyberpunk: {
            bg: '#0a0a0f',
            particle: '#00ffff',
            glow: 'rgba(0,255,255,0.4)'
        },
        sunset: {
            bg: '#1a1a2e',
            particle: '#ff6b6b',
            glow: 'rgba(255,107,107,0.4)'
        }
    };

    const presets = [
        { name: '心形', type: 'shape', shape: 'heart' },
        { name: '星形', type: 'shape', shape: 'star' },
        { name: '圆形', type: 'shape', shape: 'circle' },
        { name: '字母 A', type: 'text', text: 'A' },
        { name: '字母 B', type: 'text', text: 'B' },
        { name: '爱心文字', type: 'text', text: 'LOVE' },
        { name: '大脑', type: 'shape', shape: 'brain' }
    ];
    let currentPresetIndex = 0;

    function init() {
        resize();
        window.addEventListener('resize', resize);
        setupEventListeners();
        loadPreset(presets[0]);
        animate();
    }

    function resize() {
        dpr = window.devicePixelRatio || 1;
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
    }

    function setupEventListeners() {
        canvas.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            mouseInCanvas = true;
        });
        canvas.addEventListener('mouseleave', () => {
            mouseInCanvas = false;
        });
        canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                mouseX = e.touches[0].clientX;
                mouseY = e.touches[0].clientY;
                mouseInCanvas = true;
            }
        });
        canvas.addEventListener('touchend', () => {
            mouseInCanvas = false;
        });

        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        document.getElementById('fileInput').addEventListener('change', handleFileUpload);
        document.getElementById('resetAnimBtn').addEventListener('click', resetAnimation);
        document.getElementById('dissolveBtn').addEventListener('click', toggleDissolve);

        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMode = tab.dataset.mode;
                toggleModeSections();
                resetAnimation();
            });
        });

        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const preset = btn.dataset.preset;
                applyPresetEffect(preset);
            });
        });

        setupSlider('scaleSlider', 'scaleValue', 'scale');
        setupSlider('densitySlider', 'densityValue', 'density', true);
        setupSlider('sizeSlider', 'sizeValue', 'size');
        setupSlider('brightnessSlider', 'brightnessValue', 'brightness');
        setupSlider('durationSlider', 'durationValue', 'duration', false, ' ms');
        setupSlider('pulseSlider', 'pulseValue', 'pulse');
        setupSlider('driftSlider', 'driftValue', 'drift');
        setupSlider('attractRSlider', 'attractRValue', 'attractR', true);
        setupSlider('attractStrSlider', 'attractStrValue', 'attractStr');
        setupSlider('repelRSlider', 'repelRValue', 'repelR', true);
        setupSlider('repelStrSlider', 'repelStrValue', 'repelStr');

        setupSlider('dispersionSlider', 'dispersionValue', 'dispersion');
        setupSlider('iridescenceSlider', 'iridescenceValue', 'iridescence');
        setupSlider('roughnessSlider', 'roughnessValue', 'roughness');
        setupSlider('specularSlider', 'specularValue', 'specular');
        setupSlider('fresnelSlider', 'fresnelValue', 'fresnel');
        setupSlider('flowSpeedSlider', 'flowSpeedValue', 'flowSpeed');
        setupSlider('distortionSlider', 'distortionValue', 'distortion');
        setupSlider('brushAngleSlider', 'brushAngleValue', 'brushAngle');

        document.getElementById('themeSelect').addEventListener('change', (e) => {
            currentTheme = e.target.value;
            document.body.className = 'theme-' + currentTheme;
        });

        document.getElementById('resetBtn').addEventListener('click', resetToDefaults);

        document.getElementById('prevPreset').addEventListener('click', () => {
            currentPresetIndex = (currentPresetIndex - 1 + presets.length) % presets.length;
            loadPreset(presets[currentPresetIndex]);
        });
        document.getElementById('nextPreset').addEventListener('click', () => {
            currentPresetIndex = (currentPresetIndex + 1) % presets.length;
            loadPreset(presets[currentPresetIndex]);
        });
    }

    function setupSlider(sliderId, valueId, paramKey, isInt, suffix) {
        const slider = document.getElementById(sliderId);
        const valueEl = document.getElementById(valueId);
        if (!slider || !valueEl) return;

        slider.addEventListener('input', () => {
            let val = parseFloat(slider.value);
            if (isInt) val = Math.round(val);
            params[paramKey] = val;
            valueEl.textContent = val + (suffix || '');
        });

        slider.addEventListener('change', () => {
            if (paramKey === 'density') {
                regenerateParticles();
            }
        });
    }

    function toggleModeSections() {
        const particleSections = document.querySelectorAll('.particles-section');
        const prismaticSections = document.querySelectorAll('.prismatic-section');
        
        const isParticles = currentMode === 'particles' || currentMode === 'particle3d' || currentMode === 'terrain';
        
        particleSections.forEach(s => s.style.display = isParticles ? 'block' : 'none');
        prismaticSections.forEach(s => s.style.display = currentMode === 'prismatic' ? 'block' : 'none');
    }

    function handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        if (file.name.endsWith('.svg')) {
            reader.onload = (event) => {
                loadFromSVG(event.target.result);
            };
            reader.readAsText(file);
        } else {
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    loadFromImage(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function loadFromSVG(svgText) {
        const img = new Image();
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            loadFromImage(img);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }

    function loadFromImage(img) {
        const maxSize = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
            const ratio = Math.min(maxSize / w, maxSize / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w;
        tempCanvas.height = h;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(img, 0, 0, w, h);

        const imageData = tempCtx.getImageData(0, 0, w, h);
        const data = imageData.data;

        currentSource = 'image';
        currentImageData = {
            data: [...data],
            width: w,
            height: h
        };

        generatePointsFromImageData(currentImageData);
    }

    function generatePointsFromImageData(imgData) {
        const { data, width: w, height: h } = imgData;

        const grayData = [];
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            grayData.push(gray);
        }

        const edgeData = sobelEdgeDetection(grayData, w, h);
        const threshold = 30;

        const edgePoints = [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = y * w + x;
                if (edgeData[idx] > threshold) {
                    const pixelIdx = idx * 4;
                    const r = data[pixelIdx];
                    const g = data[pixelIdx + 1];
                    const b = data[pixelIdx + 2];
                    
                    edgePoints.push({
                        x: x - w / 2,
                        y: y - h / 2,
                        color: `rgba(${r}, ${g}, ${b}, 1)`
                    });
                }
            }
        }

        if (edgePoints.length === 0) {
            for (let i = 0; i < params.density; i++) {
                edgePoints.push({
                    x: (Math.random() - 0.5) * w,
                    y: (Math.random() - 0.5) * h,
                    color: 'rgba(255,255,255,1)'
                });
            }
        }

        const interiorPoints = [];
        for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
                const idx = y * w + x;
                const pixelIdx = idx * 4;
                const alpha = data[pixelIdx + 3];
                const gray = grayData[idx];
                
                if (alpha > 100 && gray > 40 && edgeData[idx] < 10) {
                    const r = data[pixelIdx];
                    const g = data[pixelIdx + 1];
                    const b = data[pixelIdx + 2];
                    
                    interiorPoints.push({
                        x: x - w / 2,
                        y: y - h / 2,
                        color: `rgba(${r}, ${g}, ${b}, ${alpha / 255})`
                    });
                }
            }
        }

        let points = [];

        const edgeCount = Math.min(Math.floor(params.density * 0.5), edgePoints.length);
        if (edgePoints.length > 0) {
            const sampledEdges = uniformSample(edgePoints, Math.max(edgeCount, 100));
            points = points.concat(sampledEdges);
        }

        const interiorCount = params.density - points.length;
        if (interiorPoints.length > 0) {
            const sampledInterior = uniformSample(interiorPoints, Math.max(interiorCount, 0));
            points = points.concat(sampledInterior);
        }

        while (points.length < params.density && edgePoints.length > 0) {
            const idx = Math.floor(Math.random() * edgePoints.length);
            const p = edgePoints[idx];
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 3;
            points.push({
                x: p.x + Math.cos(angle) * dist,
                y: p.y + Math.sin(angle) * dist,
                color: p.color
            });
        }

        if (points.length > params.density) {
            const shuffled = points.sort(() => Math.random() - 0.5);
            points = shuffled.slice(0, params.density);
        }

        setTargetParticles(points);
    }

    function sobelEdgeDetection(grayData, w, h) {
        const result = new Array(w * h).fill(0);
        
        const gx = [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1]
        ];
        
        const gy = [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1]
        ];

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                let sumX = 0;
                let sumY = 0;

                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = (y + ky) * w + (x + kx);
                        sumX += grayData[idx] * gx[ky + 1][kx + 1];
                        sumY += grayData[idx] * gy[ky + 1][kx + 1];
                    }
                }

                result[y * w + x] = Math.sqrt(sumX * sumX + sumY * sumY);
            }
        }

        return result;
    }

    function detectEdges(data, w, h) {
        const edges = [];
        const threshold = 30;

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                const alpha = data[idx + 3];

                if (alpha < 10) continue;

                const leftIdx = (y * w + (x - 1)) * 4;
                const rightIdx = (y * w + (x + 1)) * 4;
                const topIdx = ((y - 1) * w + x) * 4;
                const bottomIdx = ((y + 1) * w + x) * 4;

                const leftAlpha = data[leftIdx + 3];
                const rightAlpha = data[rightIdx + 3];
                const topAlpha = data[topIdx + 3];
                const bottomAlpha = data[bottomIdx + 3];

                const alphaDiff = Math.abs(alpha - leftAlpha) + Math.abs(alpha - rightAlpha) +
                                  Math.abs(alpha - topAlpha) + Math.abs(alpha - bottomAlpha);

                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                const leftGray = (data[leftIdx] + data[leftIdx + 1] + data[leftIdx + 2]) / 3;
                const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
                const topGray = (data[topIdx] + data[topIdx + 1] + data[topIdx + 2]) / 3;
                const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;

                const colorDiff = Math.abs(gray - leftGray) + Math.abs(gray - rightGray) +
                                  Math.abs(gray - topGray) + Math.abs(gray - bottomGray);

                if (alphaDiff > 80 || colorDiff > threshold) {
                    edges.push({
                        x: x - w / 2,
                        y: y - h / 2,
                        color: `rgba(${data[idx]}, ${data[idx + 1]}, ${data[idx + 2]}, 1)`
                    });
                }
            }
        }

        return edges;
    }

    function sampleInterior(data, w, h, count) {
        const points = [];
        const targetStep = Math.max(1, Math.floor(Math.sqrt((w * h) / (count * 1.5))));
        const step = Math.min(targetStep, 4);

        for (let y = 0; y < h; y += step) {
            for (let x = 0; x < w; x += step) {
                const idx = (y * w + x) * 4;
                const alpha = data[idx + 3];

                if (alpha > 30) {
                    points.push({
                        x: x - w / 2,
                        y: y - h / 2,
                        color: `rgba(${data[idx]}, ${data[idx + 1]}, ${data[idx + 2]}, ${alpha / 255})`
                    });
                }
            }
        }

        return points;
    }

    function uniformSample(points, count) {
        if (points.length <= count) return points.slice();

        const sampled = [];
        const step = points.length / count;

        for (let i = 0; i < count; i++) {
            const idx = Math.floor(i * step + Math.random() * step * 0.3);
            const clampedIdx = Math.min(points.length - 1, Math.max(0, idx));
            sampled.push(points[clampedIdx]);
        }

        return sampled;
    }

    function loadPreset(preset) {
        currentSource = 'preset';
        currentImageData = null;
        let points = [];

        if (preset.type === 'shape') {
            points = generateShapePoints(preset.shape);
        } else if (preset.type === 'text') {
            points = generateTextPoints(preset.text);
        }

        setTargetParticles(points);
    }

    function generateShapePoints(shape) {
        const points = [];
        const count = params.density;
        const cx = 0, cy = 0;

        for (let i = 0; i < count; i++) {
            let x, y;
            const t = (i / count) * Math.PI * 2;
            const r = 150 * params.scale;

            switch (shape) {
                case 'circle':
                    const angle = Math.random() * Math.PI * 2;
                    const rad = Math.sqrt(Math.random()) * r;
                    x = cx + Math.cos(angle) * rad;
                    y = cy + Math.sin(angle) * rad;
                    break;

                case 'heart':
                    const ht = Math.random() * Math.PI * 2;
                    const hr = Math.pow(Math.random(), 0.5);
                    x = 16 * Math.pow(Math.sin(ht), 3) * 8 * hr * params.scale;
                    y = -(13 * Math.cos(ht) - 5 * Math.cos(2 * ht) - 2 * Math.cos(3 * ht) - Math.cos(4 * ht)) * 8 * hr * params.scale;
                    break;

                case 'star':
                    const spikes = 5;
                    const outerR = r;
                    const innerR = r * 0.4;
                    let minDist = Infinity;
                    let bestX = 0, bestY = 0;
                    for (let tries = 0; tries < 20; tries++) {
                        const sa = Math.random() * Math.PI * 2;
                        const sr = Math.random() * r;
                        const sx = cx + Math.cos(sa) * sr;
                        const sy = cy + Math.sin(sa) * sr;
                        
                        let inside = false;
                        for (let s = 0; s < spikes * 2; s++) {
                            const a1 = (s / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
                            const a2 = ((s + 1) / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
                            const r1 = s % 2 === 0 ? outerR : innerR;
                            const r2 = (s + 1) % 2 === 0 ? outerR : innerR;
                            
                            if (isPointInTriangle(sx, sy, cx, cy, 
                                cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1,
                                cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2)) {
                                inside = true;
                                break;
                            }
                        }
                        
                        if (inside) {
                            bestX = sx;
                            bestY = sy;
                            break;
                        }
                    }
                    x = bestX;
                    y = bestY;
                    break;

                case 'brain':
                    const bt = Math.random() * Math.PI * 2;
                    const br = Math.random();
                    const lobe = i % 2 === 0 ? -1 : 1;
                    x = lobe * (60 + 50 * Math.sin(bt * 2)) * params.scale * (0.6 + 0.4 * br);
                    y = (Math.sin(bt) * 50 + Math.sin(bt * 3) * 20) * params.scale * (0.6 + 0.4 * br);
                    if (Math.random() < 0.3) {
                        x += (Math.random() - 0.5) * 30;
                        y += (Math.random() - 0.5) * 20;
                    }
                    break;

                default:
                    x = (Math.random() - 0.5) * r * 2;
                    y = (Math.random() - 0.5) * r * 2;
            }

            points.push({ x, y, color: null });
        }

        return points;
    }

    function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
        const d1 = sign(px, py, x1, y1, x2, y2);
        const d2 = sign(px, py, x2, y2, x3, y3);
        const d3 = sign(px, py, x3, y3, x1, y1);
        const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
        const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
        return !(hasNeg && hasPos);
    }

    function sign(px, py, x1, y1, x2, y2) {
        return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
    }

    function generateTextPoints(text) {
        const points = [];
        const fontSize = 200 * params.scale;

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 600;
        tempCanvas.height = 400;
        tempCtx.fillStyle = 'white';
        tempCtx.font = `bold ${fontSize}px Arial, sans-serif`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.fillText(text, 300, 200);

        const imageData = tempCtx.getImageData(0, 0, 600, 400);
        const data = imageData.data;
        const step = 3;

        for (let y = 0; y < 400; y += step) {
            for (let x = 0; x < 600; x += step) {
                const idx = (y * 600 + x) * 4;
                if (data[idx + 3] > 50) {
                    points.push({
                        x: x - 300,
                        y: y - 200,
                        color: null
                    });
                }
            }
        }

        while (points.length < params.density && points.length > 0) {
            const idx = Math.floor(Math.random() * points.length);
            const p = points[idx];
            points.push({
                x: p.x + (Math.random() - 0.5) * step * 2,
                y: p.y + (Math.random() - 0.5) * step * 2,
                color: null
            });
        }

        if (points.length > params.density) {
            const shuffled = points.sort(() => Math.random() - 0.5);
            return shuffled.slice(0, params.density);
        }

        return points;
    }

    function setTargetParticles(targetPoints) {
        targetParticles = targetPoints || [];
        
        const centerX = width / 2;
        const centerY = height / 2;

        if (particles.length === 0) {
            for (let i = 0; i < targetParticles.length; i++) {
                particles.push(createParticle(centerX, centerY, i));
            }
        }

        if (particles.length > targetParticles.length) {
            particles.length = targetParticles.length;
        } else {
            while (particles.length < targetParticles.length) {
                particles.push(createParticle(centerX, centerY, particles.length));
            }
        }

        resetAnimation();
    }

    function createParticle(cx, cy, index) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * Math.max(width, height);
        return {
            x: cx + Math.cos(angle) * dist,
            y: cy + Math.sin(angle) * dist,
            vx: 0,
            vy: 0,
            size: 0.5 + Math.random() * 1,
            offsetX: Math.random() * Math.PI * 2,
            offsetY: Math.random() * Math.PI * 2,
            index: index,
            alpha: 1,
            dissolveVx: 0,
            dissolveVy: 0,
            dissolveDelay: 0,
            dissolveWobble: 0,
            baseAlpha: 1
        };
    }

    function regenerateParticles() {
        if (currentSource === 'image' && currentImageData) {
            generatePointsFromImageData(currentImageData);
        } else {
            loadPreset(presets[currentPresetIndex]);
        }
    }

    function resetAnimation() {
        startTime = performance.now();
        isDissolving = false;
        const btn = document.getElementById('dissolveBtn');
        if (btn) btn.classList.remove('active');
        
        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < particles.length; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * Math.max(width, height) + 200;
            particles[i].x = centerX + Math.cos(angle) * dist;
            particles[i].y = centerY + Math.sin(angle) * dist;
            particles[i].vx = 0;
            particles[i].vy = 0;
            particles[i].dissolveVx = 0;
            particles[i].dissolveVy = 0;
            particles[i].dissolveDelay = 0;
            particles[i].baseAlpha = 1;
        }
    }

    function toggleDissolve() {
        const btn = document.getElementById('dissolveBtn');
        
        if (isDissolving) {
            isDissolving = false;
            if (btn) {
                btn.classList.remove('active');
                btn.textContent = '✨ 消散成泡沫';
            }
            resetAnimation();
        } else {
            isDissolving = true;
            dissolveStartTime = performance.now();
            if (btn) {
                btn.classList.add('active');
                btn.textContent = '♻️ 恢复原状';
            }
            
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.5 + Math.random() * 2;
                p.dissolveVx = Math.cos(angle) * speed;
                p.dissolveVy = -0.5 - Math.random() * 2.5;
                p.dissolveDelay = Math.random() * 2000;
                p.dissolveWobble = Math.random() * Math.PI * 2;
                p.baseAlpha = 1;
            }
        }
    }

    function resetToDefaults() {
        params = { ...defaultParams };
        
        document.querySelectorAll('input[type="range"]').forEach(slider => {
            const param = slider.id.replace('Slider', '');
            const paramKey = param === 'duration' ? 'duration' : param;
            if (defaultParams[paramKey] !== undefined) {
                slider.value = defaultParams[paramKey];
                slider.dispatchEvent(new Event('input'));
            }
        });

        regenerateParticles();
    }

    function applyPresetEffect(preset) {
        if (preset === 'particles') {
            currentMode = 'particles';
            params.scale = 1.0;
            params.density = 10000;
            params.size = 3.0;
            params.brightness = 2.5;
            params.pulse = 0.5;
            params.drift = 0.1;
        } else if (preset === 'prismatic') {
            currentMode = 'prismatic';
            params.scale = 0.8;
            params.density = 10000;
            params.dispersion = 0.1;
            params.iridescence = 0.8;
            params.roughness = 0.15;
            params.specular = 2.7;
            params.fresnel = 0.55;
            params.flowSpeed = 0.5;
            params.distortion = 0.6;
            params.brushAngle = 2.2;
        } else if (preset === 'terrain') {
            currentMode = 'terrain';
            params.scale = 1.0;
            params.density = 10000;
        } else if (preset === 'particle3d') {
            currentMode = 'particle3d';
            params.scale = 1.0;
            params.density = 10000;
            params.size = 2.5;
            params.brightness = 2.0;
        }

        updateSliderValues();
        toggleModeSections();
        updateModeTabs();
        regenerateParticles();
        resetAnimation();
    }

    function updateModeTabs() {
        document.querySelectorAll('.mode-tab').forEach(tab => {
            if (tab.dataset.mode === currentMode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }

    function updateSliderValues() {
        const sliders = [
            { id: 'scaleSlider', param: 'scale', valueId: 'scaleValue' },
            { id: 'densitySlider', param: 'density', valueId: 'densityValue', int: true },
            { id: 'sizeSlider', param: 'size', valueId: 'sizeValue' },
            { id: 'brightnessSlider', param: 'brightness', valueId: 'brightnessValue' },
            { id: 'durationSlider', param: 'duration', valueId: 'durationValue', suffix: ' ms' },
            { id: 'pulseSlider', param: 'pulse', valueId: 'pulseValue' },
            { id: 'driftSlider', param: 'drift', valueId: 'driftValue' },
            { id: 'attractRSlider', param: 'attractR', valueId: 'attractRValue', int: true },
            { id: 'attractStrSlider', param: 'attractStr', valueId: 'attractStrValue' },
            { id: 'repelRSlider', param: 'repelR', valueId: 'repelRValue', int: true },
            { id: 'repelStrSlider', param: 'repelStr', valueId: 'repelStrValue' },
            { id: 'dispersionSlider', param: 'dispersion', valueId: 'dispersionValue' },
            { id: 'iridescenceSlider', param: 'iridescence', valueId: 'iridescenceValue' },
            { id: 'roughnessSlider', param: 'roughness', valueId: 'roughnessValue' },
            { id: 'specularSlider', param: 'specular', valueId: 'specularValue' },
            { id: 'fresnelSlider', param: 'fresnel', valueId: 'fresnelValue' },
            { id: 'flowSpeedSlider', param: 'flowSpeed', valueId: 'flowSpeedValue' },
            { id: 'distortionSlider', param: 'distortion', valueId: 'distortionValue' },
            { id: 'brushAngleSlider', param: 'brushAngle', valueId: 'brushAngleValue' }
        ];

        sliders.forEach(s => {
            const slider = document.getElementById(s.id);
            const valueEl = document.getElementById(s.valueId);
            if (slider && valueEl) {
                let val = params[s.param];
                if (s.int) val = Math.round(val);
                slider.value = val;
                valueEl.textContent = val + (s.suffix || '');
            }
        });
    }

    function animate() {
        time = performance.now();
        const elapsed = time - startTime;

        ctx.fillStyle = themes[currentTheme].bg;
        ctx.fillRect(0, 0, width, height);

        if (currentMode === 'particles') {
            renderParticles(elapsed);
        } else if (currentMode === 'prismatic') {
            renderPrismatic(elapsed);
        } else if (currentMode === 'terrain') {
            renderTerrain(elapsed);
        } else if (currentMode === 'particle3d') {
            renderParticle3D(elapsed);
        }

        animationId = requestAnimationFrame(animate);
    }

    function renderParticles(elapsed) {
        const centerX = width / 2;
        const centerY = height / 2;
        const progress = Math.min(1, elapsed / params.duration);
        const easeProgress = easeOutCubic(progress);

        const dissolveElapsed = isDissolving ? (time - dissolveStartTime) : 0;

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const tp = targetParticles[i];

            if (!tp) continue;

            const targetX = centerX + tp.x * params.scale;
            const targetY = centerY + tp.y * params.scale;

            if (progress < 1 && !isDissolving) {
                const delay = (i / particles.length) * 200;
                const adjustedProgress = Math.max(0, Math.min(1, (elapsed - delay) / (params.duration * 0.8)));
                const eased = easeOutExpo(adjustedProgress);
                
                p.x = p.x + (targetX - p.x) * 0.05 * eased * 2;
                p.y = p.y + (targetY - p.y) * 0.05 * eased * 2;
            } else if (isDissolving) {
                const particleTime = Math.max(0, dissolveElapsed - p.dissolveDelay);
                const dissolveProgress = Math.min(1, particleTime / dissolveDuration);
                const easedDissolve = easeInQuad(dissolveProgress);

                p.dissolveWobble += 0.05 + Math.random() * 0.02;
                const wobbleX = Math.sin(p.dissolveWobble) * 0.8;
                
                p.dissolveVy += 0.02;
                
                p.x += p.dissolveVx + wobbleX;
                p.y += p.dissolveVy;
                
                p.baseAlpha = Math.max(0, 1 - easedDissolve);
                
                p.vx = 0;
                p.vy = 0;
            } else {
                if (params.drift > 0) {
                    const driftX = Math.sin(time * 0.001 * params.drift + p.offsetX) * 2;
                    const driftY = Math.cos(time * 0.001 * params.drift + p.offsetY) * 2;
                    p.vx += (targetX + driftX - p.x) * 0.02;
                    p.vy += (targetY + driftY - p.y) * 0.02;
                } else {
                    p.vx += (targetX - p.x) * 0.02;
                    p.vy += (targetY - p.y) * 0.02;
                }

                if (mouseInCanvas) {
                    const dx = mouseX - p.x;
                    const dy = mouseY - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < params.repelR && dist > 0) {
                        const force = (1 - dist / params.repelR) * params.repelStr;
                        p.vx -= (dx / dist) * force;
                        p.vy -= (dy / dist) * force;
                    } else if (dist < params.attractR && dist > 0) {
                        const force = (1 - dist / params.attractR) * params.attractStr;
                        p.vx += (dx / dist) * force;
                        p.vy += (dy / dist) * force;
                    }
                }

                p.vx *= 0.9;
                p.vy *= 0.9;
                p.x += p.vx;
                p.y += p.vy;
            }

            let size = p.size * params.size;
            let alpha = p.alpha * params.brightness;
            
            if (isDissolving) {
                const particleTime = Math.max(0, dissolveElapsed - p.dissolveDelay);
                const dissolveProgress = Math.min(1, particleTime / dissolveDuration);
                size *= 1 + dissolveProgress * 2;
                alpha = p.baseAlpha * params.brightness;
            } else if (params.pulse > 0) {
                size *= 0.8 + 0.2 * Math.sin(time * 0.003 * params.pulse + p.offsetX);
            }

            const color = tp.color || themes[currentTheme].particle;
            
            if (isDissolving) {
                ctx.globalAlpha = alpha * 0.3;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = alpha * 0.6;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = alpha;
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.beginPath();
                ctx.arc(p.x - size * 0.3, p.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                
                ctx.globalAlpha = alpha * 0.2;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = alpha * 0.4;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = alpha * 0.7;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();

                ctx.globalAlpha = alpha;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1;
    }

    function easeInQuad(t) {
        return t * t;
    }

    function renderPrismatic(elapsed) {
        const centerX = width / 2;
        const centerY = height / 2;
        const progress = Math.min(1, elapsed / params.duration);
        const easeProgress = easeOutCubic(progress);

        const dissolveElapsed = isDissolving ? (time - dissolveStartTime) : 0;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const tp = targetParticles[i];
            if (!tp) continue;

            const targetX = centerX + tp.x * params.scale;
            const targetY = centerY + tp.y * params.scale;

            if (progress < 1 && !isDissolving) {
                const delay = (i / particles.length) * 300;
                const adjustedProgress = Math.max(0, Math.min(1, (elapsed - delay) / params.duration));
                const eased = easeOutExpo(adjustedProgress);
                
                p.x = p.x + (targetX - p.x) * 0.03 * eased * 2;
                p.y = p.y + (targetY - p.y) * 0.03 * eased * 2;
            } else if (isDissolving) {
                const particleTime = Math.max(0, dissolveElapsed - p.dissolveDelay);
                const dissolveProgress = Math.min(1, particleTime / dissolveDuration);
                const easedDissolve = easeInQuad(dissolveProgress);

                p.dissolveWobble += 0.05 + Math.random() * 0.02;
                const wobbleX = Math.sin(p.dissolveWobble) * 0.8;
                
                p.dissolveVy += 0.02;
                
                p.x += p.dissolveVx + wobbleX;
                p.y += p.dissolveVy;
                
                p.baseAlpha = Math.max(0, 1 - easedDissolve);
                
                p.vx = 0;
                p.vy = 0;
            } else {
                const flow = params.flowSpeed;
                const dist = Math.sin(time * 0.0005 * flow + p.offsetX * 0.1) * params.distortion * 20;
                const angle = params.brushAngle + Math.sin(time * 0.001 * flow + p.offsetY) * 0.3;
                
                const fx = Math.cos(angle) * dist;
                const fy = Math.sin(angle) * dist;

                p.vx += (targetX + fx - p.x) * 0.02;
                p.vy += (targetY + fy - p.y) * 0.02;

                if (mouseInCanvas) {
                    const dx = mouseX - p.x;
                    const dy = mouseY - p.y;
                    const md = Math.sqrt(dx * dx + dy * dy);
                    if (md < 200 && md > 0) {
                        const force = (1 - md / 200) * 0.5;
                        p.vx -= (dx / md) * force;
                        p.vy -= (dy / md) * force;
                    }
                }

                p.vx *= 0.92;
                p.vy *= 0.92;
                p.x += p.vx;
                p.y += p.vy;
            }

            let size = p.size * params.size;
            let alpha = params.brightness;
            
            if (isDissolving) {
                const particleTime = Math.max(0, dissolveElapsed - p.dissolveDelay);
                const dissolveProgress = Math.min(1, particleTime / dissolveDuration);
                size *= 1 + dissolveProgress * 2;
                alpha = p.baseAlpha * params.brightness;
            }

            const hue = (p.index * 2 + time * 0.05 * params.flowSpeed) % 360;
            const iridescence = params.iridescence;
            const dispersion = params.dispersion;

            if (isDissolving) {
                ctx.globalAlpha = alpha * 0.2;
                ctx.fillStyle = `hsla(${hue}, 80%, 70%, 1)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = `hsla(${hue}, 90%, 85%, 1)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size * 1.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.globalAlpha = alpha;
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.beginPath();
                ctx.arc(p.x - size * 0.3, p.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                for (let c = 0; c < 3; c++) {
                    const offset = (c - 1) * dispersion * 10;
                    const hueOffset = c * 120 * iridescence;
                    
                    ctx.globalAlpha = 0.3 * alpha;
                    const h = (hue + hueOffset) % 360;
                    const s = 80 + params.roughness * 20;
                    const l = 50 + params.specular * 10;
                    ctx.fillStyle = `hsla(${h}, ${s}%, ${Math.min(90, l)}%, 0.8)`;
                    
                    ctx.beginPath();
                    ctx.arc(p.x + offset, p.y, size * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.globalAlpha = 0.8 * alpha;
                ctx.fillStyle = `hsla(${hue}, 70%, 80%, 1)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();

                if (params.fresnel > 0) {
                    const edgeAlpha = params.fresnel * 0.3;
                    ctx.globalAlpha = edgeAlpha * alpha;
                    ctx.fillStyle = `hsla(${hue}, 90%, 90%, 1)`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, size * 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    }

    function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }

    function renderTerrain(elapsed) {
        const centerX = width / 2;
        const centerY = height / 2;
        const progress = Math.min(1, elapsed / params.duration);
        const easeProgress = easeOutCubic(progress);

        const lineCount = 80;
        const lineHeight = 12;
        const amplitude = 60;
        const noiseScale = 0.015;
        const noiseSpeed = 0.3;

        ctx.strokeStyle = themes[currentTheme].particle;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.9;

        const shapeHeight = lineCount * lineHeight;
        const startY = centerY - shapeHeight / 2;

        const shapeWidth = 500 * params.scale;
        const shapeLeft = centerX - shapeWidth / 2;
        const shapeRight = centerX + shapeWidth / 2;

        for (let lineIdx = 0; lineIdx < lineCount; lineIdx++) {
            const y = startY + lineIdx * lineHeight;
            const lineProgress = lineIdx / lineCount;

            if (lineProgress > easeProgress) break;

            ctx.beginPath();

            const points = [];
            const pointCount = 200;

            for (let i = 0; i <= pointCount; i++) {
                const xProgress = i / pointCount;
                const x = shapeLeft + xProgress * shapeWidth;

                let heightOffset = 0;

                if (targetParticles.length > 0) {
                    const px = xProgress;
                    const py = lineProgress;
                    
                    let inShape = false;
                    let closestDist = Infinity;
                    
                    for (let j = 0; j < targetParticles.length; j += 5) {
                        const tp = targetParticles[j];
                        const tpx = (tp.x + 250) / 500;
                        const tpy = (tp.y + 200) / 400;
                        
                        const dx = (px - tpx) * shapeWidth;
                        const dy = (lineProgress - tpy) * shapeHeight;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist < closestDist) {
                            closestDist = dist;
                        }
                    }
                    
                    if (closestDist < 50) {
                        heightOffset = (50 - closestDist) / 50 * amplitude * 0.6;
                    }
                }

                const noiseVal = Math.sin(xProgress * Math.PI * 4 + time * 0.001 * noiseSpeed + lineIdx * 0.1) * 0.3
                    + Math.sin(xProgress * Math.PI * 8 + time * 0.0015 * noiseSpeed) * 0.15
                    + Math.sin(xProgress * Math.PI * 2 + lineIdx * 0.05 + time * 0.0005 * noiseSpeed) * 0.5;

                const totalHeight = noiseVal * amplitude * 0.3 + heightOffset;

                if (i === 0) {
                    ctx.moveTo(x, y + totalHeight);
                } else {
                    ctx.lineTo(x, y + totalHeight);
                }
            }

            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }

    function renderParticle3D(elapsed) {
        const centerX = width / 2;
        const centerY = height / 2;
        const progress = Math.min(1, elapsed / params.duration);
        const easeProgress = easeOutCubic(progress);

        const dissolveElapsed = isDissolving ? (time - dissolveStartTime) : 0;

        const rotationY = time * 0.0003;
        const rotationX = Math.sin(time * 0.0002) * 0.2;

        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);

        const depthParticles = [];

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const tp = targetParticles[i];

            if (!tp) continue;

            const t = easeProgress;
            p.currentX = p.startX + (tp.x - p.startX) * t;
            p.currentY = p.startY + (tp.y - p.startY) * t;

            const pulse = Math.sin(time * 0.001 * params.pulse + p.phase) * 0.02;
            const driftX = Math.sin(time * 0.0005 * params.drift + p.phase * 2) * 2;
            const driftY = Math.cos(time * 0.0005 * params.drift + p.phase * 1.5) * 2;

            let x = p.currentX * (1 + pulse) + driftX;
            let y = p.currentY * (1 + pulse) + driftY;
            let z = (tp.z || 0) + Math.sin(time * 0.001 + p.phase) * 5;

            if (tp.z === undefined) {
                const brightness = p.brightness || 0.5;
                z = (brightness - 0.5) * 80;
            }

            const y1 = y * cosX - z * sinX;
            const z1 = y * sinX + z * cosX;
            const x1 = x * cosY + z1 * sinY;
            const z2 = -x * sinY + z1 * cosY;

            const perspective = 500;
            const scale = perspective / (perspective + z2);
            const screenX = centerX + x1 * scale * params.scale;
            const screenY = centerY + y1 * scale * params.scale;

            depthParticles.push({
                x: screenX,
                y: screenY,
                z: z2,
                scale: scale,
                color: p.color || themes[currentTheme].particle,
                size: p.size || 2,
                brightness: p.brightness || 0.5,
                alpha: p.alpha || 1
            });
        }

        depthParticles.sort((a, b) => a.z - b.z);

        for (let i = 0; i < depthParticles.length; i++) {
            const p = depthParticles[i];
            
            let size = p.size * params.size * p.scale;
            let alpha = p.alpha * params.brightness * p.scale;

            if (isDissolving) {
                const dissolveProgress = Math.min(1, dissolveElapsed / dissolveDuration);
                size *= 1 + dissolveProgress * 1.5;
                alpha *= (1 - dissolveProgress);
            }

            const color = p.color;

            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            
            ctx.globalAlpha = alpha * 0.15;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = alpha * 0.3;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }

    init();
})();
