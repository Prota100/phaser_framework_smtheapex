import { Observable, BehaviorSubject, fromEvent, merge } from 'rxjs'
import { map, distinctUntilChanged, throttleTime, filter } from 'rxjs/operators'
import { ReactiveEventBus } from '../utils/ReactiveEventBus'

// Orientation lock types
export type OrientationLockType = 'any' | 'natural' | 'landscape' | 'portrait' | 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary'

// Extended screen interface for orientation API
interface ScreenOrientationAPI {
  lock?(orientation: OrientationLockType): Promise<void>
  unlock?(): void
  angle?: number
  type?: string
}

interface ExtendedScreen {
  orientation?: ScreenOrientationAPI
  width: number
  height: number
  availWidth: number
  availHeight: number
  colorDepth: number
  pixelDepth: number
}

// 2025년 기준 디바이스 브레이크포인트 정의
export interface Enhanced2025Breakpoints {
  // 모바일
  mobile_xs: number      // 320px - 작은 폰
  mobile_sm: number      // 375px - iPhone SE
  mobile_md: number      // 414px - iPhone Plus
  mobile_lg: number      // 480px - 큰 안드로이드 폰
  
  // 태블릿
  tablet_sm: number      // 600px - 작은 태블릿 (iPad Mini portrait)
  tablet_md: number      // 768px - iPad portrait
  tablet_lg: number      // 834px - iPad Air portrait
  tablet_xl: number      // 1024px - iPad landscape
  tablet_pro: number     // 1194px - iPad Pro 11" landscape
  tablet_pro_xl: number  // 1366px - iPad Pro 12.9" landscape
  
  // 데스크톱
  desktop_sm: number     // 1280px - 작은 노트북
  desktop_md: number     // 1440px - 표준 데스크톱
  desktop_lg: number     // 1680px - 큰 데스크톱
  desktop_xl: number     // 1920px - Full HD
  desktop_xxl: number    // 2560px - 2K/4K
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'tv'
  subtype: string
  orientation: 'portrait' | 'landscape'
  hasTouch: boolean
  pixelRatio: number
  isEmbedded: boolean
  isFullscreenCapable: boolean
  supportsOrientationLock: boolean
  containerSize: { width: number, height: number }
  screenSize: { width: number, height: number }
  safeArea: { top: number, right: number, bottom: number, left: number }
}

export interface ViewportState {
  width: number
  height: number
  deviceType: DeviceInfo['type']
  deviceSubtype: string
  orientation: 'portrait' | 'landscape'
  breakpoint: string
  scaleFactor: number
  isEmbedded: boolean
  canGoFullscreen: boolean
  safeAreaPadding: { top: number, right: number, bottom: number, left: number }
}

/**
 * Enhanced Responsive Manager for 2025
 * Supports Container Queries, modern devices, fullscreen, and embed modes
 */
export class EnhancedResponsiveManager {
  private eventBus: ReactiveEventBus
  private game: Phaser.Game
  
  // 2025년 표준 브레이크포인트
  private breakpoints: Enhanced2025Breakpoints = {
    mobile_xs: 320,
    mobile_sm: 375,
    mobile_md: 414,
    mobile_lg: 480,
    tablet_sm: 600,
    tablet_md: 768,
    tablet_lg: 834,
    tablet_xl: 1024,
    tablet_pro: 1194,
    tablet_pro_xl: 1366,
    desktop_sm: 1280,
    desktop_md: 1440,
    desktop_lg: 1680,
    desktop_xl: 1920,
    desktop_xxl: 2560
  }
  
  // 반응형 상태 관리
  private viewportState$ = new BehaviorSubject<ViewportState>(this.getInitialViewportState())
  private deviceInfo$ = new BehaviorSubject<DeviceInfo>(this.detectDeviceInfo())
  
  // Container Query 지원
  private containerObserver: ResizeObserver | null = null
  private gameContainer: HTMLElement | null = null
  
  // Fullscreen API
  private fullscreenElement$ = new BehaviorSubject<Element | null>(null)
  private isFullscreenSupported = false

  constructor(game: Phaser.Game, customBreakpoints?: Partial<Enhanced2025Breakpoints>) {
    this.game = game
    this.eventBus = ReactiveEventBus.getInstance()
    
    if (customBreakpoints) {
      this.breakpoints = { ...this.breakpoints, ...customBreakpoints }
    }
    
    this.gameContainer = document.getElementById(game.config.parent as string) || game.canvas.parentElement
    this.isFullscreenSupported = this.detectFullscreenSupport()
    
    this.initializeResponsiveSystem()
  }

