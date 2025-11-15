// Hand Tracker Class
class HandTracker {
    constructor(videoElement, onHandsDetected) {
        this.video = videoElement;
        this.onHandsDetected = onHandsDetected;
        this.hands = null;
        this.camera = null;
        this.handPositions = [];
        this.smoothedPositions = [];
        this.isTracking = false;
        
        this.init();
    }

    async init() {
        try {
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 2,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.hands.onResults((results) => {
                this.processHands(results);
            });

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 640, 
                    height: 480,
                    facingMode: 'user'
                } 
            });
            
            this.video.srcObject = stream;
            this.video.play();

            // Process video frames
            const processFrame = async () => {
                if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                    await this.hands.send({ image: this.video });
                }
                if (this.isTracking) {
                    requestAnimationFrame(processFrame);
                }
            };

            this.video.addEventListener('loadeddata', () => {
                this.isTracking = true;
                this.updateStatus('Active');
                processFrame();
            });
        } catch (error) {
            console.error('Error initializing hand tracking:', error);
            this.updateStatus('Error - Check camera permissions');
        }
    }

    processHands(results) {
        this.handPositions = [];
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            results.multiHandLandmarks.forEach((landmarks) => {
                // Use wrist position (landmark 0) as primary hand position
                const wrist = landmarks[0];
                const x = wrist.x * window.innerWidth;
                const y = wrist.y * window.innerHeight;
                
                this.handPositions.push({ x, y });
            });
        }

        // Smooth positions to prevent jitter
        this.smoothPositions();
        
        if (this.onHandsDetected) {
            this.onHandsDetected(this.smoothedPositions);
        }
    }

    smoothPositions() {
        if (this.smoothedPositions.length !== this.handPositions.length) {
            this.smoothedPositions = this.handPositions.map(pos => ({ ...pos }));
            return;
        }

        // Exponential smoothing
        const smoothingFactor = 0.3;
        this.smoothedPositions = this.smoothedPositions.map((smoothed, i) => {
            if (i < this.handPositions.length) {
                return {
                    x: smoothed.x * (1 - smoothingFactor) + this.handPositions[i].x * smoothingFactor,
                    y: smoothed.y * (1 - smoothingFactor) + this.handPositions[i].y * smoothingFactor
                };
            }
            return smoothed;
        });
    }

    updateStatus(status) {
        const statusElement = document.getElementById('handStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    getHandPositions() {
        return this.smoothedPositions;
    }
}

// Audio Analyzer Class
class AudioAnalyzer {
    constructor(audioElement) {
        this.audio = audioElement;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 2048;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);

            this.source = this.audioContext.createMediaElementSource(this.audio);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing audio analyzer:', error);
            return false;
        }
    }

    getFrequencyData() {
        if (!this.isInitialized) return null;
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }

    getTimeDomainData() {
        if (!this.isInitialized) return null;
        const timeData = new Uint8Array(this.bufferLength);
        this.analyser.getByteTimeDomainData(timeData);
        return timeData;
    }

    getAverageVolume() {
        const data = this.getFrequencyData();
        if (!data) return 0;
        
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum / data.length;
    }
}

// BPM Detector Class
class BPMDetector {
    constructor(audioAnalyzer) {
        this.analyzer = audioAnalyzer;
        this.bpm = 0;
        this.beatHistory = [];
        this.lastBeatTime = 0;
        this.beatThreshold = 0.3;
        this.minBeatInterval = 0.3; // Minimum time between beats (for 200 BPM max)
        this.samples = [];
        this.sampleRate = 44100;
        this.autocorrelationWindow = 2048;
    }

