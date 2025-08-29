import Phaser from 'phaser'
import { ResponsiveBreakpoints, GameEvents } from '../types'
import { EventBus } from '../utils/EventBus'

/**
 * Responsive Manager for handling different screen sizes
 */
export class ResponsiveManager {
  private game: Phaser.Game
  private eventBus: EventBus
  private breakpoints: ResponsiveBreakpoints
  private currentBreakpoint: 'mobile' | 'tablet' | 'desktop'
  private orientation: 'portrait' | 'landscape'

  constructor(game: Phaser.Game, breakpoints?: ResponsiveBreakpoints) {
    this.game = game
    this.eventBus = EventBus.getInstance()
    this.breakpoints = breakpoints || {
      mobile: 768,
      tablet: 1024,
      desktop: 1440
    }
    
    this.currentBreakpoint = this.getBreakpoint()
    this.orientation = this.getOrientation()
    
    this.setupListeners()
    this.checkOrientation()
  }

  /**
   * Setup resize and orientation listeners
   */
  private setupListeners(): void {
    window.addEventListener('resize', this.handleResize.bind(this))
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this))
    
    // Also listen to Phaser's resize event
    this.game.scale.on('resize', this.handleResize.bind(this))
  }

  /**
   * Handle resize event
   */
  private handleResize(): void {
    const newBreakpoint = this.getBreakpoint()
    const newOrientation = this.getOrientation()
    
    if (newBreakpoint !== this.currentBreakpoint) {
      this.currentBreakpoint = newBreakpoint
      this.eventBus.emit('responsive:breakpoint-change', {
        breakpoint: newBreakpoint,
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    if (newOrientation !== this.orientation) {
      this.orientation = newOrientation
      this.eventBus.emit(GameEvents.ORIENTATION_CHANGE, {
        orientation: newOrientation
      })
    }
  }

  /**
   * Handle orientation change
   */
  private handleOrientationChange(): void {
    this.checkOrientation()
    this.handleResize()
  }

  /**
   * Get current breakpoint
   */
  getBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth
    
    if (width < this.breakpoints.mobile) {
      return 'mobile'
    } else if (width < this.breakpoints.tablet) {
      return 'tablet'
    }
    return 'desktop'
  }

  /**
   * Get current orientation
   */
  getOrientation(): 'portrait' | 'landscape' {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  /**
   * Check and handle orientation
   */
  private checkOrientation(): void {
    this.orientation = this.getOrientation()
    
    // Emit orientation event
    this.eventBus.emit(GameEvents.ORIENTATION_CHANGE, {
      orientation: this.orientation
    })
  }

  /**
   * Is mobile device
   */
  isMobile(): boolean {
    return this.currentBreakpoint === 'mobile' || this.isTouchDevice()
  }

  /**
   * Is tablet device
   */
  isTablet(): boolean {
    return this.currentBreakpoint === 'tablet'
  }

  /**
   * Is desktop device
   */
  isDesktop(): boolean {
    return this.currentBreakpoint === 'desktop'
  }

  /**
   * Is portrait orientation
   */
  isPortrait(): boolean {
    return this.orientation === 'portrait'
  }

  /**
   * Is landscape orientation
   */
  isLandscape(): boolean {
    return this.orientation === 'landscape'
  }

  /**
   * Check if touch device
   */
  isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  /**
   * Get responsive scale factor
   */
  getScaleFactor(): number {
    switch (this.currentBreakpoint) {
      case 'mobile':
        return 0.75
      case 'tablet':
        return 0.9
      case 'desktop':
      default:
        return 1
    }
  }

  /**
   * Get responsive font size
   */
  getFontSize(baseSize: number): number {
    return Math.round(baseSize * this.getScaleFactor())
  }

  /**
   * Get responsive padding
   */
  getPadding(basePadding: number): number {
    return Math.round(basePadding * this.getScaleFactor())
  }

  /**
   * Create orientation lock screen
   */
  createOrientationLockScreen(scene: Phaser.Scene, preferredOrientation: 'portrait' | 'landscape'): Phaser.GameObjects.Container | null {
    if (this.orientation === preferredOrientation) {
      return null
    }
    
    const container = scene.add.container(0, 0)
    
    // Background
    const bg = scene.add.rectangle(
      scene.scale.width / 2,
      scene.scale.height / 2,
      scene.scale.width,
      scene.scale.height,
      0x000000,
      0.9
    )
    
    // Message
    const message = scene.add.text(
      scene.scale.width / 2,
      scene.scale.height / 2,
      `Please rotate your device to ${preferredOrientation} mode`,
      {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5)
    
    // Icon (placeholder)
    const icon = scene.add.text(
      scene.scale.width / 2,
      scene.scale.height / 2 - 60,
      preferredOrientation === 'landscape' ? '📱↻' : '📱',
      {
        fontSize: '48px'
      }
    ).setOrigin(0.5)
    
    container.add([bg, icon, message])
    container.setDepth(Number.MAX_SAFE_INTEGER)
    
    // Auto-hide when orientation changes
    this.eventBus.once(GameEvents.ORIENTATION_CHANGE, () => {
      if (this.orientation === preferredOrientation) {
        container.destroy()
      }
    })
    
    return container
  }

  /**
   * Destroy responsive manager
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this))
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this))
    this.game.scale.off('resize', this.handleResize.bind(this))
  }
}