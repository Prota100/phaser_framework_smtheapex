/**
 * Progressive Web App Manager
 */
export class PWAManager {
  private deferredPrompt: any = null
  private isInstalled: boolean = false
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.checkIfInstalled()
    this.setupEventListeners()
  }

  /**
   * Initialize PWA
   */
  async initialize(): Promise<void> {
    // Register service worker
    if ('serviceWorker' in navigator && !this.isDevelopment()) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered')
        
        // Check for updates
        this.checkForUpdates()
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      console.log('PWA install prompt ready')
    })
    
    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true
      this.deferredPrompt = null
      console.log('PWA was installed')
    })
  }

  /**
   * Check if app is installed
   */
  private checkIfInstalled(): void {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true
    }
    
    // Check for iOS
    // @ts-ignore
    if (window.navigator.standalone) {
      this.isInstalled = true
    }
  }

  /**
   * Can install PWA
   */
  canInstall(): boolean {
    return !this.isInstalled && this.deferredPrompt !== null
  }

  /**
   * Is installed as PWA
   */
  isInstalledApp(): boolean {
    return this.isInstalled
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('Install prompt not available')
      return false
    }
    
    // Show the prompt
    this.deferredPrompt.prompt()
    
    // Wait for user choice
    const { outcome } = await this.deferredPrompt.userChoice
    
    console.log(`User response to install prompt: ${outcome}`)
    
    // Clear the deferred prompt
    this.deferredPrompt = null
    
    return outcome === 'accepted'
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<void> {
    if (!this.serviceWorkerRegistration) return
    
    try {
      await this.serviceWorkerRegistration.update()
      
      // Listen for updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration!.installing
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New version available')
              this.notifyUpdate()
            }
          })
        }
      })
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }

  /**
   * Notify user about update
   */
  private notifyUpdate(): void {
    // You can emit an event or show a notification
    if (confirm('A new version is available. Reload to update?')) {
      window.location.reload()
    }
  }

  /**
   * Get install instructions for platform
   */
  getInstallInstructions(): string {
    const ua = navigator.userAgent.toLowerCase()
    
    if (/iphone|ipad|ipod/.test(ua)) {
      return 'Tap the share button and select "Add to Home Screen"'
    } else if (/android/.test(ua)) {
      if (this.canInstall()) {
        return 'Tap "Install" to add this app to your home screen'
      }
      return 'Tap the menu button and select "Add to Home Screen"'
    } else {
      return 'Look for the install button in your browser\'s address bar'
    }
  }

  /**
   * Check if running in development
   */
  private isDevelopment(): boolean {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:'
  }

  /**
   * Create install banner
   */
  createInstallBanner(): HTMLElement {
    const banner = document.createElement('div')
    banner.className = 'pwa-install-banner'
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 25px;
      border-radius: 30px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 15px;
      z-index: 10000;
      animation: slideUp 0.3s ease-out;
    `
    
    banner.innerHTML = `
      <span style="font-size: 24px;">📱</span>
      <div>
        <div style="font-weight: bold;">Install App</div>
        <div style="font-size: 12px; opacity: 0.9;">${this.getInstallInstructions()}</div>
      </div>
      ${this.canInstall() ? '<button id="pwa-install-btn" style="background: white; color: #667eea; border: none; padding: 8px 16px; border-radius: 20px; font-weight: bold; cursor: pointer;">Install</button>' : ''}
      <button id="pwa-close-btn" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0;">×</button>
    `
    
    // Add event listeners
    const installBtn = banner.querySelector('#pwa-install-btn') as HTMLButtonElement
    if (installBtn) {
      installBtn.onclick = () => {
        this.showInstallPrompt()
        banner.remove()
      }
    }
    
    const closeBtn = banner.querySelector('#pwa-close-btn') as HTMLButtonElement
    if (closeBtn) {
      closeBtn.onclick = () => banner.remove()
    }
    
    // Add animation style
    const style = document.createElement('style')
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)
    
    return banner
  }

  /**
   * Show install banner
   */
  showInstallBanner(): void {
    if (this.isInstalled) return
    
    const banner = this.createInstallBanner()
    document.body.appendChild(banner)
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (banner.parentElement) {
        banner.remove()
      }
    }, 10000)
  }

  /**
   * Destroy PWA manager
   */
  destroy(): void {
    // Clean up event listeners if needed
  }
}