    update() {
        const timeData = this.analyzer.getTimeDomainData();
        if (!timeData) return;

        // Calculate energy
        let energy = 0;
        for (let i = 0; i < timeData.length; i++) {
            const normalized = (timeData[i] - 128) / 128;
            energy += normalized * normalized;
        }
        energy /= timeData.length;

        // Simple beat detection
        const currentTime = Date.now() / 1000;
        if (energy > this.beatThreshold && (currentTime - this.lastBeatTime) > this.minBeatInterval) {
            this.beatHistory.push(currentTime);
            this.lastBeatTime = currentTime;
            
            // Keep only last 10 beats
            if (this.beatHistory.length > 10) {
                this.beatHistory.shift();
            }

            // Calculate BPM from beat intervals
            if (this.beatHistory.length >= 2) {
                const intervals = [];
                for (let i = 1; i < this.beatHistory.length; i++) {
                    intervals.push(this.beatHistory[i] - this.beatHistory[i - 1]);
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
                this.bpm = Math.round(60 / avgInterval);
                
                // Clamp BPM to reasonable range
                if (this.bpm < 60) this.bpm = 60;
                if (this.bpm > 200) this.bpm = 200;
            }
        }

        return {
            bpm: this.bpm,
            energy: energy,
            isBeat: energy > this.beatThreshold && (currentTime - this.lastBeatTime) < 0.1
        };
    }

    getBPM() {
        return this.bpm;
    }
}

// Background Animator Class
class BackgroundAnimator {
    constructor() {
        this.layers = [
            document.querySelector('.layer-1'),
            document.querySelector('.layer-2'),
            document.querySelector('.layer-3')
        ];
        this.currentBPM = 0;
        this.handPositions = [];
        this.baseOpacity = [1, 0.5, 0.3];
    }

    update(bpm, handPositions, isBeat) {
        this.currentBPM = bpm;
        this.handPositions = handPositions || [];

        // Map BPM to color palette
        const colors = this.getBPMColors(bpm);
        
        // Calculate hand influence
        const handInfluence = this.calculateHandInfluence();

        // Update each layer
        this.layers.forEach((layer, index) => {
            if (!layer) return;

            // Base color from BPM
            const baseColor = colors[index % colors.length];
            
            // Hand-influenced gradient center
            const centerX = handInfluence.x || 50;
            const centerY = handInfluence.y || 50;
            
            // Opacity pulsing on beat
            let opacity = this.baseOpacity[index];
            if (isBeat) {
                opacity = Math.min(1, opacity * 1.5);
            }
            
            // Additional opacity near hands
            if (this.handPositions.length > 0) {
                opacity = Math.min(1, opacity + 0.2);
            }

            // Create gradient
            const angle = (bpm / 200) * 360 + (handInfluence.rotation || 0);
            layer.style.background = `linear-gradient(${angle}deg, ${baseColor.start} 0%, ${baseColor.end} 100%)`;
            layer.style.opacity = opacity;
            
            // Update CSS custom properties for hand position
            layer.style.setProperty('--hand-x', `${centerX}%`);
            layer.style.setProperty('--hand-y', `${centerY}%`);
        });
    }

    getBPMColors(bpm) {
        if (bpm < 80) {
            // Slow: Cool blues
            return [
                { start: '#667eea', end: '#764ba2' },
                { start: '#4facfe', end: '#00f2fe' },
                { start: '#89f7fe', end: '#66a6ff' }
            ];
        } else if (bpm < 120) {
            // Medium: Warm oranges
            return [
                { start: '#f093fb', end: '#f5576c' },
                { start: '#fa709a', end: '#fee140' },
                { start: '#ff9a9e', end: '#fecfef' }
            ];
        } else if (bpm < 160) {
            // Fast: Vibrant reds
            return [
                { start: '#ff6b6b', end: '#ee5a6f' },
                { start: '#ff8a80', end: '#ff5252' },
                { start: '#ff1744', end: '#d50000' }
            ];
        } else {
            // Very fast: Purple/pink
            return [
                { start: '#a855f7', end: '#ec4899' },
                { start: '#f472b6', end: '#db2777' },
                { start: '#e879f9', end: '#c026d3' }
            ];
        }
    }

