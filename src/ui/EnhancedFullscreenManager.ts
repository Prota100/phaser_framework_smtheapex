import { Observable, BehaviorSubject, fromEvent, merge } from 'rxjs'
import { map, filter, distinctUntilChanged } from 'rxjs/operators'
import { ReactiveEventBus } from '../utils/ReactiveEventBus'
import type { OrientationLockType } from '../core/EnhancedResponsiveManager'

// Extended screen interface for orientation API
interface ScreenOrientationAPI {
  lock?(orientation: OrientationLockType): Promise<void>
  unlock?(): void
  angle?: number
  type?: string
  addEventListener?(event: string, handler: () => void): void
  removeEventListener?(event: string, handler: () => void): void
}

interface ExtendedScreen {
  orientation?: ScreenOrientationAPI
  lockOrientation?: (orientation: OrientationLockType) => boolean
  unlockOrientation?: () => void
  width: number
  height: number
  availWidth: number
  availHeight: number
  colorDepth: number
  pixelDepth: number
}

export interface FullscreenState {
  isFullscreen: boolean
  isSupported: boolean
  canRequest: boolean
  element: Element | null
  mode: 'none' | 'game' | 'container' | 'document'
  orientation: 'any' | 'portrait' | 'landscape' | 'portrait-primary' | 'landscape-primary'
}

export interface FullscreenOptions {
  navigationUI?: 'auto' | 'hide' | 'show'
  lockOrientation?: OrientationLockType
  exitOnEscape?: boolean
  showControls?: boolean
}

/**
 * Enhanced Fullscreen Manager for 2025
 * Supports modern fullscreen API, orientation locking, and embed mode
 */
export class EnhancedFullscreenManager {
  private eventBus: ReactiveEventBus
  private game: Phaser.Game
  private gameContainer: HTMLElement | null
  
  // State management
  private fullscreenState$ = new BehaviorSubject<FullscreenState>(this.getInitialState())
  
  // API support detection
  private readonly fullscreenAPI = this.detectFullscreenAPI()
  private readonly orientationAPI = this.detectOrientationAPI()
  
  // Controls
  private fullscreenButton: HTMLElement | null = null
  private exitButton: HTMLElement | null = null

  constructor(game: Phaser.Game) {
    this.game = game
    this.eventBus = ReactiveEventBus.getInstance()
    this.gameContainer = document.getElementById(game.config.parent as string) || game.canvas.parentElement
    
    this.initializeFullscreenSystem()
  }

  /**
   * Initialize fullscreen system
   */
  private initializeFullscreenSystem(): void {
    if (!this.fullscreenAPI.supported) {
      console.warn('Fullscreen API not supported')
      return
    }

    this.setupFullscreenListeners()
    this.createFullscreenControls()
    this.handleEmbedMode()
  }

  /**
   * Detect fullscreen API support and methods
   */
  private detectFullscreenAPI() {
    const doc = document as any
    const elem = document.documentElement as any
    
    if (elem.requestFullscreen) {
      return {
        supported: true,
        request: 'requestFullscreen',
        exit: 'exitFullscreen',
        element: 'fullscreenElement',
        enabled: 'fullscreenEnabled',
        change: 'fullscreenchange',
        error: 'fullscreenerror'
      }
    } else if (elem.webkitRequestFullscreen) {
      return {
        supported: true,
        request: 'webkitRequestFullscreen',
        exit: 'webkitExitFullscreen',
        element: 'webkitFullscreenElement',
        enabled: 'webkitFullscreenEnabled',
        change: 'webkitfullscreenchange',
        error: 'webkitfullscreenerror'
      }
    } else if (elem.mozRequestFullScreen) {
      return {
        supported: true,
        request: 'mozRequestFullScreen',
        exit: 'mozCancelFullScreen',
        element: 'mozFullScreenElement',
        enabled: 'mozFullScreenEnabled',
        change: 'mozfullscreenchange',
        error: 'mozfullscreenerror'
      }
    } else if (elem.msRequestFullscreen) {
      return {
        supported: true,
        request: 'msRequestFullscreen',
        exit: 'msExitFullscreen',
        element: 'msFullscreenElement',
        enabled: 'msFullscreenEnabled',
        change: 'MSFullscreenChange',
        error: 'MSFullscreenError'
      }
    } else {
      return {
        supported: false,
        request: null,
        exit: null,
        element: null,
        enabled: null,
        change: null,
        error: null
      }
    }
  }

