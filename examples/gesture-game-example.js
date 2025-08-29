// Gesture & Touch Demo
export function initializeGame() {
    console.log('👆 Initializing Gesture Game Example...');
    
    const config = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#e74c3c',
        scene: {
            preload: preload,
            create: create,
            update: update
        }
    };
    
    const game = new Phaser.Game(config);
    let gestureText;
    let touchInfo;
    let circles = [];
    let lastTouch = { x: 0, y: 0, time: 0 };
    
    function preload() {
        // Create touch indicator
        this.add.graphics()
            .fillStyle(0xf39c12)
            .fillCircle(25, 25, 25)
            .generateTexture('touch-circle', 50, 50);
    }
    
    function create() {
        // Title
        this.add.text(20, 20, '👆 Gesture & Input Demo', {
            fontSize: '28px',
            fill: '#ffffff',
            fontWeight: 'bold'
        });
        
        gestureText = this.add.text(20, 70, 'Touch/Click anywhere to interact!', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        
        touchInfo = this.add.text(20, 100, '', {
            fontSize: '14px',
            fill: '#ffffff'
        });
        
        // Instructions
        this.add.text(20, 450, 'Gesture Recognition:', { fontSize: '18px', fill: '#ffffff', fontWeight: 'bold' });
        this.add.text(20, 480, '• Single tap/click: Create circle', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 500, '• Double tap: Change circle color', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 520, '• Touch and hold: Grow circle', { fontSize: '14px', fill: '#ffffff' });
        this.add.text(20, 540, '• Multi-touch: Create multiple circles', { fontSize: '14px', fill: '#ffffff' });
        
        // Input handlers
        this.input.on('pointerdown', handlePointerDown, this);
        this.input.on('pointerup', handlePointerUp, this);
        this.input.on('pointermove', handlePointerMove, this);
        
        // Keyboard for additional controls
        this.input.keyboard.on('keydown-SPACE', () => {
            clearAllCircles.call(this);
            gestureText.setText('All circles cleared!');
        });
        
        // Double-click detection
        this.input.on('pointerdown', (pointer) => {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastTouch.time;
            const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, lastTouch.x, lastTouch.y);
            
            if (timeDiff < 300 && distance < 50) {
                // Double tap detected
                handleDoubleTap.call(this, pointer);
            }
            
            lastTouch = { x: pointer.x, y: pointer.y, time: currentTime };
        });
    }
    
    function handlePointerDown(pointer) {
        createCircle.call(this, pointer.x, pointer.y);
        
        const touchType = pointer.pointerType || 'mouse';
        gestureText.setText(`${touchType.charAt(0).toUpperCase() + touchType.slice(1)} down at (${Math.round(pointer.x)}, ${Math.round(pointer.y)})`);
        
        updateTouchInfo.call(this, pointer);
    }
    
    function handlePointerUp(pointer) {
        gestureText.setText('Pointer released');
        updateTouchInfo.call(this, pointer);
    }
    
    function handlePointerMove(pointer) {
        if (pointer.isDown) {
            updateTouchInfo.call(this, pointer);
        }
    }
    
    function handleDoubleTap(pointer) {
        // Change color of circles near the tap
        circles.forEach(circle => {
            const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, circle.x, circle.y);
            if (distance < 100) {
                circle.setTint(Math.random() * 0xffffff);
            }
        });
        gestureText.setText('Double tap detected! Colors changed.');
    }
    
    function createCircle(x, y) {
        const circle = this.add.sprite(x, y, 'touch-circle');
        circle.setInteractive();
        
        // Add some animation
        this.tweens.add({
            targets: circle,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 200,
            yoyo: true,
            ease: 'Power2'
        });
        
        // Long press detection
        let holdTimer = setTimeout(() => {
            // Grow the circle on long press
            this.tweens.add({
                targets: circle,
                scaleX: 2,
                scaleY: 2,
                duration: 500,
                ease: 'Power2'
            });
            gestureText.setText('Long press detected! Circle grown.');
        }, 500);
        
        circle.on('pointerup', () => {
            clearTimeout(holdTimer);
        });
        
        circles.push(circle);
        
        // Limit circles to prevent memory issues
        if (circles.length > 20) {
            const oldCircle = circles.shift();
            oldCircle.destroy();
        }
    }
    
    function updateTouchInfo(pointer) {
        const pressure = pointer.pressure || 'N/A';
        const tiltX = pointer.tiltX || 'N/A';
        const tiltY = pointer.tiltY || 'N/A';
        
        touchInfo.setText(
            `Pointer ID: ${pointer.id} | Type: ${pointer.pointerType || 'mouse'}\n` +
            `Position: (${Math.round(pointer.x)}, ${Math.round(pointer.y)})\n` +
            `Pressure: ${pressure} | Tilt: (${tiltX}, ${tiltY})\n` +
            `Buttons: ${pointer.buttons} | Active circles: ${circles.length}`
        );
    }
    
    function clearAllCircles() {
        circles.forEach(circle => circle.destroy());
        circles = [];
    }
    
    function update() {
        // Animate circles
        circles.forEach(circle => {
            circle.rotation += 0.01;
        });
    }
    
    console.log('✅ Gesture game initialized successfully!');
    return game;
}