    calculateHandInfluence() {
        if (this.handPositions.length === 0) {
            return { x: 50, y: 50, rotation: 0 };
        }

        // Average hand positions
        let avgX = 0, avgY = 0;
        this.handPositions.forEach(pos => {
            avgX += pos.x;
            avgY += pos.y;
        });
        avgX /= this.handPositions.length;
        avgY /= this.handPositions.length;

        // Convert to percentage
        const xPercent = (avgX / window.innerWidth) * 100;
        const yPercent = (avgY / window.innerHeight) * 100;

        // Calculate rotation based on hand movement
        let rotation = 0;
        if (this.handPositions.length >= 2) {
            const dx = this.handPositions[1].x - this.handPositions[0].x;
            const dy = this.handPositions[1].y - this.handPositions[0].y;
            rotation = Math.atan2(dy, dx) * (180 / Math.PI);
        }

        return {
            x: Math.max(0, Math.min(100, xPercent)),
            y: Math.max(0, Math.min(100, yPercent)),
            rotation: rotation
        };
    }
}

// Particle System Class
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.bpm = 0;
        this.handPositions = [];
        this.isBeat = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(bpm, handPositions, isBeat) {
        this.bpm = bpm;
        this.handPositions = handPositions || [];
        this.isBeat = isBeat;

        // Adjust particle count based on BPM
        const targetParticleCount = Math.floor(50 + (bpm / 4));
        
        // Add particles if needed
        while (this.particles.length < targetParticleCount) {
            this.particles.push(this.createParticle());
        }
        
        // Remove excess particles
        while (this.particles.length > targetParticleCount) {
            this.particles.shift();
        }

        // Update particles
        this.particles.forEach(particle => {
            this.updateParticle(particle);
        });
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 3 + 1,
            color: this.getParticleColor(),
            life: 1.0
        };
    }

    getParticleColor() {
        const colors = [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b',
            '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateParticle(particle) {
        // Base speed influenced by BPM
        const speedMultiplier = 1 + (this.bpm / 200);
        
        // Hand attraction
        if (this.handPositions.length > 0) {
            this.handPositions.forEach(handPos => {
                const dx = handPos.x - particle.x;
                const dy = handPos.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) {
                    const force = (200 - distance) / 200;
                    particle.vx += (dx / distance) * force * 0.1;
                    particle.vy += (dy / distance) * force * 0.1;
                }
            });
        }

        // Beat pulse
        if (this.isBeat) {
            particle.size *= 1.2;
            particle.life = Math.min(1, particle.life + 0.1);
        }

        // Update position
        particle.x += particle.vx * speedMultiplier;
        particle.y += particle.vy * speedMultiplier;

        // Boundary wrapping
        if (particle.x < 0) particle.x = this.canvas.width;
        if (particle.x > this.canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = this.canvas.height;
        if (particle.y > this.canvas.height) particle.y = 0;

        // Damping
        particle.vx *= 0.98;
        particle.vy *= 0.98;
        particle.size *= 0.99;
        particle.life *= 0.995;

        // Reset if too small
        if (particle.size < 0.5) {
            particle.size = Math.random() * 3 + 1;
            particle.life = 1.0;
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
}

// Audio Visualizer Class
class AudioVisualizer {
    constructor(canvas, audioAnalyzer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.analyzer = audioAnalyzer;
        this.handPositions = [];
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    update(handPositions) {
        this.handPositions = handPositions || [];
    }

    render() {
        const frequencyData = this.analyzer.getFrequencyData();
        const timeData = this.analyzer.getTimeDomainData();
        
        if (!frequencyData || !timeData) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw frequency bars
        this.drawFrequencyBars(frequencyData);
        
        // Draw waveform
        this.drawWaveform(timeData);
    }

    drawFrequencyBars(frequencyData) {
        const barCount = 64;
        const barWidth = this.canvas.width / barCount;
        const centerY = this.canvas.height / 2;
        
        // Hand influence on visualization
        const handY = this.handPositions.length > 0 
            ? this.handPositions[0].y / this.canvas.height 
            : 0.5;

        for (let i = 0; i < barCount; i++) {
            const dataIndex = Math.floor((i / barCount) * frequencyData.length);
            const barHeight = (frequencyData[dataIndex] / 255) * (this.canvas.height * 0.4);
            
            // Color based on frequency and hand position
            const hue = (i / barCount) * 360 + (handY * 60);
            this.ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
            
            // Draw bar
            const x = i * barWidth;
            this.ctx.fillRect(x, centerY - barHeight / 2, barWidth - 2, barHeight);
            this.ctx.fillRect(x, centerY + barHeight / 2, barWidth - 2, -barHeight);
        }
    }

    drawWaveform(timeData) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        const sliceWidth = this.canvas.width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * this.canvas.height) / 2;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }

            x += sliceWidth;
        }

        this.ctx.stroke();
    }
}

