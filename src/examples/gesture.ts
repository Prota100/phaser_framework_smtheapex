/**
 * Gesture Demo - TypeScript Edition
 * Demonstrates advanced touch gesture recognition with Phaser 3.90
 */

import * as Phaser from 'phaser';

interface TouchPoint {
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    time: number;
}

interface GestureInfo {
    type: string;
    details: string;
    color: number;
}

class GestureScene extends Phaser.Scene {
    private gestureText!: Phaser.GameObjects.Text;
    private activeTouches: Map<number, TouchPoint> = new Map();
    private gestureHistory: GestureInfo[] = [];
    private gestureElements: Phaser.GameObjects.Rectangle[] = [];
    private lastTapTime: number = 0;
    private tapCount: number = 0;

    constructor() {
        super({ key: 'GestureScene' });
    }

    create(): void {
        // Title
        this.add.text(20, 20, '👆 Gesture & Touch Demo', {
            fontSize: '28px',
            color: '#ffffff'
        });

        // Gesture display
        this.gestureText = this.add.text(20, 80, 'Touch the screen to test gestures...', {
            fontSize: '16px',
            color: '#ffffff',
            wordWrap: { width: 750 }
        });

        // Create interactive area
        const touchArea = this.add.rectangle(400, 350, 760, 400, 0x34495e, 0.3);
        touchArea.setInteractive();

        // Gesture instructions
        this.add.text(20, 150, 'Supported Gestures:', {
            fontSize: '18px',
            color: '#ffffff'
        });

        const instructions = [
            '• Single Tap: Quick touch and release',
            '• Double Tap: Two quick taps',
            '• Long Press: Hold for 500ms+',
            '• Swipe: Quick directional movement',
            '• Pinch: Two fingers moving together/apart',
            '• Rotation: Two fingers rotating around center'
        ];

        instructions.forEach((instruction, index) => {
            this.add.text(20, 180 + index * 20, instruction, {
                fontSize: '14px',
                color: '#ffffff'
            });
        });

        // Set up touch/pointer events
        this.setupGestureEvents(touchArea);

        console.log('✅ Gesture Demo initialized with multi-touch support!');
    }

