/**
 * Box2D Advanced Physics Examples - TypeScript Edition
 * Showcases complex Box2D features from the reference examples
 */

import * as Phaser from 'phaser';

interface PhysicsBody {
    sprite: any; // Can be any Phaser GameObject
    velocityX: number;
    velocityY: number;
    angularVelocity: number;
    type: 'dynamic' | 'static' | 'kinematic';
    shape: 'box' | 'circle' | 'polygon';
    restitution: number;
    friction: number;
    density: number;
}

/**
 * Bridge Physics Demo
 * Creates a rope bridge with connected segments
 */
class BridgeScene extends Phaser.Scene {
    private bodies: PhysicsBody[] = [];
    private joints: any[] = [];
    
    constructor() {
        super({ key: 'BridgeScene' });
    }

    create(): void {
        this.add.text(20, 20, '🌉 Bridge Physics Demo', {
            fontSize: '24px',
            color: '#ffffff'
        });

        // Create bridge segments
        const segmentCount = 15;
        const segmentWidth = 40;
        const segmentHeight = 10;
        const startX = 100;
        const startY = 300;

        let prevBody: PhysicsBody | null = null;

        for (let i = 0; i < segmentCount; i++) {
            const x = startX + i * (segmentWidth + 5);
            const segment = this.add.rectangle(
                x, startY, segmentWidth, segmentHeight, 0x8B4513
            );

            const body: PhysicsBody = {
                sprite: segment,
                velocityX: 0,
                velocityY: 0,
                angularVelocity: 0,
                type: i === 0 || i === segmentCount - 1 ? 'static' : 'dynamic',
                shape: 'box',
                restitution: 0.2,
                friction: 0.5,
                density: 1.0
            };

            this.bodies.push(body);

            // Create joint with previous segment
            if (prevBody && i > 0) {
                this.createJoint(prevBody, body);
            }

            prevBody = body;
        }

        // Add weight on bridge
        this.time.delayedCall(2000, () => {
            this.dropWeightOnBridge();
        });
    }

    private createJoint(bodyA: PhysicsBody, bodyB: PhysicsBody): void {
        // Simulate joint connection
        this.joints.push({ bodyA, bodyB, type: 'revolute' });
    }

    private dropWeightOnBridge(): void {
        const weight = this.add.circle(400, 100, 20, 0xFF0000);
        
        const body: PhysicsBody = {
            sprite: weight,
            velocityX: 0,
            velocityY: 100,
            angularVelocity: 0,
            type: 'dynamic',
            shape: 'circle',
            restitution: 0.3,
            friction: 0.5,
            density: 5.0 // Heavy weight
        };

        this.bodies.push(body);
    }

    update(time: number, delta: number): void {
        const gravity = 500;
        const deltaSeconds = delta / 1000;

        this.bodies.forEach(body => {
            if (body.type === 'dynamic') {
                // Apply gravity
                body.velocityY += gravity * deltaSeconds;

                // Update position
                body.sprite.x += body.velocityX * deltaSeconds;
                body.sprite.y += body.velocityY * deltaSeconds;

                // Simple ground collision
                if (body.sprite.y > 550) {
                    body.sprite.y = 550;
                    body.velocityY *= -0.5;
                }
            }
        });

        // Update joints (simplified spring physics)
        this.joints.forEach(joint => {
            if (joint.bodyA.type === 'dynamic' && joint.bodyB.type === 'dynamic') {
                const dx = joint.bodyB.sprite.x - joint.bodyA.sprite.x;
                const dy = joint.bodyB.sprite.y - joint.bodyA.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const targetDistance = 45;
                
                if (distance > targetDistance) {
                    const force = (distance - targetDistance) * 0.1;
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    joint.bodyA.velocityX += fx;
                    joint.bodyA.velocityY += fy;
                    joint.bodyB.velocityX -= fx;
                    joint.bodyB.velocityY -= fy;
                }
            }
        });
    }
}

/**
 * Dominos Physics Demo
 * Chain reaction of falling dominos
 */
class DominosScene extends Phaser.Scene {
    private dominos: PhysicsBody[] = [];
    
    constructor() {
        super({ key: 'DominosScene' });
    }

