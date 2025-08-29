import {
  GameManager,
  GameStateManager,
  ReactiveEventBus,
  GestureManager,
  AdaptiveRenderer,
  ReactiveAudioManager,
  FrameworkConfig
} from '../src/index'

/**
 * Advanced H5 Mobile Game Example
 * Demonstrates all new reactive features with RxJS integration
 */

// Game configuration optimized for mobile
const gameConfig: FrameworkConfig = {
  game: {
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%'
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 300 },
        debug: false
      }
    }
  },
  ui: {
    useRexUI: true,
    useDOMOverlay: true,
    responsiveBreakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    }
  },
  mobile: {
    enablePWA: true,
    enableTouch: true
  },
  performance: {
    enableMonitoring: true,
    targetFPS: 60,
    autoOptimize: true
  }
}

// Main Game Scene with reactive patterns
class ReactiveGameScene extends Phaser.Scene {
  private eventBus!: ReactiveEventBus
  private gameState!: GameStateManager
  private gestureManager!: GestureManager
  private adaptiveRenderer!: AdaptiveRenderer
  private audioManager!: ReactiveAudioManager
  
  private player!: Phaser.Physics.Arcade.Sprite
  private enemies: Phaser.Physics.Arcade.Group[] = []
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter

  constructor() {
    super({ key: 'ReactiveGame' })
  }

  create() {
    // Initialize reactive systems
    this.initializeReactiveSystems()
    
    // Create game objects
    this.createGameWorld()
    
    // Setup reactive patterns
    this.setupReactivePatterns()
    
  }

  private initializeReactiveSystems() {
    this.eventBus = ReactiveEventBus.getInstance()
    this.gameState = GameStateManager.getInstance()
    this.gestureManager = new GestureManager(this.game.canvas)
    this.adaptiveRenderer = new AdaptiveRenderer(this.game)
    this.audioManager = new ReactiveAudioManager(this.game)

    // Load initial game state
    this.gameState.loadFromStorage()
  }

  private createGameWorld() {
    // Create player
    this.player = this.physics.add.sprite(400, 300, 'player')
    this.player.setCollideWorldBounds(true)
    this.player.setBounce(0.2)

    // Create enemy group
    const enemyGroup = this.physics.add.group()
    this.enemies.push(enemyGroup)

    // Create particle system
    this.particles = this.add.particles(0, 0, 'spark', {
      speed: { min: 50, max: 100 },
      scale: { start: 0.5, end: 0 },
      lifespan: 600
    })

    // Setup collisions
    this.physics.add.collider(this.player, enemyGroup, this.handlePlayerEnemyCollision.bind(this))
  }

  private setupReactivePatterns() {
    // 1. Gesture-based controls
    this.gestureManager.onGesture('swipe').subscribe(gesture => {
      const direction = gesture.data.direction
      const velocity = gesture.data.velocity
      
      switch (direction) {
        case 'left':
          this.player.setVelocityX(-200 * velocity)
          break
        case 'right':
          this.player.setVelocityX(200 * velocity)
          break
        case 'up':
          this.player.setVelocityY(-300)
          break
      }
      
      this.eventBus.emit('player:swipe', { direction, velocity })
    })

    this.gestureManager.onGesture('tap').subscribe(gesture => {
      const tapPosition = gesture.data.position
      this.createProjectile(this.player.x, this.player.y, tapPosition)
      
      // Play SFX with spatial audio
      this.audioManager.playSFX('shoot', {
        volume: 0.8,
        position: { x: this.player.x, y: this.player.y }
      })
    })

    this.gestureManager.onGesture('double-tap').subscribe(() => {
      this.activateSpecialAbility()
    })

    this.gestureManager.onGesture('long-press').subscribe(() => {
      this.showRadialMenu()
    })

    // 2. Health monitoring with reactions
    this.gameState.selectPlayerHealth().subscribe(health => {
      if (health.percentage < 20) {
        // Low health effects
        this.cameras.main.setTint(0xff6666)
        this.audioManager.playSFX('heartbeat', { volume: 0.5 })
        
        // Show warning notification
        this.gameState.addNotification({
          type: 'warning',
          message: 'Health Critical!'
        })
      } else {
        this.cameras.main.clearTint()
      }
    })

    // 3. Score streak detection
    this.eventBus.createStreakDetector('enemy:killed', 5).subscribe(streak => {
      console.log(`Streak: ${streak}!`)
      
      // Unlock achievement
      this.gameState.unlockAchievement(`streak_${streak}`)
      
      // Play dynamic music layer
      this.audioManager.createDynamicMusic(['base_music', 'intense_layer'], {
        baseLayer: 'base_music'
      }).subscribe(({ addLayer }) => {
        addLayer('intense_layer')
      })
    })

    // 4. Performance-based adaptive quality
    this.adaptiveRenderer.getPerformanceMetrics().subscribe(metrics => {
      if (metrics.fps < 30) {
        // Reduce particle count
        this.particles.setQuantity(50)
        
        // Reduce enemy spawn rate
        this.eventBus.emit('game:reduceSpawnRate', 0.5)
      }
    })

    // 5. Performance-based enemy spawn adjustment
    this.adaptiveRenderer.getPerformanceMetrics().subscribe(metrics => {
      if (metrics.fps < 45) {
        this.eventBus.emit('enemies:reduceSpawnRate', 0.7)
      } else if (metrics.fps > 55) {
        this.eventBus.emit('enemies:increaseSpawnRate', 1.2)
      }
    })

    // 6. Dynamic audio based on game state
    this.gameState.select('scene').subscribe(scene => {
      if (scene === 'battle') {
        this.audioManager.playMusic('battle_theme', {
          crossfade: true,
          fadeIn: 2000
        })
      }
    })

    // 7. Auto-save on significant progress
    this.gameState.selectNested(state => ({
      level: state.player.level,
      score: state.progress.score
    })).subscribe(() => {
      this.gameState.saveToStorage()
    })

    // 8. Combo system with RxJS
    this.eventBus.combo(['attack', 'jump', 'attack'], 1500).subscribe(combo => {
      console.log('Combo executed!', combo)
      this.executeComboAttack()
    })

    // 9. Device orientation handling
    this.eventBus.orientationChange().subscribe(orientation => {
      if (orientation.orientation === 'landscape') {
        this.scale.setGameSize(800, 450)
      } else {
        this.scale.setGameSize(450, 800)
      }
    })

    // 10. Performance monitoring
    this.eventBus.createPerformanceMonitor().subscribe(perf => {
      this.gameState.updateState({
        performance: {
          ...this.gameState.getCurrentState().performance,
          fps: perf.fps,
          memory: perf.memory
        }
      })
    })
  }


