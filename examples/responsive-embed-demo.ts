import {
  GameManager,
  EnhancedResponsiveManager,
  EnhancedEmbedManager,
  EnhancedFullscreenManager,
  ReactiveEventBus,
  FrameworkConfig
} from '../src/index'

/**
 * Complete Responsive & Embed Demo for 2025
 * Demonstrates all new responsive, embed, and fullscreen features
 */

// Enhanced configuration for 2025
const gameConfig: FrameworkConfig = {
  game: {
    width: 1200,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#2c3e50',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%'
    }
  },
  ui: {
    useRexUI: true,
    useDOMOverlay: true,
    // 2025 enhanced breakpoints
    responsiveBreakpoints: {
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
  }
}

// Demo Scene with all responsive features
class ResponsiveEmbedDemoScene extends Phaser.Scene {
  private eventBus!: ReactiveEventBus
  private responsiveManager!: EnhancedResponsiveManager
  private embedManager!: EnhancedEmbedManager
  private fullscreenManager!: EnhancedFullscreenManager
  
  // UI Elements
  private statusText!: Phaser.GameObjects.Text
  private deviceInfoText!: Phaser.GameObjects.Text
  private embedInfoText!: Phaser.GameObjects.Text
  private fullscreenButton!: Phaser.GameObjects.Text
  private orientationButton!: Phaser.GameObjects.Text
  
  // Demo objects
  private responsiveGrid: Phaser.GameObjects.Rectangle[] = []
  private safeAreaIndicators: Phaser.GameObjects.Rectangle[] = []

  constructor() {
    super({ key: 'ResponsiveEmbedDemo' })
  }

  create() {
    this.eventBus = ReactiveEventBus.getInstance()
    
    // Get managers from game instance
    this.responsiveManager = (this.game as any).responsiveManager
    this.embedManager = (this.game as any).embedManager
    this.fullscreenManager = new EnhancedFullscreenManager(this.game)
    
    this.createUI()
    this.createResponsiveGrid()
    this.createSafeAreaIndicators()
    this.setupReactivePatterns()
    this.setupDemoInteractions()
    
    this.updateDisplay()
  }

