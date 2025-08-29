// Performance Monitor Demo
export function initializeGame() {
    console.log('📊 Initializing Performance Game Example...');
    
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#1abc9c',
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    const game = new Phaser.Game(config);
    let fpsText, memoryText, performanceText;
    let particles = [];
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 60;
    
    function preload() {
        // Create particle graphics
        this.add.graphics()
            .fillStyle(0xffffff)
            .fillCircle(2, 2, 2)
            .generateTexture('particle', 4, 4);
            
        this.add.graphics()
            .fillStyle(0xff3838)
            .fillRect(0, 0, 100, 30)
            .generateTexture('button', 100, 30);
    }
    
    function create() {
        // Title
        this.add.text(20, 20, '📊 Performance Monitor', {
            fontSize: '28px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        
        // Performance displays
        fpsText = this.add.text(20, 70, 'FPS: 60', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        
        memoryText = this.add.text(20, 95, 'Memory: Calculating...', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        
        performanceText = this.add.text(20, 120, '', {
            fontSize: '14px',
            fill: '#ffffff'
        });
        
        // Device info
        this.add.text(20, 200, 'Device Information:', {
            fontSize: '18px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        
        const deviceInfo = [
            `Platform: ${navigator.platform}`,
            `User Agent: ${navigator.userAgent.substring(0, 60)}...`,
            `CPU Cores: ${navigator.hardwareConcurrency || 'Unknown'}`,
            `Memory: ${navigator.deviceMemory || 'Unknown'} GB`,
            `Connection: ${navigator.connection?.effectiveType || 'Unknown'}`,
            `Language: ${navigator.language}`
        ];
        
        deviceInfo.forEach((info, index) => {
            this.add.text(20, 230 + index * 20, info, {
                fontSize: '12px',
                fill: '#ffffff'
            });
        });
        
        // Performance test buttons
        this.add.text(400, 200, 'Performance Tests:', {
            fontSize: '18px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        
        const buttons = [
            { text: 'Add 100 Particles', action: () => addParticles.call(this, 100) },
            { text: 'Add 500 Particles', action: () => addParticles.call(this, 500) },
            { text: 'Clear Particles', action: () => clearParticles.call(this) },
            { text: 'Stress Test', action: () => stressTest.call(this) }
        ];
        
        buttons.forEach((btn, index) => {
            const button = this.add.sprite(450, 240 + index * 40, 'button');
            const text = this.add.text(450, 240 + index * 40, btn.text, {
                fontSize: '12px',
                fill: '#ffffff'
            }).setOrigin(0.5);
            
            button.setInteractive();
            button.on('pointerdown', btn.action);
        });
        
        // Initial particles
        addParticles.call(this, 50);
        
        // Performance monitoring
        updatePerformanceInfo.call(this);
    }
    
    function addParticles(count) {
        for (let i = 0; i < count; i++) {
            const particle = this.add.sprite(
                Math.random() * 800,
                Math.random() * 600,
                'particle'
            );
            particle.setTint(Math.random() * 0xffffff);
            particle.velocityX = (Math.random() - 0.5) * 200;
            particle.velocityY = (Math.random() - 0.5) * 200;
            particles.push(particle);
        }
    }
    
    function clearParticles() {
        particles.forEach(particle => particle.destroy());
        particles = [];
    }
    
    function stressTest() {
        // Add many particles for stress testing
        addParticles.call(this, 1000);
        
        // Create complex calculations
        for (let i = 0; i < 10000; i++) {
            Math.sqrt(Math.random() * 1000);
        }
    }
    
    function update() {
        // Update particles
        particles.forEach(particle => {
            particle.x += particle.velocityX * 0.016;
            particle.y += particle.velocityY * 0.016;
            
            // Bounce off walls
            if (particle.x < 0 || particle.x > 800) particle.velocityX *= -1;
            if (particle.y < 0 || particle.y > 600) particle.velocityY *= -1;
            
            particle.rotation += 0.05;
        });
        
        // Calculate FPS
        frameCount++;
        const currentTime = performance.now();
        if (currentTime - lastTime >= 1000) {
            fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            frameCount = 0;
            lastTime = currentTime;
            
            updatePerformanceInfo.call(this);
        }
    }
    
    function updatePerformanceInfo() {
        fpsText.setText(`FPS: ${fps}`);
        
        // Memory info
        if (performance.memory) {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
            
            memoryText.setText(`Memory: ${usedMB}/${totalMB} MB (Limit: ${limitMB} MB)`);
        } else {
            memoryText.setText('Memory: Not available');
        }
        
        // Performance metrics
        const renderTime = Math.round(performance.now() % 1000);
        performanceText.setText(
            `Active Objects: ${particles.length}\n` +
            `Render Time: ${renderTime}ms\n` +
            `Device Pixel Ratio: ${window.devicePixelRatio}\n` +
            `Viewport: ${window.innerWidth}x${window.innerHeight}`
        );
        
        // Color code FPS
        if (fps >= 55) {
            fpsText.setFill('#2ecc71'); // Green
        } else if (fps >= 30) {
            fpsText.setFill('#f39c12'); // Orange
        } else {
            fpsText.setFill('#e74c3c'); // Red
        }
    }
    
    console.log('✅ Performance game initialized successfully!');
    return game;
}