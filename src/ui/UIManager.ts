import Phaser from 'phaser'
import { UIPanel, GameEvents } from '../types'
import { EventBus } from '../utils/EventBus'
import { RexUIIntegration } from './RexUIIntegration'
import { DOMOverlay } from './DOMOverlay'

/**
 * UI Manager - Manages all UI panels and overlays
 */
export class UIManager {
  private scene: Phaser.Scene
  private eventBus: EventBus
  private rexUI?: RexUIIntegration
  private domOverlay?: DOMOverlay
  private panels: Map<string, UIPanel> = new Map()
  private activePanel: UIPanel | null = null
  private useRexUI: boolean
  private useDOMOverlay: boolean

  constructor(scene: Phaser.Scene, options?: { useRexUI?: boolean; useDOMOverlay?: boolean }) {
    this.scene = scene
    this.eventBus = EventBus.getInstance()
    this.useRexUI = options?.useRexUI !== false
    this.useDOMOverlay = options?.useDOMOverlay !== false
    
    // Initialize UI systems
    if (this.useRexUI) {
      this.rexUI = new RexUIIntegration(scene)
    }
    
    if (this.useDOMOverlay) {
      this.domOverlay = new DOMOverlay(scene)
    }
    
    this.setupEventListeners()
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // ESC key to close active panel
    this.eventBus.on('input:escape', () => {
      if (this.activePanel) {
        this.closePanel(this.activePanel.id)
      }
    })
    
    // Outside click to close panels
    this.eventBus.on('input:outside-click', (pointer: Phaser.Input.Pointer) => {
      if (this.activePanel && this.shouldCloseOnOutsideClick(pointer)) {
        this.closePanel(this.activePanel.id)
      }
    })
  }

  /**
   * Register a UI panel
   */
  registerPanel(panel: UIPanel): void {
    this.panels.set(panel.id, panel)
  }

  /**
   * Open a panel
   */
  openPanel(id: string, data?: any): UIPanel | null {
    // Close current panel if exists
    if (this.activePanel && this.activePanel.id !== id) {
      this.closePanel(this.activePanel.id)
    }
    
    const panel = this.panels.get(id)
    if (!panel) {
      console.warn(`Panel with id "${id}" not found`)
      return null
    }
    
    panel.open()
    this.activePanel = panel
    
    this.eventBus.emit(GameEvents.UI_PANEL_OPEN, { id, data })
    
    return panel
  }

  /**
   * Close a panel
   */
  closePanel(id: string): void {
    const panel = this.panels.get(id)
    if (!panel) return
    
    panel.close()
    
    if (this.activePanel?.id === id) {
      this.activePanel = null
    }
    
    this.eventBus.emit(GameEvents.UI_PANEL_CLOSE, { id })
  }

  /**
   * Close all panels
   */
  closeAllPanels(): void {
    this.panels.forEach(panel => {
      if (panel.isOpen) {
        panel.close()
      }
    })
    this.activePanel = null
  }

  /**
   * Check if should close on outside click
   */
  private shouldCloseOnOutsideClick(pointer: Phaser.Input.Pointer): boolean {
    if (!this.activePanel) return false
    
    // Check if click is within panel bounds
    const bounds = this.activePanel.container.getBounds()
    return !bounds.contains(pointer.x, pointer.y)
  }

  /**
   * Create a dialog using RexUI
   */
  createDialog(config: any): Phaser.GameObjects.Container | null {
    if (!this.rexUI) {
      console.warn('RexUI not initialized')
      return null
    }
    return this.rexUI.createDialog(config)
  }

  /**
   * Create a scrollable panel using RexUI
   */
  createScrollablePanel(config: any): Phaser.GameObjects.Container | null {
    if (!this.rexUI) {
      console.warn('RexUI not initialized')
      return null
    }
    return this.rexUI.createScrollablePanel(config)
  }

  /**
   * Create a DOM element overlay
   */
  createDOMElement(html: string, styles?: any): HTMLElement | null {
    if (!this.domOverlay) {
      console.warn('DOM Overlay not initialized')
      return null
    }
    return this.domOverlay.createElement(html, styles)
  }

  /**
   * Show notification
   */
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000): void {
    if (this.domOverlay) {
      this.domOverlay.showNotification(message, type, duration)
    } else if (this.rexUI) {
      this.rexUI.showToast(message, duration)
    }
  }

  /**
   * Get RexUI integration
   */
  getRexUI(): RexUIIntegration | undefined {
    return this.rexUI
  }

  /**
   * Get DOM overlay
   */
  getDOMOverlay(): DOMOverlay | undefined {
    return this.domOverlay
  }

  /**
   * Destroy UI manager
   */
  destroy(): void {
    this.closeAllPanels()
    
    this.panels.forEach(panel => panel.destroy())
    this.panels.clear()
    
    if (this.rexUI) {
      this.rexUI.destroy()
    }
    
    if (this.domOverlay) {
      this.domOverlay.destroy()
    }
    
    this.eventBus.removeAllListeners()
  }
}