/**
 * Basic Game Demo - TypeScript Edition
 * Demonstrates core Phaser 3.90 features with TypeScript
 */

import * as Phaser from 'phaser';

interface GameAssets {
    player: string;
    ground: string;
    platforms: string;
}

class BasicGameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private platforms!: Phaser.Physics.Arcade.StaticGroup;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private stars!: Phaser.Physics.Arcade.Group;
    private score: number = 0;
    private scoreText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'BasicGameScene' });
    }

    preload(): void {
        // Create simple colored rectangles as textures
        this.add.graphics()
            .fillStyle(0x00ff00)
            .fillRect(0, 0, 32, 48)
            .generateTexture('player', 32, 48);

        this.add.graphics()
            .fillStyle(0x8B4513)
            .fillRect(0, 0, 400, 32)
            .generateTexture('ground', 400, 32);

        this.add.graphics()
            .fillStyle(0xFFD700)
            .fillCircle(16, 16, 16)
            .generateTexture('star', 32, 32);
    }

    create(): void {
        // Create platforms
        this.platforms = this.physics.add.staticGroup();
        
        // Ground
        this.platforms.create(400, 568, 'ground').setScale(2, 1).refreshBody();
        
        // Platforms
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');

        // Create player
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);

        // Player animations (simple color change)
        this.player.setTint(0x00ff00);

        // Physics collision
        this.physics.add.collider(this.player, this.platforms);

        // Create stars
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        } as any);

        this.stars.children.entries.forEach((star) => {
            (star as Phaser.Physics.Arcade.Sprite).setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.overlap(this.player, this.stars, this.collectStar, undefined, this);

        // Input
        this.cursors = this.input.keyboard!.createCursorKeys();

        // Score
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            color: '#000'
        });

        // Title
        this.add.text(16, 50, '🎯 Basic Platformer Demo', {
            fontSize: '24px',
            color: '#ffffff'
        });

        this.add.text(16, 80, 'Arrow Keys to Move & Jump', {
            fontSize: '16px',
            color: '#ffffff'
        });
    }

    update(): void {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.setTint(0x00aa00);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.setTint(0x00aa00);
        } else {
            this.player.setVelocityX(0);
            this.player.setTint(0x00ff00);
        }

        if (this.cursors.up.isDown && this.player.body!.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    private collectStar(player: any, star: any): void {
        if (star && star.disableBody) {
            star.disableBody(true, true);
        }

        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);

        if (this.stars.countActive(true) === 0) {
            this.stars.children.entries.forEach((star: any) => {
                if (star && star.enableBody) {
                    star.enableBody(true, star.x, 0, true, true);
                }
            });

            this.score += 100;
            this.scoreText.setText('Score: ' + this.score);
        }
    }
}

export function initializeGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#87CEEB',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 300 },
                debug: false
            }
        },
        scene: BasicGameScene,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        }
    };

    const game = new Phaser.Game(config);
    console.log('✅ Basic Game Demo initialized with TypeScript!');
    
    return game;
}