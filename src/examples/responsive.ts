/**
 * Responsive Demo - TypeScript Edition
 * Demonstrates 2025 responsive design patterns with Phaser 3.90
 */

import * as Phaser from 'phaser';

interface ResponsiveBreakpoint {
    name: string;
    width: number;
    description: string;
}

class ResponsiveScene extends Phaser.Scene {
    private infoText!: Phaser.GameObjects.Text;
    private breakpointText!: Phaser.GameObjects.Text;
    private interactiveElements: Phaser.GameObjects.Rectangle[] = [];
    private resizeTimer: number | null = null;

    private breakpoints: ResponsiveBreakpoint[] = [
        { name: 'mobile_xs', width: 320, description: 'Mobile XS (iPhone SE)' },
        { name: 'mobile_sm', width: 375, description: 'Mobile SM (iPhone 12)' },
        { name: 'mobile_md', width: 414, description: 'Mobile MD (iPhone 12 Pro Max)' },
        { name: 'mobile_lg', width: 480, description: 'Mobile LG' },
        { name: 'tablet_sm', width: 768, description: 'Tablet SM (iPad Mini)' },
        { name: 'tablet_md', width: 834, description: 'Tablet MD (iPad Air)' },
        { name: 'tablet_lg', width: 1024, description: 'Tablet LG (iPad Pro)' },
        { name: 'desktop_sm', width: 1280, description: 'Desktop SM' },
        { name: 'desktop_md', width: 1440, description: 'Desktop MD' },
        { name: 'desktop_lg', width: 1920, description: 'Desktop LG (1080p)' },
        { name: 'desktop_xl', width: 2560, description: 'Desktop XL (1440p)' },
        { name: 'desktop_xxl', width: 3840, description: 'Desktop XXL (4K)' }
    ];

    constructor() {
        super({ key: 'ResponsiveScene' });
    }

    create(): void {
        // Title
        this.add.text(20, 20, '📱 Responsive Design Demo 2025', {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });

        // Info text
        this.infoText = this.add.text(20, 80, '', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'monospace',
            wordWrap: { width: 750 }
        });