  /**
   * Initialize complete responsive system
   */
  private initializeResponsiveSystem(): void {
    this.setupViewportObservers()
    this.setupContainerQueries()
    this.setupFullscreenHandling()
    this.setupSafeAreaHandling()
    this.setupEmbedModeDetection()
    this.setupOrientationLocking()
    
    // Initial device detection
    this.updateViewportState()
  }

  /**
   * Setup viewport and resize observers
   */
  private setupViewportObservers(): void {
    // Window resize observer
    const windowResize$ = fromEvent(window, 'resize').pipe(
      throttleTime(16) // 60fps
    )
    
    // Orientation change observer
    const orientationChange$ = fromEvent(window, 'orientationchange')
    
    // Visual viewport changes (mobile keyboard, etc.)
    const visualViewportResize$ = window.visualViewport 
      ? fromEvent(window.visualViewport, 'resize')
      : new Observable(() => {})
    
    // Combined viewport changes
    merge(windowResize$, orientationChange$, visualViewportResize$)
      .pipe(throttleTime(50))
      .subscribe(() => {
        this.updateViewportState()
      })

    // Device orientation API
    if ('screen' in window && 'orientation' in window.screen) {
      fromEvent(window.screen.orientation, 'change').subscribe(() => {
        setTimeout(() => this.updateViewportState(), 100) // iOS delay
      })
    }
  }

