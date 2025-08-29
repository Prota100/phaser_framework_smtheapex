import { Observable, BehaviorSubject, fromEvent, merge } from 'rxjs'
import { map, filter, distinctUntilChanged, throttleTime } from 'rxjs/operators'
import { ReactiveEventBus } from '../utils/ReactiveEventBus'

export interface EmbedContext {
  isEmbedded: boolean
  parentOrigin: string | null
  embedType: 'iframe' | 'webview' | 'standalone'
  allowFullscreen: boolean
  allowAutoplay: boolean
  allowOrientationLock: boolean
  parentSize: { width: number, height: number } | null
  restrictions: {
    noFullscreen: boolean
    noAutoplay: boolean
    noLocalStorage: boolean
    noClipboard: boolean
    noNotifications: boolean
  }
}

export interface EmbedMessage {
  type: string
  data?: any
  timestamp: number
  source: 'parent' | 'game'
}

export interface EmbedCapabilities {
  fullscreen: boolean
  autoplay: boolean
  localStorage: boolean
  clipboard: boolean
  notifications: boolean
  orientationLock: boolean
  vibration: boolean
  gamepad: boolean
}

/**
 * Enhanced Embed Manager for 2025
 * Handles iframe embedding, parent communication, and capability detection
 */
export class EnhancedEmbedManager {
  private eventBus: ReactiveEventBus
  private game: Phaser.Game
  
  // Embed state management
  private embedContext$ = new BehaviorSubject<EmbedContext>(this.detectEmbedContext())
  private embedCapabilities$ = new BehaviorSubject<EmbedCapabilities>(this.detectCapabilities())
  private parentMessages$ = new BehaviorSubject<EmbedMessage | null>(null)
  
  // Communication
  private messageHandlers = new Map<string, (data: any) => void>()
  private heartbeatInterval: number | null = null
  
  constructor(game: Phaser.Game) {
    this.game = game
    this.eventBus = ReactiveEventBus.getInstance()
    
    this.initializeEmbedSystem()
  }

  /**
   * Initialize embed system
   */
  private initializeEmbedSystem(): void {
    const context = this.embedContext$.value
    
    if (context.isEmbedded) {
      this.setupParentCommunication()
      this.setupEmbedOptimizations()
      this.setupSecurityMeasures()
      this.announceReadiness()
    }
    
    this.setupCapabilityMonitoring()
  }

  /**
   * Advanced embed detection
   */
  private detectEmbedContext(): EmbedContext {
    let isEmbedded = false
    let parentOrigin: string | null = null
    let embedType: EmbedContext['embedType'] = 'standalone'
    
    try {
      // Primary detection
      isEmbedded = window.self !== window.top
      
      if (isEmbedded) {
        // Try to get parent origin
        try {
          parentOrigin = document.referrer ? new URL(document.referrer).origin : null
        } catch (e) {
          parentOrigin = null
        }
        
        // Detect embed type
        if (window.frameElement) {
          embedType = 'iframe'
        } else if (navigator.userAgent.includes('WebView')) {
          embedType = 'webview'
        }
      }
    } catch (e) {
      // Cross-origin iframe
      isEmbedded = true
      embedType = 'iframe'
    }

    // Additional checks
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('embed') === 'true') {
      isEmbedded = true
    }