  private createUI() {
    // Main status text
    this.statusText = this.add.text(20, 20, '', {
      fontSize: '16px',
      color: '#ecf0f1',
      backgroundColor: '#34495e',
      padding: { x: 10, y: 5 }
    })

    // Device info panel
    this.deviceInfoText = this.add.text(20, 80, '', {
      fontSize: '14px',
      color: '#ecf0f1',
      backgroundColor: '#27ae60',
      padding: { x: 8, y: 4 }
    })

    // Embed info panel
    this.embedInfoText = this.add.text(20, 180, '', {
      fontSize: '14px',
      color: '#ecf0f1',
      backgroundColor: '#e74c3c',
      padding: { x: 8, y: 4 }
    })

    // Interactive buttons
    this.fullscreenButton = this.add.text(this.scale.width - 200, 20, '🔍 Toggle Fullscreen', {
      fontSize: '16px',
      color: '#ecf0f1',
      backgroundColor: '#9b59b6',
      padding: { x: 10, y: 5 }
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.toggleFullscreen())

    this.orientationButton = this.add.text(this.scale.width - 200, 60, '📱 Lock Portrait', {
      fontSize: '16px',
      color: '#ecf0f1',
      backgroundColor: '#f39c12',
      padding: { x: 10, y: 5 }
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true })
    .on('pointerdown', () => this.toggleOrientation())
  }

  private createResponsiveGrid() {
    // Create a responsive grid that adapts to screen size
    const gridSize = this.getGridSize()
    const cellSize = this.getCellSize()
    
    this.responsiveGrid.forEach(rect => rect.destroy())
    this.responsiveGrid = []

    const startX = this.scale.width / 2 - (gridSize.cols * cellSize) / 2
    const startY = this.scale.height / 2 - (gridSize.rows * cellSize) / 2

    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const x = startX + col * cellSize
        const y = startY + row * cellSize
        
        const rect = this.add.rectangle(x, y, cellSize - 4, cellSize - 4, 0x3498db, 0.7)
        rect.setStrokeStyle(2, 0x2980b9)
        
        // Add responsive behavior
        rect.setInteractive()
        rect.on('pointerover', () => rect.setFillStyle(0xe74c3c, 0.8))
        rect.on('pointerout', () => rect.setFillStyle(0x3498db, 0.7))
        
        this.responsiveGrid.push(rect)
      }
    }
  }

  private createSafeAreaIndicators() {
    // Show safe area padding for modern mobile devices
    const viewport = this.responsiveManager.getCurrentViewportState()
    const safeArea = viewport.safeAreaPadding
    
    this.safeAreaIndicators.forEach(indicator => indicator.destroy())
    this.safeAreaIndicators = []

    if (safeArea.top > 0) {
      const indicator = this.add.rectangle(
        this.scale.width / 2, safeArea.top / 2,
        this.scale.width, safeArea.top,
        0xff9500, 0.3
      )
      indicator.setStrokeStyle(2, 0xff6b00)
      this.safeAreaIndicators.push(indicator)
    }

    if (safeArea.bottom > 0) {
      const indicator = this.add.rectangle(
        this.scale.width / 2, this.scale.height - safeArea.bottom / 2,
        this.scale.width, safeArea.bottom,
        0xff9500, 0.3
      )
      indicator.setStrokeStyle(2, 0xff6b00)
      this.safeAreaIndicators.push(indicator)
    }
  }

  private setupReactivePatterns() {
    // 1. Viewport state changes
    this.responsiveManager.getViewportState().subscribe(viewport => {
      this.updateDisplay()
      this.repositionUI()
      this.recreateResponsiveGrid()
    })

    // 2. Device orientation changes
    this.responsiveManager.getOrientationChanges().subscribe(orientation => {
      console.log(`Orientation changed to: ${orientation}`)
      this.handleOrientationChange(orientation)
    })

    // 3. Breakpoint changes
    this.responsiveManager.getBreakpointChanges().subscribe(breakpoint => {
      console.log(`Breakpoint changed to: ${breakpoint}`)
      this.handleBreakpointChange(breakpoint)
    })

    // 4. Embed mode handling
    if (this.embedManager.isEmbedded()) {
      this.embedManager.getEmbedContext().subscribe(context => {
        this.updateEmbedDisplay(context)
      })

      // Handle parent messages
      this.embedManager.getParentMessages().subscribe(message => {
        console.log('Parent message:', message)
        this.handleParentMessage(message)
      })
    }

    // 5. Fullscreen state changes
    this.fullscreenManager.getFullscreenState().subscribe(state => {
      this.updateFullscreenDisplay(state)
    })

    // 6. Container resize handling
    this.eventBus.stream('responsive:containerResize').subscribe(data => {
      console.log('Container resized:', data)
      this.handleContainerResize()
    })
  }

  private setupDemoInteractions() {
    // Add keyboard shortcuts
    this.input.keyboard!.on('keydown-F', () => this.toggleFullscreen())
    this.input.keyboard!.on('keydown-R', () => this.recreateResponsiveGrid())
    this.input.keyboard!.on('keydown-I', () => this.logDeviceInfo())

    // Add touch gestures for mobile
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        // Double tap to fullscreen
        const now = Date.now()
        if (now - (pointer as any).lastTap < 300) {
          this.toggleFullscreen()
        }
        (pointer as any).lastTap = now
      }
    })
  }

  private getGridSize() {
    const viewport = this.responsiveManager.getCurrentViewportState()
    
    // Responsive grid sizing
    if (viewport.breakpoint.includes('mobile')) {
      return { rows: 3, cols: 2 }
    } else if (viewport.breakpoint.includes('tablet')) {
      return { rows: 3, cols: 4 }
    } else {
      return { rows: 4, cols: 6 }
    }
  }

  private getCellSize() {
    const viewport = this.responsiveManager.getCurrentViewportState()
    
    // Responsive cell sizing
    if (viewport.breakpoint.includes('mobile')) {
      return 80
    } else if (viewport.breakpoint.includes('tablet')) {
      return 100
    } else {
      return 120
    }
  }

  private updateDisplay() {
    const viewport = this.responsiveManager.getCurrentViewportState()
    const device = this.responsiveManager.getCurrentDeviceInfo()
    
    // Main status
    this.statusText.setText(`📱 ${viewport.width}×${viewport.height} | ${viewport.breakpoint} | ${viewport.orientation}`)
    
    // Device info
    const deviceText = [
      `🔍 Device: ${device.type} (${device.subtype})`,
      `📏 Scale: ${viewport.scaleFactor.toFixed(2)}x`,
      `🎯 Pixel Ratio: ${device.pixelRatio.toFixed(1)}x`,
      `👆 Touch: ${device.hasTouch ? 'Yes' : 'No'}`,
      `🔒 Orientation Lock: ${device.supportsOrientationLock ? 'Yes' : 'No'}`
    ].join('\n')
    
    this.deviceInfoText.setText(deviceText)
  }

  private updateEmbedDisplay(context: any) {
    if (!this.embedInfoText) return

    const embedText = [
      `🌐 Embedded: ${context.isEmbedded ? 'Yes' : 'No'}`,
      `📦 Type: ${context.embedType}`,
      `🔓 Fullscreen: ${context.allowFullscreen ? 'Allowed' : 'Blocked'}`,
      `🔊 Autoplay: ${context.allowAutoplay ? 'Allowed' : 'Blocked'}`,
      `🌍 Origin: ${context.parentOrigin || 'Unknown'}`
    ].join('\n')
    
    this.embedInfoText.setText(embedText)
  }

  private updateFullscreenDisplay(state: any) {
    if (!this.fullscreenButton) return

    const buttonText = state.isFullscreen ? '🔍 Exit Fullscreen' : '🔍 Enter Fullscreen'
    this.fullscreenButton.setText(buttonText)
    
    // Update button color based on state
    const color = state.isFullscreen ? '#e74c3c' : '#9b59b6'
    this.fullscreenButton.setStyle({ backgroundColor: color })
  }

  private repositionUI() {
    const viewport = this.responsiveManager.getCurrentViewportState()
    
    // Reposition buttons for different screen sizes
    this.fullscreenButton.setPosition(viewport.width - 20, 20)
    this.orientationButton.setPosition(viewport.width - 20, 60)
  }

  private recreateResponsiveGrid() {
    this.createResponsiveGrid()
    this.createSafeAreaIndicators()
  }

  private handleOrientationChange(orientation: string) {
    // Update orientation button text
    const buttonText = orientation === 'portrait' ? '📱 Lock Landscape' : '📱 Lock Portrait'
    this.orientationButton.setText(buttonText)
    
    // Show orientation change effect
    this.cameras.main.flash(300, 100, 150, 200, false)
  }

  private handleBreakpointChange(breakpoint: string) {
    // Show breakpoint change effect
    this.cameras.main.shake(100, 0.01)
    
    // Update grid for new breakpoint
    this.recreateResponsiveGrid()
  }

  private handleParentMessage(message: any) {
    // Handle messages from parent iframe
    if (message.type === 'embed-theme') {
      this.updateTheme(message.data.theme)
    }
  }

  private handleContainerResize() {
    this.repositionUI()
    this.recreateResponsiveGrid()
  }

  private async toggleFullscreen() {
    try {
      const success = await this.fullscreenManager.toggleFullscreen({
        navigationUI: 'hide',
        lockOrientation: 'landscape-primary'
      })
      
      if (success) {
        this.cameras.main.flash(200, 50, 205, 50, false)
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error)
    }
  }

  private async toggleOrientation() {
    const currentOrientation = this.responsiveManager.getCurrentViewportState().orientation
    const targetOrientation = currentOrientation === 'portrait' 
      ? 'landscape-primary' as OrientationLockType
      : 'portrait-primary' as OrientationLockType
    
    try {
      const success = await this.responsiveManager.lockOrientation(targetOrientation)
      if (success) {
        this.cameras.main.flash(200, 255, 193, 7, false)
      }
    } catch (error) {
      console.warn('Orientation lock failed:', error)
    }
  }

  private updateTheme(theme: 'light' | 'dark') {
    const bgColor = theme === 'dark' ? 0x2c3e50 : 0xecf0f1
    this.cameras.main.setBackgroundColor(bgColor)
  }

  private logDeviceInfo() {
    const device = this.responsiveManager.getCurrentDeviceInfo()
    const viewport = this.responsiveManager.getCurrentViewportState()
    
    console.group('📱 Device Information')
    console.log('Device:', device)
    console.log('Viewport:', viewport)
    console.log('Embed Context:', this.embedManager.getCurrentEmbedContext?.())
    console.log('Fullscreen State:', this.fullscreenManager.getCurrentFullscreenState())
    console.groupEnd()
  }

  update() {
    // Animate responsive grid
    this.responsiveGrid.forEach((rect, index) => {
      const wave = Math.sin(this.time.now * 0.002 + index * 0.5) * 0.1 + 0.9
      rect.setScale(wave)
    })
  }

  destroy() {
    this.fullscreenManager?.destroy()
  }
}

// Initialize the enhanced responsive demo
async function initializeResponsiveDemo() {
  const gameManager = new GameManager(gameConfig)
  const game = await gameManager.initialize([ResponsiveEmbedDemoScene])
  
  // Store managers globally for scene access
  ;(game as any).responsiveManager = gameManager.getResponsiveManager?.()
  ;(game as any).embedManager = gameManager.getEmbedManager?.()
  
  console.log('🎮 Enhanced Responsive & Embed Demo initialized!')
  console.log('Features demonstrated:')
  console.log('- 2025 Enhanced Breakpoints ✅')
  console.log('- Advanced Device Detection ✅')
  console.log('- Fullscreen with Orientation Lock ✅')
  console.log('- Embed Mode with Parent Communication ✅')
  console.log('- Safe Area Support ✅')
  console.log('- Container Query Simulation ✅')
  console.log('- Reactive Responsive Patterns ✅')
  
  console.log('\nKeyboard shortcuts:')
  console.log('F - Toggle Fullscreen')
  console.log('R - Recreate Responsive Grid')
  console.log('I - Log Device Information')
  
  return game
}

// Export for use
export { initializeResponsiveDemo, ResponsiveEmbedDemoScene }