  /**
   * Setup Container Query support
   */
  private setupContainerQueries(): void {
    if (!this.gameContainer || !window.ResizeObserver) return

    this.containerObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        this.handleContainerResize(width, height)
      }
    })

    this.containerObserver.observe(this.gameContainer)
  }

  /**
   * Handle container resize (Container Query equivalent)
   */
  private handleContainerResize(width: number, height: number): void {
    const currentState = this.viewportState$.value
    
    if (currentState.width !== width || currentState.height !== height) {
      this.updateViewportState()
      
      this.eventBus.emit('responsive:containerResize', {
        width,
        height,
        previousWidth: currentState.width,
        previousHeight: currentState.height
      })
    }
  }

  /**
   * Setup fullscreen handling
   */
  private setupFullscreenHandling(): void {
    if (!this.isFullscreenSupported) return

    const fullscreenEvents = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ]

    fullscreenEvents.forEach(event => {
      document.addEventListener(event, () => {
        const fullscreenElement = this.getFullscreenElement()
        this.fullscreenElement$.next(fullscreenElement)
        this.updateViewportState()
        
        this.eventBus.emit('responsive:fullscreenChange', {
          isFullscreen: !!fullscreenElement,
          element: fullscreenElement
        })
      })
    })
  }

  /**
   * Setup safe area handling for modern mobile devices
   */
  private setupSafeAreaHandling(): void {
    if (!CSS.supports || !CSS.supports('padding-top', 'env(safe-area-inset-top)')) return

    const safeAreaProperties = [
      'safe-area-inset-top',
      'safe-area-inset-right', 
      'safe-area-inset-bottom',
      'safe-area-inset-left'
    ]

    // Monitor safe area changes
    const testElement = document.createElement('div')
    testElement.style.position = 'fixed'
    testElement.style.top = '0'
    testElement.style.visibility = 'hidden'
    testElement.style.paddingTop = 'env(safe-area-inset-top)'
    document.body.appendChild(testElement)

    const observer = new MutationObserver(() => {
      this.updateViewportState()
    })

    observer.observe(testElement, { attributes: true, attributeFilter: ['style'] })
  }

  /**
   * Enhanced embed mode detection
   */
  private setupEmbedModeDetection(): void {
    // Multiple detection methods
    const isEmbedded = this.detectEmbedMode()
    
    if (isEmbedded) {
      this.handleEmbedMode()
    }

    // Listen for postMessage from parent
    window.addEventListener('message', (event) => {
      if (event.data.type === 'embed-resize') {
        this.handleEmbedResize(event.data.width, event.data.height)
      } else if (event.data.type === 'embed-fullscreen-request') {
        this.requestFullscreenFromEmbed()
      }
    })
  }

  /**
   * Setup orientation locking for mobile games
   */
  private setupOrientationLocking(): void {
    const screenWithOrientation = screen as ExtendedScreen
    if (!('orientation' in screen) || !screenWithOrientation.orientation?.lock) return

    this.eventBus.stream('game:requestOrientationLock').subscribe((data: any) => {
      this.lockOrientation(data.orientation)
    })
  }

  /**
   * Update viewport state with all current information
   */
  private updateViewportState(): void {
    const deviceInfo = this.detectDeviceInfo()
    const containerSize = this.getContainerSize()
    const screenSize = this.getScreenSize()
    const breakpoint = this.detectBreakpoint(containerSize.width)
    const safeArea = this.getSafeAreaInsets()
    
    const newState: ViewportState = {
      width: containerSize.width,
      height: containerSize.height,
      deviceType: deviceInfo.type,
      deviceSubtype: deviceInfo.subtype,
      orientation: deviceInfo.orientation,
      breakpoint,
      scaleFactor: this.calculateScaleFactor(deviceInfo, breakpoint),
      isEmbedded: deviceInfo.isEmbedded,
      canGoFullscreen: deviceInfo.isFullscreenCapable && !deviceInfo.isEmbedded,
      safeAreaPadding: safeArea
    }

    const previousState = this.viewportState$.value
    this.viewportState$.next(newState)
    this.deviceInfo$.next(deviceInfo)

    // Emit specific change events
    if (newState.breakpoint !== previousState.breakpoint) {
      this.eventBus.emit('responsive:breakpointChange', {
        from: previousState.breakpoint,
        to: newState.breakpoint,
        deviceType: newState.deviceType
      })
    }

    if (newState.orientation !== previousState.orientation) {
      this.eventBus.emit('responsive:orientationChange', {
        from: previousState.orientation,
        to: newState.orientation,
        deviceType: newState.deviceType
      })
    }
  }

  /**
   * Advanced device detection for 2025
   */
  private detectDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const pixelRatio = window.devicePixelRatio || 1
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    const orientation = this.getOrientation()
    
    // Advanced device detection
    let type: DeviceInfo['type'] = 'desktop'
    let subtype = 'unknown'

    // Mobile detection
    if (/iPhone|iPod/.test(userAgent)) {
      type = 'mobile'
      if (screenWidth >= 414) subtype = 'iphone_plus'
      else if (screenWidth >= 375) subtype = 'iphone_standard'
      else subtype = 'iphone_compact'
    } else if (/Android.*Mobile/.test(userAgent)) {
      type = 'mobile'
      if (screenWidth >= 480) subtype = 'android_large'
      else if (screenWidth >= 375) subtype = 'android_standard'
      else subtype = 'android_compact'
    }
    
    // Tablet detection
    else if (/iPad/.test(userAgent)) {
      type = 'tablet'
      if (screenWidth >= 1366) subtype = 'ipad_pro_129'
      else if (screenWidth >= 1194) subtype = 'ipad_pro_11'
      else if (screenWidth >= 834) subtype = 'ipad_air'
      else subtype = 'ipad_standard'
    } else if (/Android/.test(userAgent) && !userAgent.includes('Mobile')) {
      type = 'tablet'
      if (screenWidth >= 1200) subtype = 'android_tablet_large'
      else if (screenWidth >= 800) subtype = 'android_tablet_standard'
      else subtype = 'android_tablet_compact'
    }
    
    // TV detection
    else if (/TV|WebOS|Tizen/.test(userAgent)) {
      type = 'tv'
      subtype = 'smart_tv'
    }

    // Fallback for unknown devices
    if (type === 'desktop' && hasTouch && screenWidth < 1024) {
      type = 'tablet'
      subtype = 'unknown_tablet'
    }

    return {
      type,
      subtype,
      orientation,
      hasTouch,
      pixelRatio,
      isEmbedded: this.detectEmbedMode(),
      isFullscreenCapable: this.isFullscreenSupported,
      supportsOrientationLock: 'orientation' in screen,
      containerSize: this.getContainerSize(),
      screenSize: { width: screenWidth, height: screenHeight },
      safeArea: this.getSafeAreaInsets()
    }
  }

  /**
   * Enhanced embed mode detection
   */
  private detectEmbedMode(): boolean {
    try {
      // Primary check
      if (window.self !== window.top) return true
      
      // Secondary checks
      if (document.referrer && new URL(document.referrer).hostname !== window.location.hostname) {
        return true
      }
      
      // iframe check
      if (window.frameElement) return true
      
      // Check for embed-specific URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('embed') === 'true') return true
      
      return false
    } catch (e) {
      return true // Cross-origin iframe
    }
  }

  /**
   * Detect 2025 breakpoints
   */
  private detectBreakpoint(width: number): string {
    const bp = this.breakpoints
    
    if (width >= bp.desktop_xxl) return 'desktop_xxl'
    if (width >= bp.desktop_xl) return 'desktop_xl'
    if (width >= bp.desktop_lg) return 'desktop_lg'
    if (width >= bp.desktop_md) return 'desktop_md'
    if (width >= bp.desktop_sm) return 'desktop_sm'
    if (width >= bp.tablet_pro_xl) return 'tablet_pro_xl'
    if (width >= bp.tablet_pro) return 'tablet_pro'
    if (width >= bp.tablet_xl) return 'tablet_xl'
    if (width >= bp.tablet_lg) return 'tablet_lg'
    if (width >= bp.tablet_md) return 'tablet_md'
    if (width >= bp.tablet_sm) return 'tablet_sm'
    if (width >= bp.mobile_lg) return 'mobile_lg'
    if (width >= bp.mobile_md) return 'mobile_md'
    if (width >= bp.mobile_sm) return 'mobile_sm'
    return 'mobile_xs'
  }

  /**
   * Calculate optimal scale factor for device
   */
  private calculateScaleFactor(deviceInfo: DeviceInfo, breakpoint: string): number {
    const pixelRatio = deviceInfo.pixelRatio
    const baseScale = this.getBreakpointScale(breakpoint)
    
    // Adjust for high DPI displays
    if (pixelRatio > 2 && deviceInfo.type === 'mobile') {
      return baseScale * 0.9 // Slightly smaller on high DPI mobile
    } else if (pixelRatio > 1.5 && deviceInfo.type === 'tablet') {
      return baseScale * 0.95 // Slightly smaller on high DPI tablets
    }
    
    return baseScale
  }

  private getBreakpointScale(breakpoint: string): number {
    const scaleMap: Record<string, number> = {
      mobile_xs: 0.65,
      mobile_sm: 0.7,
      mobile_md: 0.75,
      mobile_lg: 0.8,
      tablet_sm: 0.85,
      tablet_md: 0.9,
      tablet_lg: 0.95,
      tablet_xl: 1.0,
      tablet_pro: 1.05,
      tablet_pro_xl: 1.1,
      desktop_sm: 1.0,
      desktop_md: 1.0,
      desktop_lg: 1.0,
      desktop_xl: 1.0,
      desktop_xxl: 1.0
    }
    
    return scaleMap[breakpoint] || 1.0
  }

  /**
   * Get safe area insets for modern devices
   */
  private getSafeAreaInsets(): { top: number, right: number, bottom: number, left: number } {
    if (!CSS.supports('padding-top', 'env(safe-area-inset-top)')) {
      return { top: 0, right: 0, bottom: 0, left: 0 }
    }

    const testElement = document.createElement('div')
    testElement.style.position = 'fixed'
    testElement.style.top = '0'
    testElement.style.visibility = 'hidden'
    testElement.style.paddingTop = 'env(safe-area-inset-top)'
    testElement.style.paddingRight = 'env(safe-area-inset-right)'
    testElement.style.paddingBottom = 'env(safe-area-inset-bottom)'
    testElement.style.paddingLeft = 'env(safe-area-inset-left)'
    
    document.body.appendChild(testElement)
    
    const computed = window.getComputedStyle(testElement)
    const insets = {
      top: parseInt(computed.paddingTop) || 0,
      right: parseInt(computed.paddingRight) || 0,
      bottom: parseInt(computed.paddingBottom) || 0,
      left: parseInt(computed.paddingLeft) || 0
    }
    
    document.body.removeChild(testElement)
    return insets
  }

  /**
   * Fullscreen API methods
   */
  async requestFullscreen(): Promise<boolean> {
    if (!this.isFullscreenSupported || !this.gameContainer) return false

    try {
      if (this.gameContainer.requestFullscreen) {
        await this.gameContainer.requestFullscreen()
      } else if ((this.gameContainer as any).webkitRequestFullscreen) {
        await (this.gameContainer as any).webkitRequestFullscreen()
      } else if ((this.gameContainer as any).mozRequestFullScreen) {
        await (this.gameContainer as any).mozRequestFullScreen()
      } else if ((this.gameContainer as any).msRequestFullscreen) {
        await (this.gameContainer as any).msRequestFullscreen()
      }
      
      this.eventBus.emit('responsive:fullscreenRequested')
      return true
    } catch (error) {
      console.warn('Fullscreen request failed:', error)
      return false
    }
  }

  async exitFullscreen(): Promise<boolean> {
    if (!this.getFullscreenElement()) return false

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
      
      this.eventBus.emit('responsive:fullscreenExited')
      return true
    } catch (error) {
      console.warn('Exit fullscreen failed:', error)
      return false
    }
  }

  async toggleFullscreen(): Promise<boolean> {
    return this.isFullscreen() ? await this.exitFullscreen() : await this.requestFullscreen()
  }

  /**
   * Orientation locking for mobile games
   */
  async lockOrientation(orientation: OrientationLockType): Promise<boolean> {
    const screenWithOrientation = screen as ExtendedScreen
    if (!('orientation' in screen) || !screenWithOrientation.orientation?.lock) return false

    try {
      await screenWithOrientation.orientation.lock(orientation)
      this.eventBus.emit('responsive:orientationLocked', { orientation })
      return true
    } catch (error) {
      console.warn('Orientation lock failed:', error)
      return false
    }
  }

  async unlockOrientation(): Promise<void> {
    const screenWithOrientation = screen as ExtendedScreen
    if ('orientation' in screen && screenWithOrientation.orientation?.unlock) {
      screenWithOrientation.orientation.unlock()
      this.eventBus.emit('responsive:orientationUnlocked')
    }
  }

  /**
   * Embed mode handling
   */
  private handleEmbedMode(): void {
    // Set embed-specific styles
    if (this.gameContainer) {
      this.gameContainer.style.width = '100%'
      this.gameContainer.style.height = '100%'
      this.gameContainer.style.border = 'none'
    }
    
    // Send ready message to parent
    if (window.parent !== window.self) {
      window.parent.postMessage({ type: 'embed-ready' }, '*')
    }
    
    this.eventBus.emit('responsive:embedModeActivated')
  }

  private handleEmbedResize(width: number, height: number): void {
    if (this.gameContainer) {
      this.gameContainer.style.width = `${width}px`
      this.gameContainer.style.height = `${height}px`
    }
    
    this.updateViewportState()
  }

  private async requestFullscreenFromEmbed(): Promise<void> {
    if (window.parent !== window.self) {
      window.parent.postMessage({ type: 'embed-fullscreen-request' }, '*')
    } else {
      await this.requestFullscreen()
    }
  }

  /**
   * Public API - Observables
   */
  getViewportState(): Observable<ViewportState> {
    return this.viewportState$.asObservable().pipe(distinctUntilChanged())
  }

  getDeviceInfo(): Observable<DeviceInfo> {
    return this.deviceInfo$.asObservable().pipe(distinctUntilChanged())
  }

  getBreakpointChanges(): Observable<string> {
    return this.viewportState$.pipe(
      map(state => state.breakpoint),
      distinctUntilChanged()
    )
  }

  getOrientationChanges(): Observable<'portrait' | 'landscape'> {
    return this.viewportState$.pipe(
      map(state => state.orientation),
      distinctUntilChanged()
    )
  }

  /**
   * Public API - Current state
   */
  getCurrentViewportState(): ViewportState {
    return this.viewportState$.value
  }

  getCurrentDeviceInfo(): DeviceInfo {
    return this.deviceInfo$.value
  }

  isFullscreen(): boolean {
    return !!this.getFullscreenElement()
  }

  isMobile(): boolean {
    return this.deviceInfo$.value.type === 'mobile'
  }

  isTablet(): boolean {
    return this.deviceInfo$.value.type === 'tablet'
  }

  isDesktop(): boolean {
    return this.deviceInfo$.value.type === 'desktop'
  }

  isEmbedded(): boolean {
    return this.deviceInfo$.value.isEmbedded
  }

  isPortrait(): boolean {
    return this.deviceInfo$.value.orientation === 'portrait'
  }

  isLandscape(): boolean {
    return this.deviceInfo$.value.orientation === 'landscape'
  }

  /**
   * Utility methods
   */
  private getInitialViewportState(): ViewportState {
    const containerSize = this.getContainerSize()
    
    return {
      width: containerSize.width,
      height: containerSize.height,
      deviceType: 'desktop',
      deviceSubtype: 'unknown',
      orientation: 'landscape',
      breakpoint: 'desktop_md',
      scaleFactor: 1,
      isEmbedded: false,
      canGoFullscreen: false,
      safeAreaPadding: { top: 0, right: 0, bottom: 0, left: 0 }
    }
  }

  private getContainerSize(): { width: number, height: number } {
    if (this.gameContainer) {
      const rect = this.gameContainer.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }
    
    return { width: window.innerWidth, height: window.innerHeight }
  }

  private getScreenSize(): { width: number, height: number } {
    return { width: window.screen.width, height: window.screen.height }
  }

  private getOrientation(): 'portrait' | 'landscape' {
    const containerSize = this.getContainerSize()
    return containerSize.height > containerSize.width ? 'portrait' : 'landscape'
  }

  private detectFullscreenSupport(): boolean {
    return !!(
      document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled
    )
  }

  private getFullscreenElement(): Element | null {
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement ||
      null
    )
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.containerObserver) {
      this.containerObserver.disconnect()
    }
    
    this.viewportState$.complete()
    this.deviceInfo$.complete()
    this.fullscreenElement$.complete()
  }
}