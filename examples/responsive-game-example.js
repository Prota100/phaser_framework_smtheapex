// Responsive Design Demo
export function initializeGame() {
    console.log('📱 Initializing Responsive Game Example...');
    
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#3498db',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 600
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    const game = new Phaser.Game(config);
    let infoText;
    let deviceInfo;
    
    function preload() {
        // Create responsive elements
        this.add.graphics()
            .fillStyle(0xff6b6b)
            .fillRect(0, 0, 100, 100)
            .generateTexture('responsive-box', 100, 100);
    }
    
    function create() {
        // Title
        this.add.text(20, 20, '📱 Responsive & Embed Demo', {
            fontSize: '28px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        
        // Device detection
        const userAgent = navigator.userAgent;
        const isTouch = 'ontouchstart' in window;
        const isEmbedded = window.self !== window.top;
        
        let deviceType = 'Desktop';
        if (/iPhone|iPad|iPod/.test(userAgent)) deviceType = 'iOS';
        else if (/Android/.test(userAgent)) deviceType = 'Android';
        
        deviceInfo = this.add.text(20, 80, '', {
            fontSize: '16px',
            fill: '#ffffff',
            wordWrap: { width: 750 }
        });
        
        infoText = this.add.text(20, 200, '', {
            fontSize: '14px',
            fill: '#ffffff',
            wordWrap: { width: 750 }
        });
        
        // Create responsive boxes
        for (let i = 0; i < 5; i++) {
            const box = this.add.sprite(150 + i * 120, 300, 'responsive-box');
            box.setInteractive();
            box.on('pointerdown', () => {
                box.setTint(Math.random() * 0xffffff);
            });
        }
        
        // Add instructions
        this.add.text(20, 450, 'Instructions:', { fontSize: '18px', fill: '#ffffff', fontWeight: 'bold' });
        this.add.text(20, 480, '• Click/tap the red boxes to change colors', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 500, '• Resize the window to see responsive behavior', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 520, '• Try fullscreen mode using the button in the top-right', { fontSize: '14px', fill: '#ffffff' });
        
        updateInfo.call(this);
        
        // Update info on resize
        this.scale.on('resize', updateInfo, this);
    }
    
    function updateInfo() {
        const canvas = this.sys.game.canvas;
        const isFullscreen = document.fullscreenElement !== null;
        const isEmbedded = window.self !== window.top;
        
        deviceInfo.setText(
            `Device: ${navigator.platform} | Touch: ${('ontouchstart' in window) ? 'Yes' : 'No'} | Embedded: ${isEmbedded ? 'Yes' : 'No'}`
        );
        
        infoText.setText(
            `Canvas Size: ${canvas.width}x${canvas.height}\n` +
            `Window Size: ${window.innerWidth}x${window.innerHeight}\n` +
            `Device Pixel Ratio: ${window.devicePixelRatio}\n` +
            `Fullscreen: ${isFullscreen ? 'Yes' : 'No'}\n` +
            `Orientation: ${window.innerHeight > window.innerWidth ? 'Portrait' : 'Landscape'}`
        );
    }
    
    function create() {} // Placeholder for scene create
    function update() {} // Placeholder for scene update
    
    console.log('✅ Responsive game initialized successfully!');
    return game;
}