    create(): void {
        this.add.text(20, 20, '🎯 Dominos Chain Reaction', {
            fontSize: '24px',
            color: '#ffffff'
        });

        // Create dominos
        const dominoCount = 20;
        const startX = 100;
        const spacing = 35;

        for (let i = 0; i < dominoCount; i++) {
            const x = startX + i * spacing;
            const y = 400;
            
            const domino = this.add.rectangle(x, y, 10, 60, 0xFFFFFF);
            domino.setStrokeStyle(2, 0x000000);

            const body: PhysicsBody = {
                sprite: domino,
                velocityX: 0,
                velocityY: 0,
                angularVelocity: 0,
                type: 'dynamic',
                shape: 'box',
                restitution: 0.1,
                friction: 0.5,
                density: 1.0
            };

            this.dominos.push(body);
        }

        // Create trigger ball
        this.time.delayedCall(1000, () => {
            this.triggerDominos();
        });

        // Instructions
        this.add.text(20, 500, 'Click to reset and trigger again', {
            fontSize: '16px',
            color: '#ffffff'
        });

        this.input.on('pointerdown', () => {
            this.resetDominos();
            this.time.delayedCall(500, () => {
                this.triggerDominos();
            });
        });
    }

    private triggerDominos(): void {
        // Push the first domino
        if (this.dominos.length > 0) {
            this.dominos[0].velocityX = 150;
            this.dominos[0].angularVelocity = 2;
        }
    }

    private resetDominos(): void {
        const startX = 100;
        const spacing = 35;

        this.dominos.forEach((domino, i) => {
            domino.sprite.x = startX + i * spacing;
            domino.sprite.y = 400;
            domino.sprite.rotation = 0;
            domino.velocityX = 0;
            domino.velocityY = 0;
            domino.angularVelocity = 0;
        });
    }

    update(time: number, delta: number): void {
        const gravity = 500;
        const deltaSeconds = delta / 1000;

        this.dominos.forEach((domino, index) => {
            // Apply physics
            domino.velocityY += gravity * deltaSeconds;
            domino.sprite.x += domino.velocityX * deltaSeconds;
            domino.sprite.y += domino.velocityY * deltaSeconds;
            domino.sprite.rotation += domino.angularVelocity * deltaSeconds;

            // Ground collision
            if (domino.sprite.y > 430) {
                domino.sprite.y = 430;
                domino.velocityY = 0;
                domino.velocityX *= 0.9; // Friction
                domino.angularVelocity *= 0.95;
            }

            // Domino collision (simplified)
            for (let j = index + 1; j < this.dominos.length; j++) {
                const other = this.dominos[j];
                const dx = other.sprite.x - domino.sprite.x;
                const dy = other.sprite.y - domino.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 40 && domino.velocityX > 10) {
                    // Transfer momentum
                    other.velocityX = domino.velocityX * 0.8;
                    other.angularVelocity = 3;
                    domino.velocityX *= 0.3;
                }
            }
        });
    }
}

/**
 * Volleyball Game Demo
 * Interactive volleyball with physics
 */
