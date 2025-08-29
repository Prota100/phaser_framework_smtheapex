/**
 * Advanced Features Demo - TypeScript Edition
 * Comprehensive showcase with RxJS, state management, and modern patterns
 */

import * as Phaser from 'phaser';
import { fromEvent, interval, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime, take, switchMap } from 'rxjs/operators';

interface GameState {
    score: number;
    level: number;
    lives: number;
    powerUps: string[];
    gameTime: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: number;
}

class AdvancedScene extends Phaser.Scene {
    private gameState$ = new BehaviorSubject<GameState>({
        score: 0,
        level: 1,
        lives: 3,
        powerUps: [],
        gameTime: 0
    });

    private player!: Phaser.GameObjects.Rectangle;
    private enemies: Phaser.GameObjects.Rectangle[] = [];
    private particles: Particle[] = [];
    private uiText!: Phaser.GameObjects.Text;
    private performanceText!: Phaser.GameObjects.Text;
    private particleGraphics!: Phaser.GameObjects.Graphics;

    private keys!: Phaser.Types.Input.Keyboard.CursorKeys;
    private fpsCounter: number = 0;
    private frameCount: number = 0;
    private lastFpsUpdate: number = 0;

    constructor() {
        super({ key: 'AdvancedScene' });
    }

    create(): void {
        // Title
        this.add.text(20, 20, '🚀 Advanced Features Demo', {
            fontSize: '24px',
            color: '#ffffff'
        });

        // Initialize game objects
        this.createPlayer();
        this.createUI();
        this.setupInput();
        this.initializeRxJS();

        // Particle graphics
        this.particleGraphics = this.add.graphics();

        console.log('✅ Advanced Demo with RxJS state management initialized!');
    }

    private createPlayer(): void {
        this.player = this.add.rectangle(400, 500, 40, 40, 0x00ff00);
        this.player.setInteractive();

        // Player click effect
        this.player.on('pointerdown', () => {
            this.createParticleExplosion(this.player.x, this.player.y, 0x00ff00);
            this.updateGameState({ score: this.gameState$.value.score + 10 });
        });
    }

    private createUI(): void {
        this.uiText = this.add.text(20, 60, '', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'monospace'
        });

        this.performanceText = this.add.text(600, 20, '', {
            fontSize: '14px',
            color: '#ffff00',
            fontFamily: 'monospace'
        });

        // Instructions
        const instructions = [
            'Features Showcase:',
            '• RxJS State Management',
            '• Real-time Performance Monitoring', 
            '• Particle System (1000+ particles)',
            '• Reactive Input Handling',
            '• Advanced Game Loop',
            '• Memory Management',
            '',
            'Controls: Arrow Keys, Click Player'
        ];