  private createProjectile(fromX: number, fromY: number, target: {x: number, y: number}) {
    const projectile = this.physics.add.sprite(fromX, fromY, 'projectile')
    const angle = Phaser.Math.Angle.Between(fromX, fromY, target.x, target.y)
    
    projectile.setRotation(angle)
    this.physics.velocityFromAngle(angle * 180 / Math.PI, 300, projectile.body.velocity)
    
    // Auto-destroy after 2 seconds
    this.time.delayedCall(2000, () => {
      projectile.destroy()
    })
  }

  private activateSpecialAbility() {
    // Create screen effect
    this.cameras.main.flash(500, 255, 255, 255)
    
    // Emit particles
    this.particles.explode(20, this.player.x, this.player.y)
    
    // Play special sound
    this.audioManager.playSFX('special_ability', { volume: 1.0 })
    
    // Update game state
    this.gameState.updatePlayerMana(
      this.gameState.getCurrentState().player.mana - 10
    )
  }

  private showRadialMenu() {
    // Implementation would show a radial menu UI
    console.log('Showing radial menu')
    
    this.gameState.showModal('radial-menu')
    this.audioManager.playSFX('menu_open')
  }

  private executeComboAttack() {
    // Enhanced attack with combo multiplier
    this.cameras.main.shake(100, 0.02)
    this.particles.explode(50, this.player.x, this.player.y)
    
    // Add experience for combo
    this.gameState.addExperience(50)
    
    this.audioManager.playSFX('combo_attack', { volume: 1.2 })
  }

  private handlePlayerEnemyCollision(player: any, enemy: any) {
    // Damage player
    const currentHealth = this.gameState.getCurrentState().player.health
    this.gameState.updatePlayerHealth(currentHealth - 10)
    
    // Visual feedback
    this.cameras.main.flash(200, 255, 0, 0)
    
    // Audio feedback
    this.audioManager.playSFX('player_hit')
    
    // Destroy enemy
    enemy.destroy()
    
    // Emit event
    this.eventBus.emit('player:damaged', { damage: 10 })
  }


  update() {
    // Update player position in game state
    this.gameState.updatePlayerPosition(this.player.x, this.player.y)
  }

  destroy() {
    // Cleanup reactive systems
    this.gestureManager?.destroy()
    this.adaptiveRenderer?.destroy()
    this.audioManager?.destroy()
  }
}

// Initialize the game
async function initializeGame() {
  const gameManager = new GameManager(gameConfig)
  
  // Initialize game with reactive scene
  const game = await gameManager.initialize([ReactiveGameScene])
  
  console.log('🎮 Advanced Reactive Game initialized!')
  console.log('Features enabled:')
  console.log('- RxJS Reactive Event System ✅')
  console.log('- Advanced Gesture Recognition ✅')
  console.log('- Adaptive Performance Rendering ✅')
  console.log('- Spatial Audio System ✅')
  console.log('- Cross-platform Mobile Optimization ✅')
  
  return game
}

// Export for use
export { initializeGame, ReactiveGameScene }