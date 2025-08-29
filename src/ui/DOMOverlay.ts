import Phaser from 'phaser'

/**
 * DOM Overlay System - Manages HTML/CSS overlays on top of Phaser
 */
export class DOMOverlay {
  private scene: Phaser.Scene
  private container: HTMLDivElement
  private elements: Map<string, HTMLElement> = new Map()
  private notificationQueue: Array<{ message: string; type: string; duration: number }> = []
  private isShowingNotification: boolean = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.container = this.createContainer()
    this.setupStyles()
  }

  /**
   * Create main container for DOM overlays
   */
  private createContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.id = 'dom-overlay-container'
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `
    
    // Add to game container or body
    const gameContainer = document.getElementById(this.scene.game.config.parent as string)
    if (gameContainer) {
      gameContainer.style.position = 'relative'
      gameContainer.appendChild(container)
    } else {
      document.body.appendChild(container)
    }
    
    return container
  }

  /**
   * Setup global styles
   */
  private setupStyles(): void {
    if (document.getElementById('dom-overlay-styles')) return
    
    const style = document.createElement('style')
    style.id = 'dom-overlay-styles'
    style.textContent = `
      .dom-panel {
        position: absolute;
        background: rgba(30, 30, 40, 0.95);
        border: 2px solid #5e92f3;
        border-radius: 10px;
        padding: 20px;
        pointer-events: all;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out;
      }
      
      .dom-notification {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 25px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        pointer-events: none;
        animation: notificationSlide 0.3s ease-out;
        z-index: 10000;
      }
      
      .dom-notification.info {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .dom-notification.success {
        background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
        color: #1a1a2e;
      }
      
      .dom-notification.warning {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }
      
      .dom-notification.error {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        color: #1a1a2e;
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes notificationSlide {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
      
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      
      .dom-button {
        padding: 10px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: transform 0.2s, box-shadow 0.2s;
        pointer-events: all;
      }
      
      .dom-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      
      .dom-button:active {
        transform: translateY(0);
      }
      
      .dom-input {
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 5px;
        color: white;
        font-size: 14px;
        pointer-events: all;
      }
      
      .dom-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Create a DOM element
   */
  createElement(html: string, styles?: any, id?: string): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = html
    const element = wrapper.firstElementChild as HTMLElement
    
    if (!element) {
      throw new Error('Invalid HTML provided')
    }
    
    // Apply styles
    if (styles) {
      Object.assign(element.style, styles)
    }
    
    // Store reference
    if (id) {
      this.elements.set(id, element)
    }
    
    // Add to container
    this.container.appendChild(element)
    
    return element
  }

  /**
   * Create a panel
   */
  createPanel(config: {
    id: string
    title?: string
    content: string
    x?: number
    y?: number
    width?: number
    height?: number
    closable?: boolean
  }): HTMLElement {
    const html = `
      <div class="dom-panel" id="${config.id}">
        ${config.title ? `<h3 style="margin: 0 0 15px 0; color: #fff;">${config.title}</h3>` : ''}
        ${config.closable ? '<button class="dom-close-btn" style="position: absolute; top: 10px; right: 10px;">×</button>' : ''}
        <div class="dom-panel-content">
          ${config.content}
        </div>
      </div>
    `
    
    const panel = this.createElement(html, {
      left: `${config.x || 50}px`,
      top: `${config.y || 50}px`,
      width: config.width ? `${config.width}px` : 'auto',
      height: config.height ? `${config.height}px` : 'auto'
    }, config.id)
    
    // Setup close button
    if (config.closable) {
      const closeBtn = panel.querySelector('.dom-close-btn') as HTMLButtonElement
      if (closeBtn) {
        closeBtn.onclick = () => this.removeElement(config.id)
      }
    }
    
    // Make draggable
    this.makeDraggable(panel)
    
    return panel
  }

  /**
   * Show notification
   */
  showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration: number = 3000): void {
    // Queue notification
    this.notificationQueue.push({ message, type, duration })
    
    // Process queue
    if (!this.isShowingNotification) {
      this.processNotificationQueue()
    }
  }

  /**
   * Process notification queue
   */
  private processNotificationQueue(): void {
    if (this.notificationQueue.length === 0) {
      this.isShowingNotification = false
      return
    }
    
    this.isShowingNotification = true
    const { message, type, duration } = this.notificationQueue.shift()!
    
    const notification = this.createElement(
      `<div class="dom-notification ${type}">${message}</div>`,
      {},
      `notification-${Date.now()}`
    )
    
    // Auto remove
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-out'
      setTimeout(() => {
        notification.remove()
        this.processNotificationQueue()
      }, 300)
    }, duration)
  }

  /**
   * Make element draggable
   */
  private makeDraggable(element: HTMLElement): void {
    let isDragging = false
    let currentX: number
    let currentY: number
    let initialX: number
    let initialY: number
    
    const dragStart = (e: MouseEvent | TouchEvent) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return
      
      isDragging = true
      element.style.cursor = 'grabbing'
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      initialX = clientX - element.offsetLeft
      initialY = clientY - element.offsetTop
    }
    
    const dragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return
      
      e.preventDefault()
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      
      currentX = clientX - initialX
      currentY = clientY - initialY
      
      element.style.left = `${currentX}px`
      element.style.top = `${currentY}px`
    }
    
    const dragEnd = () => {
      isDragging = false
      element.style.cursor = 'grab'
    }
    
    element.style.cursor = 'grab'
    element.addEventListener('mousedown', dragStart)
    element.addEventListener('touchstart', dragStart)
    
    document.addEventListener('mousemove', dragMove)
    document.addEventListener('touchmove', dragMove)
    
    document.addEventListener('mouseup', dragEnd)
    document.addEventListener('touchend', dragEnd)
  }

  /**
   * Get element by ID
   */
  getElement(id: string): HTMLElement | undefined {
    return this.elements.get(id)
  }

  /**
   * Remove element
   */
  removeElement(id: string): void {
    const element = this.elements.get(id)
    if (element) {
      element.remove()
      this.elements.delete(id)
    }
  }

  /**
   * Clear all elements
   */
  clear(): void {
    this.elements.forEach(element => element.remove())
    this.elements.clear()
  }

  /**
   * Destroy
   */
  destroy(): void {
    this.clear()
    this.container.remove()
    
    // Remove styles if no other instances
    const style = document.getElementById('dom-overlay-styles')
    if (style) {
      style.remove()
    }
  }
}