import Phaser from 'phaser'
import UIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { FrameworkConfig } from '../types'
import { EventBus } from '../utils/EventBus'
import { ReactiveEventBus } from '../utils/ReactiveEventBus'
import { EnhancedResponsiveManager } from './EnhancedResponsiveManager'
import { EnhancedEmbedManager } from './EnhancedEmbedManager'
import { PWAManager } from '../mobile/PWAManager'

/**
 * Core Game Manager - Handles game initialization and lifecycle
 */
export class GameManager {
  private game: Phaser.Game | null = null
  private config: FrameworkConfig
  private eventBus: EventBus
  private reactiveEventBus: ReactiveEventBus
  private responsiveManager?: EnhancedResponsiveManager
  private embedManager?: EnhancedEmbedManager
  private pwaManager?: PWAManager

  constructor(config: FrameworkConfig) {
    this.config = this.mergeWithDefaults(config)
    this.eventBus = EventBus.getInstance()
    this.reactiveEventBus = ReactiveEventBus.getInstance()
  }

  /**
   * Initialize and start the game
   */
  async initialize(scenes: typeof Phaser.Scene[]): Promise<Phaser.Game> {
    // Setup render type based on environment
    const renderType = this.getRenderType()
    
    // Create Phaser configuration
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: renderType,
      width: this.config.game.width,
      height: this.config.game.height,
      parent: this.config.game.parent || 'game-container',
      backgroundColor: this.config.game.backgroundColor,
      scene: scenes,
      scale: this.config.game.scale || {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%',
        autoRound: true
      },
      dom: {
        createContainer: this.config.ui?.useDOMOverlay !== false
      },
      input: {
        mouse: {
          target: this.config.game.parent || 'game-container'
        },
        touch: {
          target: this.config.game.parent || 'game-container'
        }
      },
      render: {
        antialias: false,
        pixelArt: false,
        roundPixels: true
      },
      physics: this.config.game.physics,
      plugins: this.getPlugins(),
      callbacks: {
        postBoot: (game: Phaser.Game) => this.onGamePostBoot(game)
      }
    }

    // Clear container
    const container = document.querySelector(`#${this.config.game.parent || 'game-container'}`)
    if (container) {
      container.innerHTML = ''
    }

    // Create game instance
    this.game = new Phaser.Game(phaserConfig)
    
    // Store globally for debugging
    ;(window as any).game = this.game
    ;(window as any).frameworkConfig = this.config

    // Initialize enhanced responsive manager
    this.responsiveManager = new EnhancedResponsiveManager(this.game, this.config.ui?.responsiveBreakpoints as any)
    
    // Initialize enhanced embed manager
    this.embedManager = new EnhancedEmbedManager(this.game)
    
    // Initialize PWA manager
    if (this.config.mobile?.enablePWA) {
      this.pwaManager = new PWAManager()
      await this.pwaManager.initialize()
    }

    return this.game
  }

  /**
   * Enhanced render type detection for 2025
   */
  private getRenderType(): number {
    // Check for forced canvas mode
    if ((window as any).FORCE_CANVAS_RENDERING || sessionStorage.getItem('canvas-retry')) {
      console.log('🎮 Canvas forced mode')
      return Phaser.CANVAS
    }
    
    // Enhanced embed detection
    const isEmbedded = this.isEmbedded()
    const hasWebGL = this.detectWebGLSupport()
    
    if (isEmbedded) {
      // Use WebGL in embed mode if supported and parent allows it
      if (hasWebGL && this.canUseWebGLInEmbed()) {
        console.log('🎮 Embed mode: Using WebGL')
        return Phaser.WEBGL
      } else {
        console.log('🎮 Embed mode: Using Canvas fallback')
        return Phaser.CANVAS
      }
    }
    
    // Enhanced device detection
    if (this.isMobileDevice() && !hasWebGL) {
      console.log('🎮 Mobile mode: Using Canvas')
      return Phaser.CANVAS
    }
    
    // Default to AUTO for optimal selection
    console.log('🎮 Standalone mode: Using AUTO')
    return Phaser.AUTO
  }

  /**
   * Enhanced embed detection
   */
  private isEmbedded(): boolean {
    try {
      // Primary check
      if (window.self !== window.top) return true
      
      // Secondary checks
      if (document.referrer && new URL(document.referrer).hostname !== window.location.hostname) {
        return true
      }
      
      // Check for iframe element
      if (window.frameElement) return true
      
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('embed') === 'true') return true
      
      return false
    } catch (e) {
      return true // Cross-origin iframe
    }
  }
  
  /**
   * WebGL support detection
   */
  private detectWebGLSupport(): boolean {
    try {
      const canvas = document.createElement('canvas')
      return !!(window.WebGLRenderingContext && (
        canvas.getContext('webgl') || 
        canvas.getContext('experimental-webgl')
      ))
    } catch (e) {
      return false
    }
  }
  
  /**
   * Check if WebGL is allowed in embed context
   */
  private canUseWebGLInEmbed(): boolean {
    try {
      // Check iframe sandbox attributes
      const iframe = window.frameElement as HTMLIFrameElement
      if (iframe) {
        const sandbox = iframe.getAttribute('sandbox')
        return !sandbox || sandbox.includes('allow-scripts')
      }
      return true
    } catch (e) {
      return false // Cross-origin, assume restricted
    }
  }
  
  /**
   * Mobile device detection
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           navigator.maxTouchPoints > 0
  }

  /**
   * Get plugin configuration
   */
  private getPlugins(): any {
    const plugins: any = {}
    
    if (this.config.ui?.useRexUI !== false) {
      plugins.scene = [
        {
          key: 'rexUI',
          plugin: UIPlugin,
          mapping: 'rexUI'
        }
      ]
    }
    
    return plugins
  }

  /**
   * Called after game boots
   */
  private onGamePostBoot(game: Phaser.Game): void {
    // Ensure crisp rendering
    const canvas = game.canvas
    if (canvas) {
      canvas.style.imageRendering = 'crisp-edges'
    }
    
    // Emit ready event
    this.eventBus.emit('game:ready', game)
  }

  /**
   * Merge user config with defaults
   */
  private mergeWithDefaults(config: FrameworkConfig): FrameworkConfig {
    return {
      ...config,
      ui: {
        useRexUI: true,
        useDOMOverlay: true,
        ...config.ui
      },
      performance: {
        enableMonitoring: false,
        targetFPS: 60,
        autoOptimize: true,
        ...config.performance
      },
      mobile: {
        enablePWA: false,
        enableTouch: true,
        ...config.mobile
      },
      save: {
        storageKey: 'game-save',
        autoSaveInterval: 30000,
        compression: false,
        ...config.save
      }
    }
  }

  /**
   * Destroy game instance
   */
  destroy(): void {
    if (this.game) {
      this.game.destroy(true)
      this.game = null
    }
    
    if (this.responsiveManager) {
      this.responsiveManager.destroy()
    }
    
    if (this.embedManager) {
      this.embedManager.destroy()
    }
    
    if (this.pwaManager) {
      this.pwaManager.destroy()
    }
  }

  /**
   * Get game instance
   */
  getGame(): Phaser.Game | null {
    return this.game
  }

  /**
   * Get event bus
   */
  getEventBus(): EventBus {
    return this.eventBus
  }
}