// Main Application
class MusicPlayerApp {
    constructor() {
        this.audioElement = document.getElementById('audioElement');
        this.audioFileInput = document.getElementById('audioFile');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.bpmDisplay = document.getElementById('bpmValue');
        this.webcam = document.getElementById('webcam');
        
        this.particleCanvas = document.getElementById('particleCanvas');
        this.visualizerCanvas = document.getElementById('visualizerCanvas');

        this.audioAnalyzer = null;
        this.bpmDetector = null;
        this.handTracker = null;
        this.backgroundAnimator = null;
        this.particleSystem = null;
        this.visualizer = null;

        this.animationId = null;
        this.isPlaying = false;

        this.init();
    }

    async init() {
        // Initialize audio analyzer
        this.audioAnalyzer = new AudioAnalyzer(this.audioElement);
        await this.audioAnalyzer.initialize();

        // Initialize BPM detector
        this.bpmDetector = new BPMDetector(this.audioAnalyzer);

        // Initialize background animator
        this.backgroundAnimator = new BackgroundAnimator();

        // Initialize particle system
        this.particleSystem = new ParticleSystem(this.particleCanvas);

        // Initialize visualizer
        this.visualizer = new AudioVisualizer(this.visualizerCanvas, this.audioAnalyzer);

        // Initialize hand tracker
        this.handTracker = new HandTracker(this.webcam, (handPositions) => {
            // Hand positions updated
        });

        // Setup event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();
    }

    setupEventListeners() {
        // File input
        this.audioFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const url = URL.createObjectURL(file);
                this.audioElement.src = url;
            }
        });

        // Play/Pause
        this.playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.audioElement.pause();
                this.playPauseBtn.textContent = 'Play';
                this.isPlaying = false;
            } else {
                this.audioElement.play();
                this.playPauseBtn.textContent = 'Pause';
                this.isPlaying = true;
            }
        });

        // Volume
        this.volumeSlider.addEventListener('input', (e) => {
            this.audioElement.volume = e.target.value;
        });

        // Audio events
        this.audioElement.addEventListener('ended', () => {
            this.playPauseBtn.textContent = 'Play';
            this.isPlaying = false;
        });
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (!this.isPlaying) return;

        // Update BPM detection
        const bpmData = this.bpmDetector.update();
        const bpm = bpmData.bpm || 0;
        const isBeat = bpmData.isBeat || false;

        // Update BPM display
        this.bpmDisplay.textContent = bpm || '--';

        // Get hand positions
        const handPositions = this.handTracker ? this.handTracker.getHandPositions() : [];

        // Update background
        this.backgroundAnimator.update(bpm, handPositions, isBeat);

        // Update particle system
        this.particleSystem.update(bpm, handPositions, isBeat);
        this.particleSystem.render();

        // Update visualizer
        this.visualizer.update(handPositions);
        this.visualizer.render();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayerApp();
});

