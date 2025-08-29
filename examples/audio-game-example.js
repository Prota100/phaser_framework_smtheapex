// Audio System Demo
export function initializeGame() {
    console.log('🎵 Initializing Audio Game Example...');
    
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#9b59b6',
        scene: {
            preload: preload,
            create: create
        }
    };
    
    const game = new Phaser.Game(config);
    let audioContext;
    let oscillator;
    let gainNode;
    
    function preload() {
        // Create audio button graphics
        this.add.graphics()
            .fillStyle(0x2ecc71)
            .fillRoundedRect(0, 0, 120, 50, 10)
            .generateTexture('audio-button', 120, 50);
    }
    
    function create() {
        // Title
        this.add.text(20, 20, '🎵 Audio & Effects Demo', {
            fontSize: '28px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        
        // Initialize Web Audio API
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            gainNode = audioContext.createGain();
            gainNode.connect(audioContext.destination);
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
        
        // Create audio control buttons
        const buttons = [
            { x: 50, y: 120, text: 'Play Beep', freq: 440 },
            { x: 200, y: 120, text: 'Play Chord', freq: 523 },
            { x: 350, y: 120, text: 'Play Bass', freq: 220 },
            { x: 500, y: 120, text: 'Stop All', freq: null }
        ];
        
        buttons.forEach(btn => {
            const button = this.add.sprite(btn.x, btn.y, 'audio-button');
            const text = this.add.text(btn.x, btn.y, btn.text, {
                fontSize: '12px',
                fill: '#000000'
            }).setOrigin(0.5);
            
            button.setInteractive();
            button.on('pointerdown', () => {
                if (btn.freq) {
                    playTone(btn.freq, 0.5, 200);
                } else {
                    stopAll();
                }
                button.setTint(0xcccccc);
                setTimeout(() => button.clearTint(), 100);
            });
        });
        
        // Audio visualization
        const visualizer = this.add.graphics();
        
        // Audio info
        this.add.text(20, 220, 'Audio System Features:', { fontSize: '18px', fill: '#ffffff', fontWeight: 'bold' });
        this.add.text(20, 250, '• Web Audio API integration', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 270, '• Spatial audio support (simulated)', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 290, '• Dynamic volume control', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 310, '• Mobile audio optimization', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 330, '• Reactive audio management', { fontSize: '14px', fill: '#ffffff' });
        
        // Volume control
        this.add.text(20, 380, 'Volume Control (Click to adjust):', { fontSize: '16px', fill: '#ffffff' });
        
        const volumeLevels = [0.1, 0.3, 0.5, 0.7, 1.0];
        volumeLevels.forEach((level, index) => {
            const volButton = this.add.rectangle(60 + index * 40, 420, 30, 20, 0x34495e);
            const volText = this.add.text(60 + index * 40, 420, Math.round(level * 100) + '%', {
                fontSize: '10px',
                fill: '#ffffff'
            }).setOrigin(0.5);
            
            volButton.setInteractive();
            volButton.on('pointerdown', () => {
                if (gainNode) {
                    gainNode.gain.value = level;
                    // Visual feedback
                    this.children.list.forEach(child => {
                        if (child.type === 'Rectangle' && child.y === 420) {
                            child.fillColor = 0x34495e;
                        }
                    });
                    volButton.fillColor = 0x3498db;
                }
            });
        });
        
        // Performance info
        this.add.text(20, 480, 'Audio Performance:', { fontSize: '16px', fill: '#ffffff' });
        this.add.text(20, 500, `Sample Rate: ${audioContext?.sampleRate || 'N/A'} Hz`, { fontSize: '12px', fill: '#ffffff' });
        this.add.text(20, 520, `Audio Context State: ${audioContext?.state || 'N/A'}`, { fontSize: '12px', fill: '#ffffff' });
    }
    
    function playTone(frequency, volume = 0.5, duration = 200) {
        if (!audioContext) return;
        
        try {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(gainNode);
            
            osc.frequency.setValueAtTime(frequency, audioContext.currentTime);
            gain.gain.setValueAtTime(0, audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);
            
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            console.warn('Audio playback error:', error);
        }
    }
    
    function stopAll() {
        if (oscillator) {
            try {
                oscillator.stop();
            } catch (e) {}
            oscillator = null;
        }
    }
    
    console.log('✅ Audio game initialized successfully!');
    return game;
}