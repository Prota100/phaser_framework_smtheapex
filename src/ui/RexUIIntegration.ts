import Phaser from 'phaser'
import type RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'
import { RexUIScene } from '../types'

/**
 * RexUI Integration - Wrapper for RexUI plugin functionality
 */
export class RexUIIntegration {
  private scene: RexUIScene
  private rexUI: RexUIPlugin

  constructor(scene: Phaser.Scene) {
    this.scene = scene as RexUIScene
    this.rexUI = this.scene.rexUI
  }

  /**
   * Create a dialog
   */
  createDialog(config: {
    x?: number
    y?: number
    width?: number
    height?: number
    title?: string
    content?: string
    buttons?: string[]
    background?: any
    closeButton?: boolean
  }): any {
    const dialog = this.rexUI.add.dialog({
      x: config.x || this.scene.scale.width / 2,
      y: config.y || this.scene.scale.height / 2,
      width: config.width || 400,
      height: config.height,
      
      background: this.createBackground(config.background),
      
      title: config.title ? this.createLabel(config.title, 24) : undefined,
      
      content: config.content ? this.createLabel(config.content, 18) : undefined,
      
      actions: config.buttons?.map(text => this.createButton(text)),
      
      space: {
        left: 20, right: 20, top: 20, bottom: 20,
        title: 25,
        content: 25,
        action: 15,
      },
      
      align: {
        title: 'center',
        content: 'center',
        actions: 'center'
      },
      
      expand: {
        title: false,
        content: false
      }
    })
    
    // Layout
    dialog.layout()
    
    // Modal effect
    dialog.popUp(300)
    
    // Setup close button
    if (config.closeButton) {
      dialog.on('button.click', (button: any, groupName: string, index: number) => {
        dialog.scaleDownDestroy(100)
      })
    }
    
    return dialog
  }

  /**
   * Create a scrollable panel
   */
  createScrollablePanel(config: {
    x?: number
    y?: number
    width?: number
    height?: number
    content?: Phaser.GameObjects.GameObject
    scrollMode?: 0 | 1 | 2  // 0: vertical, 1: horizontal, 2: both
  }): any {
    const panel = this.rexUI.add.scrollablePanel({
      x: config.x || this.scene.scale.width / 2,
      y: config.y || this.scene.scale.height / 2,
      width: config.width || 400,
      height: config.height || 300,
      
      scrollMode: config.scrollMode || 0,
      
      background: this.createBackground(),
      
      panel: {
        child: config.content || this.scene.add.container(),
        mask: {
          padding: 1
        }
      },
      
      slider: {
        track: this.createBackground({ color: 0x260e04 }),
        thumb: this.createBackground({ color: 0x7b5e57 })
      },
      
      space: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10,
        panel: 10
      }
    })
    
    panel.layout()
    
    return panel
  }

  /**
   * Create a tabbed panel
   */
  createTabbedPanel(config: {
    x?: number
    y?: number
    width?: number
    height?: number
    tabs: Array<{ key: string; title: string; content: any }>
  }): any {
    // Simplified tabs implementation
    const container = this.scene.add.container(
      config.x || this.scene.scale.width / 2,
      config.y || this.scene.scale.height / 2
    )
    
    const bg = this.createBackground()
    container.add(bg)
    
    // Add tab buttons
    config.tabs.forEach((tab, index) => {
      const button = this.createButton(tab.title)
      button.x = -150 + (index * 100)
      button.y = -100
      container.add(button)
    })
    
    return container
  }

  /**
   * Create a toast notification
   */
  showToast(message: string, duration: number = 3000): void {
    const toast = this.rexUI.add.toast({
      x: this.scene.scale.width / 2,
      y: 100,
      
      background: this.createBackground({ color: 0x000000, alpha: 0.8 }),
      text: this.createLabel(message, 16, 0xffffff),
      
      space: {
        left: 20,
        right: 20,
        top: 10,
        bottom: 10
      },
      
      duration: {
        in: 200,
        hold: duration,
        out: 200
      }
    })
    
    toast.show()
  }

  /**
   * Create a simple button
   */
  createButton(text: string, fontSize: number = 16): any {
    return this.rexUI.add.label({
      background: this.createBackground({ color: 0x5e92f3 }),
      text: this.createLabel(text, fontSize),
      space: {
        left: 10,
        right: 10,
        top: 10,
        bottom: 10
      }
    })
  }

  /**
   * Create a background
   */
  private createBackground(config?: { color?: number; alpha?: number }): any {
    return this.rexUI.add.roundRectangle(
      0, 0, 2, 2, 10,
      config?.color || 0x4e342e,
      config?.alpha || 1
    )
  }

  /**
   * Create a label
   */
  private createLabel(text: string, fontSize: number = 18, color: number = 0xffffff): Phaser.GameObjects.Text {
    return this.scene.add.text(0, 0, text, {
      fontSize: `${fontSize}px`,
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontFamily: 'Arial'
    })
  }

  /**
   * Create a sizer (layout container)
   */
  createSizer(orientation: 0 | 1 = 0): any {  // 0: vertical, 1: horizontal
    return this.rexUI.add.sizer({
      orientation: orientation
    })
  }

  /**
   * Create a grid sizer
   */
  createGridSizer(columns: number, rows: number): any {
    return this.rexUI.add.gridSizer({
      column: columns,
      row: rows,
      space: {
        column: 10,
        row: 10
      }
    })
  }

  /**
   * Destroy
   */
  destroy(): void {
    // RexUI components are destroyed with the scene
  }
}