        // Breakpoint text
        this.breakpointText = this.add.text(20, 200, '', {
            fontSize: '18px',
            color: '#ffff00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });

        // Create interactive elements that respond to screen size
        this.createInteractiveElements();

        // Instructions
        this.add.text(20, 250, 'Instructions:', { 
            fontSize: '18px', 
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        this.add.text(20, 280, '• Resize your browser window to see responsive behavior', { 
            fontSize: '14px', 
            color: '#ffffff' 
        });
        this.add.text(20, 300, '• Try different device orientations', { 
            fontSize: '14px', 
            color: '#ffffff' 
        });
        this.add.text(20, 320, '• Click the colored squares to change colors', { 
            fontSize: '14px', 
            color: '#ffffff' 
        });
        this.add.text(20, 340, '• Watch breakpoint detection in action', { 
            fontSize: '14px', 
            color: '#ffffff' 
        });

        // Update initial info
        this.updateResponsiveInfo();

        // Listen for resize events
        this.scale.on('resize', this.onResize, this);

        console.log('✅ Responsive Demo initialized with TypeScript!');
    }

    private createInteractiveElements(): void {
        // Clear existing elements
        this.interactiveElements.forEach(element => element.destroy());
        this.interactiveElements = [];

        const canvasWidth = this.scale.width;
        const canvasHeight = this.scale.height;

        // Calculate responsive layout
        const elementsPerRow = Math.max(2, Math.min(6, Math.floor(canvasWidth / 120)));
        const elementSize = Math.max(40, Math.min(80, (canvasWidth - 40) / elementsPerRow - 20));
        const startY = Math.max(380, canvasHeight - 200);

        for (let i = 0; i < elementsPerRow * 2; i++) {
            const row = Math.floor(i / elementsPerRow);
            const col = i % elementsPerRow;
            
            const x = 30 + col * (elementSize + 20);
            const y = startY + row * (elementSize + 20);

            const rect = this.add.rectangle(x, y, elementSize, elementSize, 0xe74c3c);
            rect.setInteractive();
            rect.on('pointerdown', () => {
                rect.setFillStyle(Math.random() * 0xffffff);
                
                // Add scale animation
                this.tweens.add({
                    targets: rect,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 100,
                    yoyo: true,
                    ease: 'Power2'
                });
            });

            this.interactiveElements.push(rect);
        }
    }

    private onResize(): void {
        // Debounce resize events
        if (this.resizeTimer) {
            clearTimeout(this.resizeTimer);
        }

        this.resizeTimer = window.setTimeout(() => {
            this.updateResponsiveInfo();
            this.createInteractiveElements();
            this.resizeTimer = null;
        }, 100);
    }

    private updateResponsiveInfo(): void {
        const canvas = this.game.canvas;
        const currentBreakpoint = this.getCurrentBreakpoint();
        
        // Device information
        const deviceInfo = {
            canvas: `${canvas.width}×${canvas.height}`,
            window: `${window.innerWidth}×${window.innerHeight}`,
            screen: `${screen.width}×${screen.height}`,
            devicePixelRatio: window.devicePixelRatio,
            orientation: window.innerHeight > window.innerWidth ? 'Portrait' : 'Landscape',
            touch: 'ontouchstart' in window ? 'Yes' : 'No',
            userAgent: this.getMobileInfo()
        };

        // Safe area information (for modern mobile devices)
        const safeAreaInfo = this.getSafeAreaInfo();

        this.infoText.setText(
            `Canvas: ${deviceInfo.canvas} | Window: ${deviceInfo.window} | Screen: ${deviceInfo.screen}\n` +
            `DPR: ${deviceInfo.devicePixelRatio}x | Orientation: ${deviceInfo.orientation} | Touch: ${deviceInfo.touch}\n` +
            `Device: ${deviceInfo.userAgent}\n` +
            `Safe Area: ${safeAreaInfo}`
        );

        this.breakpointText.setText(
            `Current Breakpoint: ${currentBreakpoint.name.toUpperCase()}\n` +
            `${currentBreakpoint.description} (≥${currentBreakpoint.width}px)`
        );
    }

    private getCurrentBreakpoint(): ResponsiveBreakpoint {
        const width = window.innerWidth;
        
        // Find the largest breakpoint that fits
        let currentBreakpoint = this.breakpoints[0];
        
        for (const breakpoint of this.breakpoints) {
            if (width >= breakpoint.width) {
                currentBreakpoint = breakpoint;
            } else {
                break;
            }
        }
        
        return currentBreakpoint;
    }

    private getMobileInfo(): string {
        const ua = navigator.userAgent;
        
        if (/iPhone/i.test(ua)) return 'iPhone';
        if (/iPad/i.test(ua)) return 'iPad';
        if (/Android/i.test(ua)) return 'Android';
        if (/Windows Phone/i.test(ua)) return 'Windows Phone';
        if (/Mac/i.test(ua)) return 'Mac';
        if (/Windows/i.test(ua)) return 'Windows';
        if (/Linux/i.test(ua)) return 'Linux';
        
        return 'Unknown';
    }

    private getSafeAreaInfo(): string {
        // Modern CSS env() function support detection
        const testDiv = document.createElement('div');
        testDiv.style.paddingTop = 'env(safe-area-inset-top)';
        document.body.appendChild(testDiv);
        
        const computedStyle = window.getComputedStyle(testDiv);
        const hasSafeArea = computedStyle.paddingTop !== '0px';
        
        document.body.removeChild(testDiv);
        
        return hasSafeArea ? 'Supported (iOS/Android notch)' : 'Not detected';
    }
}

export function initializeGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#3498db',
        scene: ResponsiveScene,
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: '100%',
            height: '100%'
        }
    };

    const game = new Phaser.Game(config);
    console.log('✅ Responsive Demo initialized with 2025 breakpoints!');
    
    return game;
}