class VolleyballScene extends Phaser.Scene {
    private ball!: PhysicsBody;
    private playerLeft!: PhysicsBody;
    private playerRight!: PhysicsBody;
    private net!: Phaser.GameObjects.Rectangle;
    private scoreLeft: number = 0;
    private scoreRight: number = 0;
    private scoreText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'VolleyballScene' });
    }

    create(): void {
        this.add.text(20, 20, '🏐 Volleyball Physics', {
            fontSize: '24px',
            color: '#ffffff'
        });

        // Create court
        this.add.rectangle(400, 550, 800, 10, 0x8B6914);

        // Create net
        this.net = this.add.rectangle(400, 450, 10, 200, 0x808080);

        // Create players
        this.playerLeft = this.createPlayer(200, 500, 0x0000FF);
        this.playerRight = this.createPlayer(600, 500, 0xFF0000);

        // Create ball
        const ballSprite = this.add.circle(200, 200, 15, 0xFFFF00);
        this.ball = {
            sprite: ballSprite,
            velocityX: 100,
            velocityY: 0,
            angularVelocity: 0,
            type: 'dynamic',
            shape: 'circle',
            restitution: 0.9,
            friction: 0.1,
            density: 0.5
        };

        // Score display
        this.scoreText = this.add.text(400, 50, `${this.scoreLeft} - ${this.scoreRight}`, {
            fontSize: '32px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Controls
        this.setupControls();
    }

    private createPlayer(x: number, y: number, color: number): PhysicsBody {
        const player = this.add.rectangle(x, y, 40, 80, color);
        
        return {
            sprite: player,
            velocityX: 0,
            velocityY: 0,
            angularVelocity: 0,
            type: 'kinematic',
            shape: 'box',
            restitution: 0.5,
            friction: 0.3,
            density: 1.0
        };
    }

    private setupControls(): void {
        // Left player: A/D for movement, W for jump
        const keys = this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,RIGHT');
        
        this.input.keyboard!.on('keydown-A', () => {
            this.playerLeft.velocityX = -200;
        });
        
        this.input.keyboard!.on('keydown-D', () => {
            this.playerLeft.velocityX = 200;
        });
        
        this.input.keyboard!.on('keyup-A', () => {
            if (this.playerLeft.velocityX < 0) this.playerLeft.velocityX = 0;
        });
        
        this.input.keyboard!.on('keyup-D', () => {
            if (this.playerLeft.velocityX > 0) this.playerLeft.velocityX = 0;
        });
        
        this.input.keyboard!.on('keydown-W', () => {
            if (this.playerLeft.sprite.y >= 490) {
                this.playerLeft.velocityY = -400;
            }
        });

        // Right player: Arrow keys
        this.input.keyboard!.on('keydown-LEFT', () => {
            this.playerRight.velocityX = -200;
        });
        
        this.input.keyboard!.on('keydown-RIGHT', () => {
            this.playerRight.velocityX = 200;
        });
        
        this.input.keyboard!.on('keyup-LEFT', () => {
            if (this.playerRight.velocityX < 0) this.playerRight.velocityX = 0;
        });
        
        this.input.keyboard!.on('keyup-RIGHT', () => {
            if (this.playerRight.velocityX > 0) this.playerRight.velocityX = 0;
        });
        
        this.input.keyboard!.on('keydown-UP', () => {
            if (this.playerRight.sprite.y >= 490) {
                this.playerRight.velocityY = -400;
            }
        });
    }

    update(time: number, delta: number): void {
        const gravity = 800;
        const deltaSeconds = delta / 1000;

        // Update ball physics
        this.ball.velocityY += gravity * deltaSeconds;
        this.ball.sprite.x += this.ball.velocityX * deltaSeconds;
        this.ball.sprite.y += this.ball.velocityY * deltaSeconds;

        // Ball collision with ground
        if (this.ball.sprite.y > 535) {
            // Check which side scored
            if (this.ball.sprite.x < 400) {
                this.scoreRight++;
            } else {
                this.scoreLeft++;
            }
            
            this.scoreText.setText(`${this.scoreLeft} - ${this.scoreRight}`);
            
            // Reset ball
            this.ball.sprite.x = this.ball.sprite.x < 400 ? 600 : 200;
            this.ball.sprite.y = 200;
            this.ball.velocityX = this.ball.sprite.x < 400 ? -100 : 100;
            this.ball.velocityY = 0;
        }

        // Ball collision with net
        if (Math.abs(this.ball.sprite.x - 400) < 20 && 
            this.ball.sprite.y > 350 && this.ball.sprite.y < 450) {
            this.ball.velocityX *= -0.8;
        }

        // Ball collision with walls
        if (this.ball.sprite.x < 15 || this.ball.sprite.x > 785) {
            this.ball.velocityX *= -1;
            this.ball.sprite.x = Phaser.Math.Clamp(this.ball.sprite.x, 15, 785);
        }

        // Update players
        [this.playerLeft, this.playerRight].forEach(player => {
            // Apply gravity to players
            if (player.type === 'kinematic') {
                player.velocityY += gravity * deltaSeconds;
            }
            
            player.sprite.x += player.velocityX * deltaSeconds;
            player.sprite.y += player.velocityY * deltaSeconds;

            // Player ground collision
            if (player.sprite.y > 500) {
                player.sprite.y = 500;
                player.velocityY = 0;
            }

            // Keep players in bounds
            player.sprite.x = Phaser.Math.Clamp(player.sprite.x, 40, 760);

            // Ball collision with players
            const dx = this.ball.sprite.x - player.sprite.x;
            const dy = this.ball.sprite.y - player.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 50) {
                // Hit the ball
                this.ball.velocityX = dx * 5;
                this.ball.velocityY = -300 + dy * 2;
            }
        });
    }
}

export function initializeGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#1a1a1a',
        scene: [BridgeScene, DominosScene, VolleyballScene],
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    const game = new Phaser.Game(config);
    
    // Scene selector
    setTimeout(() => {
        const currentScene = Phaser.Math.RND.pick(['BridgeScene', 'DominosScene', 'VolleyballScene']);
        game.scene.start(currentScene);
        console.log(`✅ Box2D Advanced Demo started: ${currentScene}`);
    }, 100);
    
    return game;
}