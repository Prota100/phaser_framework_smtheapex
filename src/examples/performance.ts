/**
 * Performance Monitor Demo - TypeScript Edition
 * Real-time performance monitoring and optimization showcase
 */

import * as Phaser from 'phaser';

interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    memoryUsed: number;
    memoryTotal: number;
    objectCount: number;
    renderCalls: number;
    deviceTier: 'low' | 'medium' | 'high';
}

interface DeviceInfo {
    userAgent: string;
    platform: string;
    cores: number;
    memory: number;
    gpu: string;
    webgl: boolean;
    webgl2: boolean;
}

class PerformanceScene extends Phaser.Scene {
    private metricsText!: Phaser.GameObjects.Text;
    private deviceText!: Phaser.GameObjects.Text;
    private chart!: Phaser.GameObjects.Graphics;
    
    private performanceMetrics: PerformanceMetrics = {
        fps: 0,
        frameTime: 0,
        memoryUsed: 0,
        memoryTotal: 0,
        objectCount: 0,
        renderCalls: 0,
        deviceTier: 'medium'
    };

    private deviceInfo: DeviceInfo;
    private fpsHistory: number[] = [];
    private frameTimeHistory: number[] = [];
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;

    private sprites: Phaser.GameObjects.Sprite[] = [];
    private particles: Phaser.GameObjects.Particles.ParticleEmitter[] = [];

    constructor() {
        super({ key: 'PerformanceScene' });
        this.deviceInfo = this.detectDeviceInfo();
    }

    create(): void {
        // Title
        this.add.text(20, 20, '📊 Performance Monitor 2025', {
            fontSize: '24px',
            color: '#ffffff'
        });

        // Create UI elements
        this.createUI();
        this.createChart();
        this.createTestControls();

        // Start performance monitoring
        this.startPerformanceMonitoring();

        // Detect device tier
        this.performanceMetrics.deviceTier = this.detectDeviceTier();

        console.log('✅ Performance Monitor initialized!');
        console.log('Device Info:', this.deviceInfo);
    }

    private createUI(): void {
        this.metricsText = this.add.text(20, 60, '', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'monospace'
        });

        this.deviceText = this.add.text(400, 60, '', {
            fontSize: '12px',
            color: '#cccccc',
            fontFamily: 'monospace'
        });

