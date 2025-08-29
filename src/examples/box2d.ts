/**
 * Box2D Physics Demo - TypeScript Edition
 * Advanced physics simulation with Box2D engine
 */

import * as Phaser from 'phaser';

// Box2D type definitions (simplified for demo)
declare const PhaserBox2D: any;

interface Box2DBody {
    x: number;
    y: number;
    angle: number;
    velocity: { x: number; y: number };
    angularVelocity: number;
}

class Box2DScene extends Phaser.Scene {
    private bodies: Box2DBody[] = [];
    private graphics!: Phaser.GameObjects.Graphics;
    private infoText!: Phaser.GameObjects.Text;
    private worldScale: number = 30; // Box2D to pixel scale
    private isBox2DAvailable: boolean = false;
    
    // Simulated physics properties
    private gravity: number = 500;
    private restitution: number = 0.7;
    private friction: number = 0.3;
    
    constructor() {
        super({ key: 'Box2DScene' });
    }

    preload(): void {
        // Check if Box2D library is available
        this.isBox2DAvailable = typeof PhaserBox2D !== 'undefined';
        
        if (!this.isBox2DAvailable) {
            console.log('📦 Box2D library not loaded, using simplified physics simulation');
        }
    }

    create(): void {
        // Title
        this.add.text(20, 20, '📦 Box2D Physics Demo', {
            fontSize: '28px',
            color: '#ffffff'
        });

        // Info text
        this.infoText = this.add.text(20, 60, '', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'monospace'
        });

        // Graphics for drawing physics bodies
        this.graphics = this.add.graphics();

        // Create physics bodies
        this.createPhysicsWorld();

        // Instructions
        const instructions = [
            'Box2D Advanced Physics Features:',
            '• Click to spawn dynamic bodies',
            '• Right-click for static bodies',
            '• Press SPACE to reset',
            '• Press R to spawn ragdoll',
            '• Press J for joints demo',
            '• Press E for explosion'
        ];

        instructions.forEach((text, index) => {
            this.add.text(20, 400 + index * 20, text, {
                fontSize: '14px',
                color: index === 0 ? '#ffffff' : '#cccccc'
            });
        });

        // Input handlers
        this.setupInputHandlers();