  /**
   * Detect orientation API support
   */
  private detectOrientationAPI() {
    const screenWithOrientation = screen as ExtendedScreen
    
    if ('orientation' in screen && screenWithOrientation.orientation?.lock) {
      return {
        supported: true,
        lock: screenWithOrientation.orientation.lock.bind(screenWithOrientation.orientation),
        unlock: screenWithOrientation.orientation.unlock?.bind(screenWithOrientation.orientation),
        type: () => screenWithOrientation.orientation?.type || 'unknown',
        angle: () => screenWithOrientation.orientation?.angle || 0
      }
    } else if (screenWithOrientation.lockOrientation) {
      return {
        supported: true,
        lock: (orientation: OrientationLockType) => {
          try {
            return Promise.resolve(screenWithOrientation.lockOrientation!(orientation))
          } catch (e) {
            return Promise.reject(e)
          }
        },
        unlock: () => screenWithOrientation.unlockOrientation?.(),
        type: () => 'unknown',
        angle: () => 0
      }
    } else {
      return {
        supported: false,
        lock: null,
        unlock: null,
        type: null,
        angle: null
      }
    }
  }

  /**
   * Setup fullscreen event listeners
   */
  private setupFullscreenListeners(): void {
    if (!this.fullscreenAPI.supported) return

    // Fullscreen change events
    if (this.fullscreenAPI.change) {
      document.addEventListener(this.fullscreenAPI.change, () => {
        this.updateFullscreenState()
      })
    }

    // Fullscreen error events
    if (this.fullscreenAPI.error) {
      document.addEventListener(this.fullscreenAPI.error, (event) => {
        console.error('Fullscreen error:', event)
        this.eventBus.emit('fullscreen:error', event)
      })
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F11') {
        event.preventDefault()
        this.toggleFullscreen()
      } else if (event.key === 'Escape' && this.isFullscreen()) {
        // Let browser handle escape by default
        this.eventBus.emit('fullscreen:escapePressed')
      }
    })

    // Handle orientation changes in fullscreen
    if (this.orientationAPI.supported) {
      const screenWithOrientation = screen as ExtendedScreen
      if (screenWithOrientation.orientation?.addEventListener) {
        screenWithOrientation.orientation.addEventListener('change', () => {
          if (this.isFullscreen()) {
            this.updateFullscreenState()
          }
        })
      }
    }
  }

  /**
   * Create fullscreen control UI
   */
  private createFullscreenControls(): void {
    if (!this.gameContainer) return

    // Create fullscreen button
    this.fullscreenButton = this.createControlButton('fullscreen', '⛶', 'Enter Fullscreen')
    this.fullscreenButton.addEventListener('click', () => this.requestFullscreen())

    // Create exit button (shown only in fullscreen)
    this.exitButton = this.createControlButton('exit-fullscreen', '⛶', 'Exit Fullscreen')
    this.exitButton.addEventListener('click', () => this.exitFullscreen())
    this.exitButton.style.display = 'none'

    // Position controls
    this.positionControls()
    
    // Update control visibility based on state
    this.fullscreenState$.subscribe(state => {
      this.updateControlVisibility(state)
    })
  }

  private createControlButton(id: string, content: string, title: string): HTMLElement {
    const button = document.createElement('button')
    button.id = `phaser-${id}-btn`
    button.innerHTML = content
    button.title = title
    button.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.7);
      border: none;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s ease;
      user-select: none;
    `
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(0, 0, 0, 0.9)'
    })
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.7)'
    })

    this.gameContainer!.appendChild(button)
    return button
  }

  private positionControls(): void {
    if (!this.gameContainer) return

    // Ensure container has relative positioning
    const computedStyle = window.getComputedStyle(this.gameContainer)
    if (computedStyle.position === 'static') {
      this.gameContainer.style.position = 'relative'
    }
  }

  private updateControlVisibility(state: FullscreenState): void {
    if (!this.fullscreenButton || !this.exitButton) return

    if (state.isSupported && state.canRequest) {
      if (state.isFullscreen) {
        this.fullscreenButton.style.display = 'none'
        this.exitButton.style.display = 'block'
      } else {
        this.fullscreenButton.style.display = 'block'
        this.exitButton.style.display = 'none'
      }
    } else {
      this.fullscreenButton.style.display = 'none'
      this.exitButton.style.display = 'none'
    }
  }

  /**
   * Handle embed mode restrictions
   */
  private handleEmbedMode(): void {
    // Check if we're in an embed that allows fullscreen
    try {
      const iframe = window.frameElement as HTMLIFrameElement
      if (iframe && !iframe.allowFullscreen) {
        // Disable fullscreen in restricted embed
        const state = this.fullscreenState$.value
        this.fullscreenState$.next({
          ...state,
          canRequest: false
        })
        
        this.eventBus.emit('fullscreen:restrictedEmbed')
      }
    } catch (e) {
      // Cross-origin iframe, assume restricted
      const state = this.fullscreenState$.value
      this.fullscreenState$.next({
        ...state,
        canRequest: false
      })
    }
  }

  /**
   * Request fullscreen mode
   */
  async requestFullscreen(options: FullscreenOptions = {}): Promise<boolean> {
    if (!this.fullscreenAPI.supported || !this.fullscreenAPI.request) {
      return false
    }

    const element = this.gameContainer || document.documentElement
    
    try {
      // Request fullscreen
      const fullscreenOptions: any = {}
      
      if (options.navigationUI) {
        fullscreenOptions.navigationUI = options.navigationUI
      }

      await (element as any)[this.fullscreenAPI.request](fullscreenOptions)
      
      // Lock orientation if requested
      if (options.lockOrientation && this.orientationAPI.supported) {
        try {
          await this.orientationAPI.lock!(options.lockOrientation)
        } catch (orientationError) {
          console.warn('Orientation lock failed:', orientationError)
        }
      }
      
      this.eventBus.emit('fullscreen:entered', {
        element,
        options
      })
      
      return true
    } catch (error) {
      console.error('Fullscreen request failed:', error)
      this.eventBus.emit('fullscreen:requestFailed', error)
      return false
    }
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen(): Promise<boolean> {
    if (!this.fullscreenAPI.supported || !this.fullscreenAPI.exit) {
      return false
    }

    try {
      await (document as any)[this.fullscreenAPI.exit]()
      
      // Unlock orientation
      if (this.orientationAPI.supported && this.orientationAPI.unlock) {
        this.orientationAPI.unlock()
      }
      
      this.eventBus.emit('fullscreen:exited')
      return true
    } catch (error) {
      console.error('Exit fullscreen failed:', error)
      this.eventBus.emit('fullscreen:exitFailed', error)
      return false
    }
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen(options?: FullscreenOptions): Promise<boolean> {
    return this.isFullscreen() 
      ? await this.exitFullscreen() 
      : await this.requestFullscreen(options)
  }

  /**
   * Lock orientation in fullscreen
   */
  async lockOrientation(orientation: OrientationLockType): Promise<boolean> {
    if (!this.orientationAPI.supported || !this.orientationAPI.lock) {
      return false
    }

    try {
      await this.orientationAPI.lock(orientation)
      this.updateFullscreenState()
      this.eventBus.emit('fullscreen:orientationLocked', { orientation })
      return true
    } catch (error) {
      console.warn('Orientation lock failed:', error)
      return false
    }
  }

  /**
   * Unlock orientation
   */
  unlockOrientation(): void {
    if (this.orientationAPI.supported && this.orientationAPI.unlock) {
      this.orientationAPI.unlock()
      this.updateFullscreenState()
      this.eventBus.emit('fullscreen:orientationUnlocked')
    }
  }

  /**
   * Update fullscreen state
   */
  private updateFullscreenState(): void {
    const element = this.getFullscreenElement()
    const isFullscreen = !!element
    
    const newState: FullscreenState = {
      isFullscreen,
      isSupported: this.fullscreenAPI.supported,
      canRequest: this.canRequestFullscreen(),
      element,
      mode: this.getFullscreenMode(element),
      orientation: this.getCurrentOrientation()
    }

    this.fullscreenState$.next(newState)
    
    // Update game scale if needed
    if (isFullscreen !== this.fullscreenState$.value.isFullscreen) {
      this.handleFullscreenChange(isFullscreen)
    }
  }

  private getFullscreenElement(): Element | null {
    if (!this.fullscreenAPI.supported || !this.fullscreenAPI.element) {
      return null
    }
    
    return (document as any)[this.fullscreenAPI.element] || null
  }

  private canRequestFullscreen(): boolean {
    if (!this.fullscreenAPI.supported || !this.fullscreenAPI.enabled) {
      return false
    }
    
    return (document as any)[this.fullscreenAPI.enabled] === true
  }

  private getFullscreenMode(element: Element | null): FullscreenState['mode'] {
    if (!element) return 'none'
    
    if (element === this.gameContainer) return 'container'
    if (element === this.game.canvas) return 'game'
    if (element === document.documentElement) return 'document'
    
    return 'none'
  }

  private getCurrentOrientation(): FullscreenState['orientation'] {
    if (this.orientationAPI.supported && this.orientationAPI.type) {
      return this.orientationAPI.type() as FullscreenState['orientation']
    }
    
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  }

  private handleFullscreenChange(isFullscreen: boolean): void {
    if (isFullscreen) {
      // Entering fullscreen
      this.optimizeForFullscreen()
    } else {
      // Exiting fullscreen
      this.restoreFromFullscreen()
    }

    // Trigger game resize
    if (this.game.scale) {
      this.game.scale.refresh()
    }
  }

  private optimizeForFullscreen(): void {
    // Hide scrollbars
    document.body.style.overflow = 'hidden'
    
    // Maximize game container
    if (this.gameContainer) {
      this.gameContainer.style.width = '100vw'
      this.gameContainer.style.height = '100vh'
    }
    
    // Boost performance for fullscreen
    this.eventBus.emit('performance:setFullscreenMode', true)
  }

  private restoreFromFullscreen(): void {
    // Restore scrollbars
    document.body.style.overflow = ''
    
    // Restore game container size
    if (this.gameContainer) {
      this.gameContainer.style.width = ''
      this.gameContainer.style.height = ''
    }
    
    // Restore normal performance
    this.eventBus.emit('performance:setFullscreenMode', false)
  }

  private getInitialState(): FullscreenState {
    return {
      isFullscreen: false,
      isSupported: this.fullscreenAPI.supported,
      canRequest: false,
      element: null,
      mode: 'none',
      orientation: 'any'
    }
  }

  /**
   * Public API
   */
  getFullscreenState(): Observable<FullscreenState> {
    return this.fullscreenState$.asObservable().pipe(distinctUntilChanged())
  }

  getCurrentFullscreenState(): FullscreenState {
    return this.fullscreenState$.value
  }

  isFullscreen(): boolean {
    return this.fullscreenState$.value.isFullscreen
  }

  isSupported(): boolean {
    return this.fullscreenState$.value.isSupported
  }

  canRequest(): boolean {
    return this.fullscreenState$.value.canRequest
  }

  /**
   * Mobile-specific methods
   */
  async requestMobileFullscreen(): Promise<boolean> {
    if (!this.isMobileDevice()) {
      return this.requestFullscreen()
    }

    // Mobile-specific fullscreen with orientation lock
    const options: FullscreenOptions = {
      navigationUI: 'hide',
      lockOrientation: window.innerWidth > window.innerHeight 
        ? 'landscape-primary' 
        : 'portrait-primary'
    }

    return this.requestFullscreen(options)
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           navigator.maxTouchPoints > 0
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Remove event listeners
    if (this.fullscreenAPI.supported && this.fullscreenAPI.change) {
      document.removeEventListener(this.fullscreenAPI.change, this.updateFullscreenState)
    }
    if (this.fullscreenAPI.supported && this.fullscreenAPI.error) {
      document.removeEventListener(this.fullscreenAPI.error, () => {})
    }

    // Remove control buttons
    if (this.fullscreenButton) {
      this.fullscreenButton.remove()
    }
    if (this.exitButton) {
      this.exitButton.remove()
    }

    // Exit fullscreen if active
    if (this.isFullscreen()) {
      this.exitFullscreen()
    }

    this.fullscreenState$.complete()
  }
}