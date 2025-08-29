import Phaser from 'phaser'
import type RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { RexUIScene, GameEvents } from '../types'
import { EventBus } from '../utils/EventBus'
import { AssetLoader } from '../utils/AssetLoader'

/**
 * Base Scene class with common functionality
 */
export abstract class BaseScene extends Phaser.Scene implements RexUIScene {
  rexUI!: RexUIPlugin
  protected eventBus: EventBus
  protected assetLoader: AssetLoader
  protected isReady: boolean = false

  constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
    super(config)
    this.eventBus = EventBus.getInstance()
    this.assetLoader = new AssetLoader(this)
  }

  /**
   * Preload assets - override in derived classes
   */
  preload(): void {
    // Setup loading events
    this.load.on('progress', (value: number) => {
      this.onLoadProgress(value)
    })
    
    this.load.on('complete', () => {
      this.onLoadComplete()
    })
  }

  /**
   * Create scene - override in derived classes
   */
  create(): void {
    this.isReady = true
    this.eventBus.emit(GameEvents.SCENE_READY, this.scene.key)
    
    // Setup common input handlers
    this.setupInputHandlers()
    
    // Setup resize handler
    this.scale.on('resize', this.onResize, this)
  }

  /**
   * Update loop - override in derived classes
   */
  update(time: number, delta: number): void {
    // Override in derived classes
  }

  /**
   * Called when assets are loading
   */
  protected onLoadProgress(progress: number): void {
    // Override for custom loading UI
  }

  /**
   * Called when all assets are loaded
   */
  protected onLoadComplete(): void {
    // Override for post-load setup
  }

  /**
   * Setup common input handlers
   */
  protected setupInputHandlers(): void {
    // ESC key for closing panels
    this.input.keyboard?.on('keydown-ESC', () => {
      this.eventBus.emit('input:escape')
    })
    
    // Outside click detection
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.eventBus.emit('input:outside-click', pointer)
    })
  }

  /**
   * Handle resize events
   */
  protected onResize(gameSize: Phaser.Structs.Size): void {
    const width = gameSize.width
    const height = gameSize.height
    
    this.eventBus.emit(GameEvents.RESIZE, { width, height })
    
    // Update camera
    this.cameras.main.setSize(width, height)
    
    // Override for custom resize handling
    this.handleResize(width, height)
  }

  /**
   * Custom resize handling - override in derived classes
   */
  protected handleResize(width: number, height: number): void {
    // Override in derived classes
  }

  /**
   * Transition to another scene
   */
  protected transitionTo(sceneKey: string, data?: any): void {
    this.eventBus.emit(GameEvents.SCENE_TRANSITION, {
      from: this.scene.key,
      to: sceneKey,
      data
    })
    
    this.scene.start(sceneKey, data)
  }

  /**
   * Create a fade transition effect
   */
  protected fadeTransition(callback: () => void, duration: number = 500): void {
    this.cameras.main.fadeOut(duration, 0, 0, 0)
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      callback()
      this.cameras.main.fadeIn(duration, 0, 0, 0)
    })
  }

  /**
   * Clean up resources
   */
  shutdown(): void {
    this.scale.off('resize', this.onResize, this)
    this.input.keyboard?.removeAllListeners()
    this.input.removeAllListeners()
  }

  /**
   * Destroy scene
   */
  destroy(): void {
    this.shutdown()
    // Note: Phaser scenes don't have a destroy method, they are destroyed by the scene manager
  }
}