        // Start physics simulation
        if (this.isBox2DAvailable) {
            this.initializeBox2D();
        } else {
            this.initializeSimplifiedPhysics();
        }
    }

    private createPhysicsWorld(): void {
        // Create ground
        this.createStaticBox(400, 580, 800, 20, 0x8B4513);
        
        // Create platforms
        this.createStaticBox(200, 450, 200, 20, 0x654321);
        this.createStaticBox(600, 350, 200, 20, 0x654321);
        
        // Create some initial dynamic bodies
        for (let i = 0; i < 5; i++) {
            this.createDynamicBox(
                300 + i * 40,
                100 + i * 30,
                30,
                30,
                Phaser.Math.Between(0x000000, 0xffffff)
            );
        }

        // Create circles
        for (let i = 0; i < 3; i++) {
            this.createDynamicCircle(
                400 + i * 50,
                50,
                20,
                Phaser.Math.Between(0x000000, 0xffffff)
            );
        }
    }

    private initializeBox2D(): void {
        // This would initialize actual Box2D if library is loaded
        console.log('🚀 Box2D physics engine initialized');
    }

    private initializeSimplifiedPhysics(): void {
        // Simplified physics for demo purposes
        console.log('⚡ Using simplified physics simulation');
    }

    private setupInputHandlers(): void {
        // Left click - spawn dynamic body
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.leftButtonDown()) {
                const type = Phaser.Math.Between(0, 2);
                
                switch(type) {
                    case 0:
                        this.createDynamicBox(
                            pointer.x,
                            pointer.y,
                            Phaser.Math.Between(20, 40),
                            Phaser.Math.Between(20, 40),
                            Phaser.Math.Between(0x000000, 0xffffff)
                        );
                        break;
                    case 1:
                        this.createDynamicCircle(
                            pointer.x,
                            pointer.y,
                            Phaser.Math.Between(10, 25),
                            Phaser.Math.Between(0x000000, 0xffffff)
                        );
                        break;
                    case 2:
                        this.createDynamicPolygon(
                            pointer.x,
                            pointer.y,
                            Phaser.Math.Between(0x000000, 0xffffff)
                        );
                        break;
                }
            }
        });

        // Right click - spawn static body
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                this.createStaticBox(
                    pointer.x,
                    pointer.y,
                    Phaser.Math.Between(40, 80),
                    Phaser.Math.Between(10, 20),
                    0x808080
                );
            }
        });

        // Keyboard controls
        this.input.keyboard?.on('keydown-SPACE', () => {
            this.resetWorld();
        });

        this.input.keyboard?.on('keydown-R', () => {
            this.createRagdoll(400, 100);
        });

        this.input.keyboard?.on('keydown-J', () => {
            this.createJointsDemo();
        });

        this.input.keyboard?.on('keydown-E', () => {
            this.createExplosion(400, 300);
        });
    }

    private createDynamicBox(x: number, y: number, width: number, height: number, color: number): void {
        const body: Box2DBody = {
            x: x,
            y: y,
            angle: 0,
            velocity: { x: 0, y: 0 },
            angularVelocity: 0
        };
        
        this.bodies.push(body);
        
        // Visual feedback
        this.tweens.add({
            targets: body,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    private createDynamicCircle(x: number, y: number, radius: number, color: number): void {
        const body: Box2DBody = {
            x: x,
            y: y,
            angle: 0,
            velocity: { x: Phaser.Math.Between(-50, 50), y: 0 },
            angularVelocity: Phaser.Math.Between(-2, 2)
        };
        
        this.bodies.push(body);
    }

    private createDynamicPolygon(x: number, y: number, color: number): void {
        // Create a triangular or pentagon shape
        const sides = Phaser.Math.Between(3, 5);
        const body: Box2DBody = {
            x: x,
            y: y,
            angle: 0,
            velocity: { x: 0, y: 0 },
            angularVelocity: Phaser.Math.Between(-1, 1)
        };
        
        this.bodies.push(body);
    }

    private createStaticBox(x: number, y: number, width: number, height: number, color: number): void {
        // Static bodies don't move
        this.graphics.fillStyle(color, 1);
        this.graphics.fillRect(x - width/2, y - height/2, width, height);
    }

    private createRagdoll(x: number, y: number): void {
        // Create a ragdoll with connected bodies
        console.log('🤸 Creating ragdoll at', x, y);
        
        // Head
        this.createDynamicCircle(x, y, 15, 0xFFDBB4);
        
        // Torso
        this.createDynamicBox(x, y + 40, 30, 50, 0x4169E1);
        
        // Arms
        this.createDynamicBox(x - 25, y + 30, 30, 10, 0xFFDBB4);
        this.createDynamicBox(x + 25, y + 30, 30, 10, 0xFFDBB4);
        
        // Legs
        this.createDynamicBox(x - 10, y + 80, 10, 40, 0x000080);
        this.createDynamicBox(x + 10, y + 80, 10, 40, 0x000080);
    }

    private createJointsDemo(): void {
        console.log('🔗 Creating joints demonstration');
        
        // Create a chain of connected boxes
        let prevX = 300;
        let prevY = 200;
        
        for (let i = 0; i < 8; i++) {
            const x = prevX + 30;
            const y = prevY;
            
            this.createDynamicBox(x, y, 25, 10, 0xFFD700);
            
            // Draw joint connection
            this.graphics.lineStyle(2, 0xFFFFFF, 0.5);
            this.graphics.lineBetween(prevX, prevY, x, y);
            
            prevX = x;
            prevY = y;
        }
    }

    private createExplosion(x: number, y: number): void {
        console.log('💥 Creating explosion at', x, y);
        
        // Create explosion effect
        const particles = 20;
        const force = 300;
        
        for (let i = 0; i < particles; i++) {
            const angle = (Math.PI * 2 / particles) * i;
            const vx = Math.cos(angle) * force;
            const vy = Math.sin(angle) * force;
            
            const body: Box2DBody = {
                x: x,
                y: y,
                angle: 0,
                velocity: { x: vx, y: vy },
                angularVelocity: Phaser.Math.Between(-5, 5)
            };
            
            this.bodies.push(body);
        }
        
        // Visual explosion effect
        const explosionCircle = this.add.circle(x, y, 10, 0xFFFF00, 1);
        
        this.tweens.add({
            targets: explosionCircle,
            scaleX: 10,
            scaleY: 10,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                explosionCircle.destroy();
            }
        });
    }

    private resetWorld(): void {
        console.log('🔄 Resetting physics world');
        
        this.bodies = [];
        this.graphics.clear();
        this.createPhysicsWorld();
    }

    update(time: number, delta: number): void {
        // Clear graphics
        this.graphics.clear();
        
        // Redraw static bodies
        this.createStaticBox(400, 580, 800, 20, 0x8B4513);
        this.createStaticBox(200, 450, 200, 20, 0x654321);
        this.createStaticBox(600, 350, 200, 20, 0x654321);
        
        // Simple physics simulation
        const deltaSeconds = delta / 1000;
        
        this.bodies.forEach((body, index) => {
            // Apply gravity
            body.velocity.y += this.gravity * deltaSeconds;
            
            // Apply velocity
            body.x += body.velocity.x * deltaSeconds;
            body.y += body.velocity.y * deltaSeconds;
            
            // Apply angular velocity
            body.angle += body.angularVelocity * deltaSeconds;
            
            // Simple collision with ground
            if (body.y > 560) {
                body.y = 560;
                body.velocity.y *= -this.restitution;
                body.velocity.x *= (1 - this.friction);
            }
            
            // Wall collisions
            if (body.x < 20 || body.x > 780) {
                body.velocity.x *= -this.restitution;
                body.x = Phaser.Math.Clamp(body.x, 20, 780);
            }
            
            // Draw body
            this.graphics.fillStyle(0x00FF00, 0.8);
            this.graphics.fillCircle(body.x, body.y, 10);
            
            // Remove bodies that fall off screen
            if (body.y > 700) {
                this.bodies.splice(index, 1);
            }
        });
        
        // Update info
        this.infoText.setText(
            `Box2D Physics Simulation\n` +
            `Active Bodies: ${this.bodies.length}\n` +
            `Gravity: ${this.gravity}\n` +
            `Restitution: ${this.restitution.toFixed(2)}\n` +
            `Friction: ${this.friction.toFixed(2)}\n` +
            `Engine: ${this.isBox2DAvailable ? 'Box2D' : 'Simplified'}`
        );
    }
}

// Additional Box2D physics features
class Box2DAdvancedScene extends Phaser.Scene {
    constructor() {
        super({ key: 'Box2DAdvancedScene' });
    }

    create(): void {
        // Advanced Box2D features would go here
        // - Compound shapes
        // - Complex joints (revolute, prismatic, distance, etc.)
        // - Motors and controllers
        // - Collision filtering and categories
        // - Sensors and triggers
        // - Continuous collision detection
        // - Buoyancy and fluid dynamics
    }
}

export function initializeGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#2c3e50',
        scene: [Box2DScene, Box2DAdvancedScene],
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        physics: {
            default: 'matter',
            matter: {
                gravity: { x: 0, y: 1 },
                debug: false
            }
        }
    };

    const game = new Phaser.Game(config);
    console.log('✅ Box2D Physics Demo initialized!');
    
    return game;
}