    return {
      isEmbedded,
      parentOrigin,
      embedType,
      allowFullscreen: this.checkFullscreenPolicy(),
      allowAutoplay: this.checkAutoplayPolicy(),
      allowOrientationLock: this.checkOrientationLockPolicy(),
      parentSize: null, // Will be updated via postMessage
      restrictions: this.detectRestrictions()
    }
  }

  /**
   * Detect iframe policy restrictions
   */
  private checkFullscreenPolicy(): boolean {
    try {
      const iframe = window.frameElement as HTMLIFrameElement
      return iframe ? iframe.allowFullscreen : true
    } catch (e) {
      return false // Cross-origin, assume restricted
    }
  }

  private checkAutoplayPolicy(): boolean {
    try {
      const iframe = window.frameElement as HTMLIFrameElement
      if (iframe) {
        const allow = iframe.getAttribute('allow') || ''
        return allow.includes('autoplay')
      }
      return true
    } catch (e) {
      return false
    }
  }

  private checkOrientationLockPolicy(): boolean {
    try {
      const iframe = window.frameElement as HTMLIFrameElement
      if (iframe) {
        const allow = iframe.getAttribute('allow') || ''
        return allow.includes('screen-wake-lock')
      }
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Detect security and capability restrictions
   */
  private detectRestrictions(): EmbedContext['restrictions'] {
    return {
      noFullscreen: !this.checkFullscreenPolicy(),
      noAutoplay: !this.checkAutoplayPolicy(),
      noLocalStorage: !this.hasLocalStorageAccess(),
      noClipboard: !navigator.clipboard,
      noNotifications: !('Notification' in window)
    }
  }

  private hasLocalStorageAccess(): boolean {
    try {
      const test = '__localStorage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Setup parent communication
   */
  private setupParentCommunication(): void {
    // Listen for parent messages
    fromEvent<MessageEvent>(window, 'message').pipe(
      filter(event => this.isValidParentMessage(event)),
      map(event => ({
        type: event.data.type,
        data: event.data.data,
        timestamp: Date.now(),
        source: 'parent' as const
      }))
    ).subscribe(message => {
      this.parentMessages$.next(message)
      this.handleParentMessage(message)
    })

    // Setup standard message handlers
    this.registerMessageHandler('embed-resize', (data) => {
      this.handleParentResize(data.width, data.height)
    })

    this.registerMessageHandler('embed-fullscreen-response', (data) => {
      this.handleFullscreenResponse(data.success)
    })

    this.registerMessageHandler('embed-focus', () => {
      this.handleFocusChange(true)
    })

    this.registerMessageHandler('embed-blur', () => {
      this.handleFocusChange(false)
    })

    this.registerMessageHandler('embed-visibility', (data) => {
      this.handleVisibilityChange(data.visible)
    })

    this.registerMessageHandler('embed-theme', (data) => {
      this.handleThemeChange(data.theme)
    })

    // Setup heartbeat
    this.startHeartbeat()
  }

  /**
   * Setup embed-specific optimizations
   */
  private setupEmbedOptimizations(): void {
    const context = this.embedContext$.value
    
    // Disable features that don't work in embeds
    if (context.restrictions.noAutoplay) {
      this.eventBus.emit('audio:disableAutoplay')
    }

    if (context.restrictions.noFullscreen) {
      this.eventBus.emit('ui:disableFullscreenButton')
    }

    if (context.restrictions.noNotifications) {
      this.eventBus.emit('ui:disableNotifications')
    }

    // Optimize for iframe performance
    if (context.embedType === 'iframe') {
      // Reduce update frequency when not focused
      document.addEventListener('visibilitychange', () => {
        const fps = document.hidden ? 30 : 60
        this.eventBus.emit('performance:setTargetFPS', fps)
      })
    }

    // Handle embed-specific scaling
    this.setupEmbedScaling()
  }

  private setupEmbedScaling(): void {
    const gameContainer = this.game.canvas.parentElement
    if (!gameContainer) return

    // Make container responsive to parent
    gameContainer.style.width = '100%'
    gameContainer.style.height = '100%'
    gameContainer.style.border = 'none'
    gameContainer.style.outline = 'none'

    // Handle container resize
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        this.handleContainerResize(width, height)
      }
    })

    resizeObserver.observe(gameContainer)
  }

  /**
   * Setup security measures for embed mode
   */
  private setupSecurityMeasures(): void {
    const context = this.embedContext$.value
    
    // Validate parent origin if known
    if (context.parentOrigin) {
      this.validateParentOrigin(context.parentOrigin)
    }

    // Implement CSP-like restrictions
    this.implementContentSecurityMeasures()
    
    // Monitor for suspicious activity
    this.monitorSecurityEvents()
  }

  private validateParentOrigin(expectedOrigin: string): void {
    // This would implement origin validation based on allowlist
    console.log('Validating parent origin:', expectedOrigin)
  }

  private implementContentSecurityMeasures(): void {
    // Disable dangerous APIs in embed mode
    if (window.eval) {
      window.eval = () => { throw new Error('eval disabled in embed mode') }
    }

    // Monitor for script injection attempts
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element
            if (element.tagName === 'SCRIPT' && !element.hasAttribute('data-game-script')) {
              console.warn('Potential script injection detected')
              element.remove()
            }
          }
        })
      })
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  private monitorSecurityEvents(): void {
    // Monitor for potential security issues
    window.addEventListener('error', (event) => {
      if (event.message.includes('Script error')) {
        this.reportSecurityEvent('script_error', event.message)
      }
    })
  }

  /**
   * Capability detection and monitoring
   */
  private detectCapabilities(): EmbedCapabilities {
    const context = this.embedContext$.value
    
    return {
      fullscreen: !context.restrictions.noFullscreen && this.detectFullscreenSupport(),
      autoplay: !context.restrictions.noAutoplay,
      localStorage: !context.restrictions.noLocalStorage,
      clipboard: !context.restrictions.noClipboard,
      notifications: !context.restrictions.noNotifications,
      orientationLock: context.allowOrientationLock && 'orientation' in screen,
      vibration: 'vibrate' in navigator,
      gamepad: 'getGamepads' in navigator
    }
  }

  private detectFullscreenSupport(): boolean {
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    )
  }

  private setupCapabilityMonitoring(): void {
    // Monitor capability changes
    setInterval(() => {
      const newCapabilities = this.detectCapabilities()
      const currentCapabilities = this.embedCapabilities$.value
      
      if (JSON.stringify(newCapabilities) !== JSON.stringify(currentCapabilities)) {
        this.embedCapabilities$.next(newCapabilities)
        this.eventBus.emit('embed:capabilitiesChanged', newCapabilities)
      }
    }, 5000)
  }

  /**
   * Message handling
   */
  private isValidParentMessage(event: MessageEvent): boolean {
    const context = this.embedContext$.value
    
    // Check origin if known
    if (context.parentOrigin && event.origin !== context.parentOrigin) {
      return false
    }

    // Check message structure
    return event.data && typeof event.data.type === 'string'
  }

  private registerMessageHandler(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler)
  }

  private handleParentMessage(message: EmbedMessage): void {
    const handler = this.messageHandlers.get(message.type)
    if (handler) {
      try {
        handler(message.data)
      } catch (error) {
        console.error('Error handling parent message:', error)
      }
    }
    
    this.eventBus.emit(`embed:${message.type}`, message.data)
  }

  private sendMessageToParent(type: string, data?: any): void {
    if (window.parent === window.self) return

    const message = {
      type,
      data,
      timestamp: Date.now()
    }

    try {
      window.parent.postMessage(message, '*')
    } catch (error) {
      console.error('Failed to send message to parent:', error)
    }
  }

  /**
   * Event handlers
   */
  private handleParentResize(width: number, height: number): void {
    const context = this.embedContext$.value
    context.parentSize = { width, height }
    this.embedContext$.next(context)
    
    this.eventBus.emit('embed:parentResize', { width, height })
  }

  private handleFullscreenResponse(success: boolean): void {
    this.eventBus.emit('embed:fullscreenResponse', { success })
  }

  private handleFocusChange(focused: boolean): void {
    if (focused) {
      if (this.game.scene.scenes.length > 0) {
        this.game.scene.scenes.forEach(scene => scene.scene.resume())
      }
    } else {
      if (this.game.scene.scenes.length > 0) {
        this.game.scene.scenes.forEach(scene => scene.scene.pause())
      }
    }
    
    this.eventBus.emit('embed:focusChange', { focused })
  }

  private handleVisibilityChange(visible: boolean): void {
    if (visible) {
      if (this.game.scene.scenes.length > 0) {
        this.game.scene.scenes.forEach(scene => scene.scene.resume())
      }
    } else {
      if (this.game.scene.scenes.length > 0) {
        this.game.scene.scenes.forEach(scene => scene.scene.pause())
      }
    }
    
    this.eventBus.emit('embed:visibilityChange', { visible })
  }

  private handleThemeChange(theme: 'light' | 'dark'): void {
    this.eventBus.emit('embed:themeChange', { theme })
  }

  private handleContainerResize(width: number, height: number): void {
    // Update game scale
    if (this.game.scale) {
      this.game.scale.resize(width, height)
    }
    
    this.sendMessageToParent('embed-size-changed', { width, height })
  }

  /**
   * Heartbeat system
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      this.sendMessageToParent('embed-heartbeat', {
        fps: this.game.loop.actualFps,
        memory: (performance as any).memory?.usedJSHeapSize || 0
      })
    }, 5000)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Initialization and ready state
   */
  private announceReadiness(): void {
    // Wait for game to be ready
    const checkReady = () => {
      if (this.game.isRunning) {
        this.sendMessageToParent('embed-ready', {
          version: (Phaser as any).VERSION || '3.x',
          capabilities: this.embedCapabilities$.value,
          restrictions: this.embedContext$.value.restrictions
        })
      } else {
        setTimeout(checkReady, 100)
      }
    }
    
    checkReady()
  }

  /**
   * Security reporting
   */
  private reportSecurityEvent(type: string, details: any): void {
    this.sendMessageToParent('embed-security-event', {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  }

  /**
   * Public API
   */
  getEmbedContext(): Observable<EmbedContext> {
    return this.embedContext$.asObservable().pipe(distinctUntilChanged())
  }

  getCapabilities(): Observable<EmbedCapabilities> {
    return this.embedCapabilities$.asObservable().pipe(distinctUntilChanged())
  }

  getParentMessages(): Observable<EmbedMessage | null> {
    return this.parentMessages$.asObservable().pipe(
      filter(msg => msg !== null)
    ) as Observable<EmbedMessage>
  }

  isEmbedded(): boolean {
    return this.embedContext$.value.isEmbedded
  }

  canUseFullscreen(): boolean {
    return this.embedCapabilities$.value.fullscreen
  }

  canAutoplay(): boolean {
    return this.embedCapabilities$.value.autoplay
  }

  hasCapability(capability: keyof EmbedCapabilities): boolean {
    return this.embedCapabilities$.value[capability]
  }

  requestFullscreen(): void {
    if (this.canUseFullscreen()) {
      this.sendMessageToParent('embed-fullscreen-request')
    }
  }

  reportReady(): void {
    this.sendMessageToParent('embed-game-ready')
  }

  reportError(error: Error): void {
    this.sendMessageToParent('embed-error', {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    })
  }

  updateGameState(state: any): void {
    this.sendMessageToParent('embed-game-state', state)
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopHeartbeat()
    this.embedContext$.complete()
    this.embedCapabilities$.complete()
    this.parentMessages$.complete()
    this.messageHandlers.clear()
  }
}