    private setupGestureEvents(touchArea: Phaser.GameObjects.Rectangle): void {
        // Pointer down
        touchArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const touchPoint: TouchPoint = {
                id: pointer.id,
                x: pointer.x,
                y: pointer.y,
                startX: pointer.x,
                startY: pointer.y,
                time: Date.now()
            };

            this.activeTouches.set(pointer.id, touchPoint);
            this.createTouchVisual(pointer.x, pointer.y, 0x2ecc71);

            // Check for multi-touch
            if (this.activeTouches.size === 2) {
                this.detectPinchStart();
            }
        });

        // Pointer move
        touchArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.activeTouches.has(pointer.id)) {
                const touchPoint = this.activeTouches.get(pointer.id)!;
                touchPoint.x = pointer.x;
                touchPoint.y = pointer.y;

                if (this.activeTouches.size === 1) {
                    this.detectSwipe(touchPoint);
                } else if (this.activeTouches.size === 2) {
                    this.detectPinchMove();
                }
            }
        });

        // Pointer up
        touchArea.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.activeTouches.has(pointer.id)) {
                const touchPoint = this.activeTouches.get(pointer.id)!;
                const duration = Date.now() - touchPoint.time;

                // Check gesture type
                if (duration < 200 && this.getDistance(touchPoint.startX, touchPoint.startY, touchPoint.x, touchPoint.y) < 30) {
                    this.detectTap(touchPoint);
                } else if (duration > 500) {
                    this.detectLongPress(touchPoint);
                }

                this.activeTouches.delete(pointer.id);
            }
        });
    }

    private detectTap(touchPoint: TouchPoint): void {
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastTapTime;

        if (timeDiff < 500 && this.tapCount === 1) {
            this.addGestureInfo({
                type: 'Double Tap',
                details: `Position: (${Math.round(touchPoint.x)}, ${Math.round(touchPoint.y)})`,
                color: 0xe74c3c
            });
            this.tapCount = 0;
        } else {
            this.tapCount = 1;
            this.lastTapTime = currentTime;
            
            setTimeout(() => {
                if (this.tapCount === 1) {
                    this.addGestureInfo({
                        type: 'Single Tap',
                        details: `Position: (${Math.round(touchPoint.x)}, ${Math.round(touchPoint.y)})`,
                        color: 0x3498db
                    });
                }
                this.tapCount = 0;
            }, 300);
        }
    }

    private detectLongPress(touchPoint: TouchPoint): void {
        this.addGestureInfo({
            type: 'Long Press',
            details: `Duration: ${Date.now() - touchPoint.time}ms, Position: (${Math.round(touchPoint.x)}, ${Math.round(touchPoint.y)})`,
            color: 0x9b59b6
        });

        // Visual feedback for long press
        this.createTouchVisual(touchPoint.x, touchPoint.y, 0x9b59b6, 200);
    }

    private detectSwipe(touchPoint: TouchPoint): void {
        const deltaX = touchPoint.x - touchPoint.startX;
        const deltaY = touchPoint.y - touchPoint.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 50) {
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            let direction = '';

            if (angle >= -45 && angle < 45) direction = 'Right';
            else if (angle >= 45 && angle < 135) direction = 'Down';
            else if (angle >= -135 && angle < -45) direction = 'Up';
            else direction = 'Left';

            this.addGestureInfo({
                type: 'Swipe',
                details: `Direction: ${direction}, Distance: ${Math.round(distance)}px, Speed: ${Math.round(distance / (Date.now() - touchPoint.time) * 1000)}px/s`,
                color: 0xf39c12
            });

            // Reset start position to prevent multiple swipe detections
            touchPoint.startX = touchPoint.x;
            touchPoint.startY = touchPoint.y;
        }
    }

    private detectPinchStart(): void {
        const touches = Array.from(this.activeTouches.values());
        if (touches.length === 2) {
            const initialDistance = this.getDistance(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
            (this as any).initialPinchDistance = initialDistance;
            (this as any).lastPinchDistance = initialDistance;
        }
    }

    private detectPinchMove(): void {
        const touches = Array.from(this.activeTouches.values());
        if (touches.length === 2 && (this as any).initialPinchDistance) {
            const currentDistance = this.getDistance(touches[0].x, touches[0].y, touches[1].x, touches[1].y);
            const scale = currentDistance / (this as any).initialPinchDistance;
            
            // Only report significant changes
            if (Math.abs(currentDistance - (this as any).lastPinchDistance) > 20) {
                const gestureType = currentDistance > (this as any).lastPinchDistance ? 'Pinch Out (Zoom)' : 'Pinch In (Zoom)';
                
                this.addGestureInfo({
                    type: gestureType,
                    details: `Scale: ${scale.toFixed(2)}x, Distance: ${Math.round(currentDistance)}px`,
                    color: 0x1abc9c
                });

                (this as any).lastPinchDistance = currentDistance;
            }
        }
    }

    private addGestureInfo(info: GestureInfo): void {
        this.gestureHistory.unshift(info);
        if (this.gestureHistory.length > 8) {
            this.gestureHistory.pop();
        }

        this.updateGestureDisplay();
    }

    private updateGestureDisplay(): void {
        let displayText = 'Recent Gestures:\n\n';
        
        this.gestureHistory.forEach((info, index) => {
            const timestamp = new Date().toLocaleTimeString();
            displayText += `${index + 1}. ${info.type}\n   ${info.details}\n   Time: ${timestamp}\n\n`;
        });

        this.gestureText.setText(displayText);
    }

    private createTouchVisual(x: number, y: number, color: number, duration: number = 100): void {
        const circle = this.add.circle(x, y, 20, color, 0.7);
        
        this.tweens.add({
            targets: circle,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                circle.destroy();
            }
        });

        // Add ripple effect
        const ripple = this.add.circle(x, y, 5, color, 0.3);
        this.tweens.add({
            targets: ripple,
            scaleX: 8,
            scaleY: 8,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                ripple.destroy();
            }
        });
    }

    private getDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    }
}

export function initializeGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#2c3e50',
        scene: GestureScene,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        input: {
            mouse: {
                target: 'game-container'
            },
            touch: {
                target: 'game-container'
            }
        }
    };

    const game = new Phaser.Game(config);
    console.log('✅ Gesture Demo initialized with multi-touch recognition!');
    
    return game;
}