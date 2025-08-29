// Advanced Features Demo
export function initializeGame() {
    console.log('🚀 Initializing Advanced Game Example...');
    
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#34495e',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 200 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    const game = new Phaser.Game(config);
    let player, enemies = [], powerUps = [];
    let score = 0, scoreText, statusText;
    let gameState = 'playing';
    let emitter;
    
    function preload() {
        // Create game assets
        this.add.graphics()
            .fillStyle(0x3498db)
            .fillRect(0, 0, 32, 32)
            .generateTexture('player', 32, 32);
            
        this.add.graphics()
            .fillStyle(0xe74c3c)
            .fillRect(0, 0, 24, 24)
            .generateTexture('enemy', 24, 24);
            
        this.add.graphics()
            .fillStyle(0xf1c40f)
            .fillCircle(8, 8, 8)
            .generateTexture('powerup', 16, 16);
            
        this.add.graphics()
            .fillStyle(0x2ecc71)
            .fillRect(0, 0, 8, 8)
            .generateTexture('projectile', 8, 8);
            
        this.add.graphics()
            .fillStyle(0xffffff)
            .fillCircle(1, 1, 1)
            .generateTexture('particle', 2, 2);
    }
    
    function create() {
        // Title
        this.add.text(20, 20, '🚀 Advanced Features Demo', {
            fontSize: '24px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        
        // UI
        scoreText = this.add.text(20, 60, 'Score: 0', {
            fontSize: '18px',
            fill: '#ffffff'
        });
        
        statusText = this.add.text(20, 90, 'Use WASD or Arrow Keys to move, SPACE to shoot', {
            fontSize: '14px',
            fill: '#ffffff'
        });
        
        // Create player
        player = this.physics.add.sprite(400, 500, 'player');
        player.setCollideWorldBounds(true);
        player.setBounce(0.2);
        
        // Player properties
        player.health = 100;
        player.maxHealth = 100;
        player.energy = 50;
        player.maxEnergy = 50;
        
        // Create particle emitter for effects
        emitter = this.add.particles(0, 0, 'particle', {
            speed: { min: 50, max: 100 },
            lifespan: 500,
            quantity: 5,
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            emitting: false
        });
        
        // Input handling
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys('W,S,A,D,SPACE');
        
        // Game mechanics
        setupGameMechanics.call(this);
        
        // Create initial enemies and power-ups
        spawnEnemy.call(this);
        spawnPowerUp.call(this);
        
        // Health and energy bars
        createUI.call(this);
    }
    
    function setupGameMechanics() {
        // Spawn enemies periodically
        this.time.addEvent({
            delay: 2000,
            callback: () => spawnEnemy.call(this),
            loop: true
        });
        
        // Spawn power-ups periodically
        this.time.addEvent({
            delay: 5000,
            callback: () => spawnPowerUp.call(this),
            loop: true
        });
        
        // Projectile group
        this.projectiles = this.physics.add.group();
        
        // Collision detection
        this.physics.add.overlap(this.projectiles, enemies, hitEnemy, null, this);
        this.physics.add.overlap(player, powerUps, collectPowerUp, null, this);
        this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    }
    
    function spawnEnemy() {
        if (enemies.length >= 8) return; // Limit enemies
        
        const x = Math.random() * 760 + 20;
        const enemy = this.physics.add.sprite(x, 50, 'enemy');
        enemy.setBounce(1);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocity(
            (Math.random() - 0.5) * 200,
            Math.random() * 100 + 50
        );
        enemy.health = 2;
        enemies.push(enemy);
    }
    
    function spawnPowerUp() {
        if (powerUps.length >= 3) return; // Limit power-ups
        
        const x = Math.random() * 760 + 20;
        const y = Math.random() * 300 + 100;
        const powerUp = this.physics.add.sprite(x, y, 'powerup');
        powerUp.setVelocity(0, 30);
        powerUp.type = Math.random() < 0.5 ? 'health' : 'energy';
        powerUp.setTint(powerUp.type === 'health' ? 0xff6b6b : 0x4ecdc4);
        powerUps.push(powerUp);
        
        // Floating animation
        this.tweens.add({
            targets: powerUp,
            y: powerUp.y - 10,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    function createUI() {
        // Health bar
        const healthBarBg = this.add.rectangle(120, 570, 200, 16, 0x333333);
        const healthBar = this.add.rectangle(120, 570, 200, 12, 0xe74c3c);
        healthBar.name = 'healthBar';
        
        // Energy bar
        const energyBarBg = this.add.rectangle(350, 570, 150, 16, 0x333333);
        const energyBar = this.add.rectangle(350, 570, 150, 12, 0x3498db);
        energyBar.name = 'energyBar';
        
        // Labels
        this.add.text(25, 562, 'Health:', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(280, 562, 'Energy:', { fontSize: '14px', fill: '#ffffff' });
    }
    
    function hitEnemy(projectile, enemy) {
        // Create explosion effect
        emitter.setPosition(enemy.x, enemy.y);
        emitter.explode();
        
        // Damage enemy
        enemy.health--;
        enemy.setTint(0xff6b6b);
        
        this.tweens.add({
            targets: enemy,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            onComplete: () => enemy.clearTint()
        });
        
        if (enemy.health <= 0) {
            const index = enemies.indexOf(enemy);
            if (index > -1) enemies.splice(index, 1);
            enemy.destroy();
            score += 10;
            scoreText.setText(`Score: ${score}`);
        }
        
        projectile.destroy();
    }
    
    function collectPowerUp(player, powerUp) {
        const index = powerUps.indexOf(powerUp);
        if (index > -1) powerUps.splice(index, 1);
        
        if (powerUp.type === 'health') {
            player.health = Math.min(player.maxHealth, player.health + 25);
            statusText.setText('Health restored!').setTint(0x2ecc71);
        } else {
            player.energy = Math.min(player.maxEnergy, player.energy + 15);
            statusText.setText('Energy restored!').setTint(0x3498db);
        }
        
        // Effect
        emitter.setPosition(powerUp.x, powerUp.y);
        emitter.explode();
        
        powerUp.destroy();
        
        setTimeout(() => {
            statusText.setText('Use WASD or Arrow Keys to move, SPACE to shoot').clearTint();
        }, 2000);
    }
    
    function hitPlayer(player, enemy) {
        player.health -= 10;
        if (player.health <= 0) {
            gameState = 'gameOver';
            statusText.setText('GAME OVER - Press R to restart').setTint(0xe74c3c);
            player.setTint(0x666666);
        }
        
        // Knockback
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        player.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
    }
    
    function update() {
        if (gameState !== 'playing') {
            if (this.input.keyboard.addKey('R').isDown) {
                // Restart game
                gameState = 'playing';
                player.health = player.maxHealth;
                player.energy = player.maxEnergy;
                score = 0;
                scoreText.setText('Score: 0');
                statusText.setText('Use WASD or Arrow Keys to move, SPACE to shoot').clearTint();
                player.clearTint();
            }
            return;
        }
        
        // Player movement
        const speed = 200;
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            player.setVelocityX(speed);
        } else {
            player.setVelocityX(0);
        }
        
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            player.setVelocityY(-speed);
        } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
            player.setVelocityY(speed);
        } else {
            player.setVelocityY(0);
        }
        
        // Shooting
        if (Phaser.Input.Keyboard.JustDown(this.wasd.SPACE) && player.energy >= 5) {
            shoot.call(this);
            player.energy -= 5;
        }
        
        // Regenerate energy
        if (player.energy < player.maxEnergy) {
            player.energy += 0.1;
        }
        
        // Update UI bars
        const healthBar = this.children.getByName('healthBar');
        const energyBar = this.children.getByName('energyBar');
        
        if (healthBar) {
            const healthPercent = player.health / player.maxHealth;
            healthBar.scaleX = healthPercent;
        }
        
        if (energyBar) {
            const energyPercent = player.energy / player.maxEnergy;
            energyBar.scaleX = energyPercent;
        }
    }
    
    function shoot() {
        const projectile = this.physics.add.sprite(player.x, player.y - 20, 'projectile');
        projectile.setVelocityY(-400);
        this.projectiles.add(projectile);
        
        // Auto-destroy projectiles that go off-screen
        this.time.delayedCall(2000, () => {
            if (projectile.active) projectile.destroy();
        });
    }
    
    console.log('✅ Advanced game initialized successfully!');
    return game;
}