        this.updateDeviceInfo();
    }

    private createChart(): void {
        this.chart = this.add.graphics();
    }

    private createTestControls(): void {
        const controlsY = 300;
        
        // Test buttons
        const tests = [
            { name: 'Spawn 100 Sprites', action: () => this.spawnSprites(100), color: 0x3498db },
            { name: 'Spawn 500 Sprites', action: () => this.spawnSprites(500), color: 0xe74c3c },
            { name: 'Add Particle Effects', action: () => this.addParticleEffects(), color: 0x2ecc71 },
            { name: 'Stress Test (1000)', action: () => this.stressTest(), color: 0xf39c12 },
            { name: 'Clear All Objects', action: () => this.clearAllObjects(), color: 0x95a5a6 },
            { name: 'Memory GC Test', action: () => this.memoryGCTest(), color: 0x9b59b6 }
        ];

        tests.forEach((test, index) => {
            const x = 20 + (index % 3) * 130;
            const y = controlsY + Math.floor(index / 3) * 50;

            const button = this.add.rectangle(x + 60, y, 120, 40, test.color);
            const text = this.add.text(x + 60, y, test.name, {
                fontSize: '10px',
                color: '#ffffff'
            }).setOrigin(0.5);

            button.setInteractive();
            button.on('pointerdown', () => {
                test.action();
                
                // Visual feedback
                this.tweens.add({
                    targets: button,
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 100,
                    yoyo: true
                });
            });
        });

        // Instructions
        this.add.text(20, controlsY - 40, 'Performance Tests:', {
            fontSize: '16px',
            color: '#ffffff'
        });
    }

    private startPerformanceMonitoring(): void {
        // Monitor every 100ms
        this.time.addEvent({
            delay: 100,
            callback: this.updatePerformanceMetrics,
            callbackScope: this,
            loop: true
        });

        // Update UI every 200ms
        this.time.addEvent({
            delay: 200,
            callback: this.updateUI,
            callbackScope: this,
            loop: true
        });
    }

    private updatePerformanceMetrics(): void {
        const now = performance.now();
        this.frameCount++;

        // Calculate FPS
        if (now - this.lastFpsUpdate > 1000) {
            this.performanceMetrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;

            // Store FPS history
            this.fpsHistory.push(this.performanceMetrics.fps);
            if (this.fpsHistory.length > 60) {
                this.fpsHistory.shift();
            }
        }

        // Calculate frame time
        if (this.lastFrameTime > 0) {
            this.performanceMetrics.frameTime = now - this.lastFrameTime;
            this.frameTimeHistory.push(this.performanceMetrics.frameTime);
            if (this.frameTimeHistory.length > 60) {
                this.frameTimeHistory.shift();
            }
        }
        this.lastFrameTime = now;

        // Memory usage (if available)
        if ((performance as any).memory) {
            const memory = (performance as any).memory;
            this.performanceMetrics.memoryUsed = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            this.performanceMetrics.memoryTotal = Math.round(memory.totalJSHeapSize / 1024 / 1024);
        }

        // Count active objects
        this.performanceMetrics.objectCount = this.sprites.length + this.particles.length + 10; // Base UI objects

        // Estimate render calls (approximation)
        this.performanceMetrics.renderCalls = this.performanceMetrics.objectCount + 
            (this.particles.length * 10); // Particles typically have more draw calls
    }

    private updateUI(): void {
        // Performance metrics
        const avgFps = this.fpsHistory.length > 0 ? 
            Math.round(this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length) : 0;
        const avgFrameTime = this.frameTimeHistory.length > 0 ?
            (this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length).toFixed(2) : '0';

        this.metricsText.setText(
            `Performance Metrics:\n` +
            `FPS: ${this.performanceMetrics.fps} (avg: ${avgFps})\n` +
            `Frame Time: ${this.performanceMetrics.frameTime.toFixed(2)}ms (avg: ${avgFrameTime}ms)\n` +
            `Memory Used: ${this.performanceMetrics.memoryUsed}MB / ${this.performanceMetrics.memoryTotal}MB\n` +
            `Active Objects: ${this.performanceMetrics.objectCount}\n` +
            `Render Calls: ${this.performanceMetrics.renderCalls}\n` +
            `Device Tier: ${this.performanceMetrics.deviceTier.toUpperCase()}\n` +
            `\n` +
            `Quality Metrics:\n` +
            `Performance: ${this.getPerformanceRating()}\n` +
            `Memory Health: ${this.getMemoryRating()}\n` +
            `Optimization: ${this.getOptimizationSuggestion()}`
        );

        // Update chart
        this.updateChart();
    }

    private updateDeviceInfo(): void {
        this.deviceText.setText(
            `Device Information:\n` +
            `Platform: ${this.deviceInfo.platform}\n` +
            `CPU Cores: ${this.deviceInfo.cores}\n` +
            `Memory: ${this.deviceInfo.memory}GB\n` +
            `GPU: ${this.deviceInfo.gpu}\n` +
            `WebGL: ${this.deviceInfo.webgl ? 'Yes' : 'No'}\n` +
            `WebGL2: ${this.deviceInfo.webgl2 ? 'Yes' : 'No'}\n` +
            `\n` +
            `Browser Capabilities:\n` +
            `Canvas Size: ${this.game.canvas.width}×${this.game.canvas.height}\n` +
            `Pixel Ratio: ${window.devicePixelRatio}\n` +
            `Hardware Accel: ${this.isHardwareAccelerated()}\n` +
            `Touch Support: ${'ontouchstart' in window ? 'Yes' : 'No'}`
        );
    }

    private updateChart(): void {
        this.chart.clear();

        if (this.fpsHistory.length < 2) return;

        // Draw FPS chart
        const chartX = 20;
        const chartY = 500;
        const chartWidth = 300;
        const chartHeight = 80;

        // Background
        this.chart.fillStyle(0x000000, 0.3);
        this.chart.fillRect(chartX, chartY, chartWidth, chartHeight);

        // Border
        this.chart.lineStyle(1, 0xffffff, 0.5);
        this.chart.strokeRect(chartX, chartY, chartWidth, chartHeight);

        // FPS line
        this.chart.lineStyle(2, 0x00ff00, 0.8);
        
        const maxFps = 60;
        const stepX = chartWidth / (this.fpsHistory.length - 1);

        for (let i = 0; i < this.fpsHistory.length - 1; i++) {
            const x1 = chartX + i * stepX;
            const y1 = chartY + chartHeight - (this.fpsHistory[i] / maxFps) * chartHeight;
            const x2 = chartX + (i + 1) * stepX;
            const y2 = chartY + chartHeight - (this.fpsHistory[i + 1] / maxFps) * chartHeight;

            this.chart.lineBetween(x1, y1, x2, y2);
        }

        // Chart labels
        this.add.text(chartX, chartY - 20, 'FPS History (Real-time)', {
            fontSize: '12px',
            color: '#ffffff'
        }).setDepth(1000);
    }

    private detectDeviceInfo(): DeviceInfo {
        const ua = navigator.userAgent;
        
        return {
            userAgent: ua,
            platform: navigator.platform,
            cores: navigator.hardwareConcurrency || 4,
            memory: (navigator as any).deviceMemory || 4,
            gpu: this.detectGPU(),
            webgl: !!window.WebGLRenderingContext,
            webgl2: !!window.WebGL2RenderingContext
        };
    }

    private detectGPU(): string {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl && 'getExtension' in gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo && 'getParameter' in gl) {
                    return (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            }
        } catch (e) {}
        return 'Unknown';
    }

    private detectDeviceTier(): 'low' | 'medium' | 'high' {
        const score = 
            (this.deviceInfo.cores >= 8 ? 3 : this.deviceInfo.cores >= 4 ? 2 : 1) +
            (this.deviceInfo.memory >= 8 ? 3 : this.deviceInfo.memory >= 4 ? 2 : 1) +
            (this.deviceInfo.webgl2 ? 2 : this.deviceInfo.webgl ? 1 : 0);

        if (score >= 7) return 'high';
        if (score >= 4) return 'medium';
        return 'low';
    }

    private isHardwareAccelerated(): string {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        if (gl) {
            const renderer = gl.getParameter(gl.RENDERER);
            return renderer.includes('ANGLE') ? 'Software' : 'Hardware';
        }
        return 'Unknown';
    }

    private getPerformanceRating(): string {
        const avgFps = this.fpsHistory.length > 0 ? 
            this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length : 60;

        if (avgFps >= 58) return 'Excellent (60 FPS)';
        if (avgFps >= 48) return 'Good (50+ FPS)';
        if (avgFps >= 28) return 'Fair (30+ FPS)';
        return 'Poor (<30 FPS)';
    }

    private getMemoryRating(): string {
        if (this.performanceMetrics.memoryUsed === 0) return 'Unknown';
        
        const usagePercent = (this.performanceMetrics.memoryUsed / this.performanceMetrics.memoryTotal) * 100;
        
        if (usagePercent < 50) return 'Excellent';
        if (usagePercent < 70) return 'Good';
        if (usagePercent < 85) return 'Fair';
        return 'Critical';
    }

    private getOptimizationSuggestion(): string {
        if (this.performanceMetrics.objectCount > 1000) return 'Reduce Object Count';
        if (this.performanceMetrics.fps < 30) return 'Enable Performance Mode';
        if (this.performanceMetrics.memoryUsed > 100) return 'Optimize Memory Usage';
        return 'Performance is Good';
    }

    // Test functions
    private spawnSprites(count: number): void {
        for (let i = 0; i < count; i++) {
            const sprite = this.add.rectangle(
                Phaser.Math.Between(50, 750),
                Phaser.Math.Between(50, 250),
                10,
                10,
                Phaser.Math.Between(0x000000, 0xffffff)
            );
            
            // Add some movement
            this.tweens.add({
                targets: sprite,
                x: Phaser.Math.Between(50, 750),
                y: Phaser.Math.Between(50, 250),
                duration: Phaser.Math.Between(2000, 5000),
                repeat: -1,
                yoyo: true
            });

            this.sprites.push(sprite as any);
        }
    }

    private addParticleEffects(): void {
        // Note: Simplified particle effect without Phaser's particle system
        // to avoid dependency issues
        for (let i = 0; i < 50; i++) {
            const particle = this.add.circle(
                Phaser.Math.Between(100, 700),
                Phaser.Math.Between(100, 250),
                2,
                0xffffff
            );

            this.tweens.add({
                targets: particle,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: 2000,
                repeat: -1,
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    private stressTest(): void {
        this.spawnSprites(1000);
        this.addParticleEffects();
        console.warn('🔥 Stress test activated - expect performance impact!');
    }

    private clearAllObjects(): void {
        this.sprites.forEach(sprite => sprite.destroy());
        this.sprites = [];
        
        // Force garbage collection if available
        if ((window as any).gc) {
            (window as any).gc();
        }
        
        console.log('🧹 All objects cleared');
    }

    private memoryGCTest(): void {
        // Create and destroy many objects to test GC
        const tempObjects = [];
        for (let i = 0; i < 10000; i++) {
            tempObjects.push({
                data: new Array(1000).fill(Math.random()),
                timestamp: Date.now()
            });
        }
        
        // Clear references
        tempObjects.length = 0;
        
        console.log('🗑️ Memory GC test completed');
    }
}

export function initializeGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#1a1a1a',
        scene: PerformanceScene,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        fps: {
            target: 60,
            forceSetTimeOut: true
        }
    };

    const game = new Phaser.Game(config);
    console.log('✅ Performance Monitor initialized with real-time metrics!');
    
    return game;
}