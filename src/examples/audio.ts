/**
 * Audio Demo - TypeScript Edition  
 * Demonstrates spatial audio and Web Audio API with Phaser 3.90
 */

import * as Phaser from 'phaser';

class AudioScene extends Phaser.Scene {
    private audioButtons: Phaser.GameObjects.Container[] = [];
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private isAudioEnabled: boolean = false;

    constructor() {
        super({ key: 'AudioScene' });
    }

    create(): void {
        // Title
        this.add.text(20, 20, '🎵 Audio Demo - Web Audio API', {
            fontSize: '28px',
            color: '#ffffff'
        });

        // Initialize Web Audio API
        this.initializeWebAudio();

        // Create audio control buttons
        this.createAudioButtons();

        // Instructions
        this.add.text(20, 400, 'Click buttons to test different audio features:', {
            fontSize: '16px',
            color: '#ffffff'
        });

        this.add.text(20, 430, '• Spatial Audio: Move sounds in 3D space', {
            fontSize: '14px',
            color: '#ffffff'
        });

        this.add.text(20, 450, '• Dynamic Frequency: Real-time frequency modulation', {
            fontSize: '14px',
            color: '#ffffff'
        });

        this.add.text(20, 470, '• Audio Synthesis: Generate tones and effects', {
            fontSize: '14px',
            color: '#ffffff'
        });

        console.log('✅ Audio Demo initialized with Web Audio API!');
    }

    private initializeWebAudio(): void {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            this.isAudioEnabled = true;
            
            console.log('🔊 Web Audio API initialized');
        } catch (error) {
            console.warn('Audio not supported:', error);
            this.isAudioEnabled = false;
        }
    }

    private createAudioButtons(): void {
        const buttonConfigs = [
            { x: 100, y: 120, text: 'Beep 440Hz', color: 0x2ecc71, action: () => this.playTone(440) },
            { x: 250, y: 120, text: 'Beep 523Hz', color: 0x3498db, action: () => this.playTone(523) },
            { x: 400, y: 120, text: 'Beep 220Hz', color: 0xe74c3c, action: () => this.playTone(220) },
            
            { x: 100, y: 200, text: 'Sweep Up', color: 0xf39c12, action: () => this.playSweep(200, 800) },
            { x: 250, y: 200, text: 'Sweep Down', color: 0x9b59b6, action: () => this.playSweep(800, 200) },
            { x: 400, y: 200, text: 'Noise', color: 0x95a5a6, action: () => this.playNoise() },

            { x: 100, y: 280, text: 'Spatial Left', color: 0x1abc9c, action: () => this.playSpatialSound(-1) },
            { x: 250, y: 280, text: 'Spatial Center', color: 0x16a085, action: () => this.playSpatialSound(0) },
            { x: 400, y: 280, text: 'Spatial Right', color: 0x27ae60, action: () => this.playSpatialSound(1) },

            { x: 175, y: 360, text: 'Chord C Major', color: 0xd35400, action: () => this.playChord([261.63, 329.63, 392.00]) },
            { x: 325, y: 360, text: 'Chord A Minor', color: 0xe67e22, action: () => this.playChord([220, 261.63, 329.63]) }
        ];

        buttonConfigs.forEach(config => {
            const container = this.add.container(config.x, config.y);

            const rect = this.add.rectangle(0, 0, 120, 50, config.color);
            const text = this.add.text(0, 0, config.text, {
                fontSize: '12px',
                color: '#ffffff'
            }).setOrigin(0.5);

            container.add([rect, text]);
            container.setInteractive(new Phaser.Geom.Rectangle(-60, -25, 120, 50), Phaser.Geom.Rectangle.Contains);

            container.on('pointerdown', () => {
                if (!this.isAudioEnabled) {
                    alert('Audio not supported in this browser');
                    return;
                }

                // Resume audio context if suspended
                if (this.audioContext!.state === 'suspended') {
                    this.audioContext!.resume();
                }

                // Visual feedback
                this.tweens.add({
                    targets: rect,
                    scaleX: 0.9,
                    scaleY: 0.9,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2'
                });

                // Execute audio action
                config.action();
            });

            this.audioButtons.push(container);
        });
    }

    private playTone(frequency: number, duration: number = 0.3): void {
        if (!this.audioContext || !this.masterGain) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    private playSweep(startFreq: number, endFreq: number, duration: number = 1.0): void {
        if (!this.audioContext || !this.masterGain) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        oscillator.type = 'sawtooth';

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    private playNoise(duration: number = 0.5): void {
        if (!this.audioContext || !this.masterGain) return;

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(this.masterGain);

        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        source.start(this.audioContext.currentTime);
    }

    private playSpatialSound(pan: number, frequency: number = 440, duration: number = 0.5): void {
        if (!this.audioContext || !this.masterGain) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const panNode = this.audioContext.createStereoPanner();

        oscillator.connect(gainNode);
        gainNode.connect(panNode);
        panNode.connect(this.masterGain);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sine';

        panNode.pan.setValueAtTime(pan, this.audioContext.currentTime);

        gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    private playChord(frequencies: number[], duration: number = 1.0): void {
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, duration);
            }, index * 50); // Slight stagger for chord effect
        });
    }
}

export function initializeGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#9b59b6',
        scene: AudioScene,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    const game = new Phaser.Game(config);
    console.log('✅ Audio Demo initialized with spatial audio!');
    
    return game;
}