        instructions.forEach((line, index) => {
            this.add.text(20, 150 + index * 18, line, {
                fontSize: '14px',
                color: index === 0 ? '#ffffff' : '#cccccc'
            });
        });
    }

    private setupInput(): void {
        this.keys = this.input.keyboard!.createCursorKeys();

        // RxJS input streams
        const keyStream$ = fromEvent(document, 'keydown').pipe(
            map((event: any) => event.code),
            filter(code => ['Space', 'Enter', 'KeyR'].includes(code)),
            debounceTime(100)
        );

        keyStream$.subscribe(keyCode => {
            switch (keyCode) {
                case 'Space':
                    this.spawnEnemy();
                    break;
                case 'Enter':
                    this.createParticleExplosion(
                        Phaser.Math.Between(100, 700), 
                        Phaser.Math.Between(100, 500),
                        Phaser.Math.Between(0x000000, 0xffffff)
                    );
                    break;
                case 'KeyR':
                    this.resetGame();
                    break;
            }
        });
    }

    private initializeRxJS(): void {
        // Game timer
        const gameTimer$ = interval(1000);
        
        // Performance monitoring
        const performanceTimer$ = interval(100);

        // Combine state updates
        combineLatest([this.gameState$, gameTimer$]).subscribe(([state, tick]) => {
            this.updateUI(state);
        });

        // Performance monitoring
        performanceTimer$.subscribe(() => {
            this.updatePerformanceMetrics();
        });

        // Auto-spawn enemies
        interval(2000).subscribe(() => {
            if (this.enemies.length < 5) {
                this.spawnEnemy();
            }
        });

        // Level progression
        this.gameState$.pipe(
            map(state => state.score),
            filter(score => score > 0 && score % 100 === 0)
        ).subscribe(score => {
            const newLevel = Math.floor(score / 100) + 1;
            this.updateGameState({ level: newLevel });
            this.createParticleExplosion(400, 300, 0xffd700);
        });
    }

    update(): void {
        this.frameCount++;
        
        // Player movement
        if (this.keys.left.isDown) {
            this.player.x = Math.max(20, this.player.x - 4);
        }
        if (this.keys.right.isDown) {
            this.player.x = Math.min(780, this.player.x + 4);
        }
        if (this.keys.up.isDown) {
            this.player.y = Math.max(20, this.player.y - 4);
        }
        if (this.keys.down.isDown) {
            this.player.y = Math.min(580, this.player.y + 4);
        }

        // Update enemies
        this.updateEnemies();

        // Update particles
        this.updateParticles();

        // Check collisions
        this.checkCollisions();

        // Update game time
        this.updateGameState({ 
            gameTime: this.gameState$.value.gameTime + this.game.loop.delta 
        });
    }

    private updateEnemies(): void {
        this.enemies.forEach((enemy, index) => {
            enemy.y += 2 + this.gameState$.value.level * 0.5;
            
            if (enemy.y > 620) {
                enemy.destroy();
                this.enemies.splice(index, 1);
                this.updateGameState({ 
                    lives: Math.max(0, this.gameState$.value.lives - 1) 
                });
            }
        });
    }

    private updateParticles(): void {
        this.particleGraphics.clear();

        this.particles.forEach((particle, index) => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // Gravity
            particle.life -= 0.02;

            if (particle.life > 0) {
                const alpha = particle.life;
                this.particleGraphics.fillStyle(particle.color, alpha);
                this.particleGraphics.fillCircle(particle.x, particle.y, 2);
            } else {
                this.particles.splice(index, 1);
            }
        });
    }

    private checkCollisions(): void {
        this.enemies.forEach((enemy, index) => {
            const distance = Math.sqrt(
                Math.pow(this.player.x - enemy.x, 2) + 
                Math.pow(this.player.y - enemy.y, 2)
            );

            if (distance < 30) {
                enemy.destroy();
                this.enemies.splice(index, 1);
                
                this.createParticleExplosion(enemy.x, enemy.y, 0xff0000);
                this.updateGameState({ 
                    score: this.gameState$.value.score + 50,
                    lives: Math.max(0, this.gameState$.value.lives - 1)
                });
            }
        });
    }

    private spawnEnemy(): void {
        const enemy = this.add.rectangle(
            Phaser.Math.Between(50, 750), 
            0, 
            30, 
            30, 
            0xff0000
        );
        this.enemies.push(enemy);
    }

    private createParticleExplosion(x: number, y: number, color: number): void {
        for (let i = 0; i < 30; i++) {
            const particle: Particle = {
                x: x,
                y: y,
                vx: Phaser.Math.Between(-5, 5),
                vy: Phaser.Math.Between(-10, -2),
                life: 1.0,
                color: color
            };
            this.particles.push(particle);
        }
    }

    private updateGameState(updates: Partial<GameState>): void {
        const currentState = this.gameState$.value;
        this.gameState$.next({ ...currentState, ...updates });
    }

    private updateUI(state: GameState): void {
        const timeSeconds = Math.floor(state.gameTime / 1000);
        
        this.uiText.setText(
            `Score: ${state.score}\n` +
            `Level: ${state.level}\n` +
            `Lives: ${state.lives}\n` +
            `Time: ${timeSeconds}s\n` +
            `Enemies: ${this.enemies.length}\n` +
            `Particles: ${this.particles.length}`
        );
    }

    private updatePerformanceMetrics(): void {
        const now = performance.now();
        
        if (now - this.lastFpsUpdate > 1000) {
            this.fpsCounter = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = now;
        }

        const memUsed = (performance as any).memory ? 
            Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) : 'N/A';

        this.performanceText.setText(
            `FPS: ${this.fpsCounter}\n` +
            `Objects: ${this.enemies.length + this.particles.length + 1}\n` +
            `Memory: ${memUsed}MB\n` +
            `Canvas: ${this.game.canvas.width}×${this.game.canvas.height}`
        );
    }

    private resetGame(): void {
        this.updateGameState({
            score: 0,
            level: 1,
            lives: 3,
            powerUps: [],
            gameTime: 0
        });

        this.enemies.forEach(enemy => enemy.destroy());
        this.enemies = [];
        this.particles = [];

        this.player.setPosition(400, 500);
        
        console.log('🔄 Game reset via RxJS state management');
    }
}

export function initializeGame(): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        backgroundColor: '#2c3e50',
        scene: AdvancedScene,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        fps: {
            target: 60,
            forceSetTimeOut: true
        }
    };

    const game = new Phaser.Game(config);
    console.log('✅ Advanced Demo with RxJS reactive patterns initialized!');
    
    return game;
}