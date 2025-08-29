// Simple Basic Game Example
export function initializeGame() {
    console.log('🎮 Initializing Basic Game Example...');
    
    // Simple Phaser game configuration
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#2c3e50',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 300 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    // Create the game
    const game = new Phaser.Game(config);
    
    let player;
    let platforms;
    let cursors;
    
    function preload() {
        // Create simple colored rectangles as sprites
        this.add.graphics()
            .fillStyle(0x00ff00)
            .fillRect(0, 0, 32, 48)
            .generateTexture('player', 32, 48);
            
        this.add.graphics()
            .fillStyle(0x8B4513)
            .fillRect(0, 0, 400, 32)
            .generateTexture('ground', 400, 32);
    }
    
    function create() {
        // Create platforms
        platforms = this.physics.add.staticGroup();
        platforms.create(400, 568, 'ground').setScale(2, 1).refreshBody();
        platforms.create(600, 400, 'ground');
        platforms.create(50, 250, 'ground');
        platforms.create(750, 220, 'ground');
        
        // Create player
        player = this.physics.add.sprite(100, 450, 'player');
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
        
        // Player physics
        this.physics.add.collider(player, platforms);
        
        // Create cursor keys
        cursors = this.input.keyboard.createCursorKeys();
        
        // Add title text
        this.add.text(16, 16, '🎮 Phaser Framework 2025 - Basic Example', {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        this.add.text(16, 50, 'Use arrow keys to move the green player', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        
        console.log('✅ Basic game initialized successfully!');
    }
    
    function update() {
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
        } else {
            player.setVelocityX(0);
        }
        
        if (cursors.up.isDown && player.body.touching.down) {
            player.setVelocityY(-330);
        }
    }
    
    return game;
}