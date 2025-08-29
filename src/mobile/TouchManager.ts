import Phaser from 'phaser'
import { TouchConfig } from '../types'
import { EventBus } from '../utils/EventBus'

/**
 * Touch Manager for mobile input handling
 */
export class TouchManager {
  private scene: Phaser.Scene
  private eventBus: EventBus
  private config: TouchConfig
  private touchStartTime: number = 0
  private touchStartPos: { x: number; y: number } = { x: 0, y: 0 }
  private lastTapTime: number = 0
  private activeTouches: Map<number, Phaser.Input.Pointer> = new Map()

  constructor(scene: Phaser.Scene, config?: TouchConfig) {
    this.scene = scene
    this.eventBus = EventBus.getInstance()
    this.config = {
      doubleTapDelay: config?.doubleTapDelay || 300,
      swipeThreshold: config?.swipeThreshold || 50,
      holdDelay: config?.holdDelay || 500
    }
    
    this.setupTouchHandlers()
  }

  /**
   * Setup touch event handlers
   */
  private setupTouchHandlers(): void {
    this.scene.input.on('pointerdown', this.handleTouchStart, this)
    this.scene.input.on('pointermove', this.handleTouchMove, this)
    this.scene.input.on('pointerup', this.handleTouchEnd, this)
  }

  /**
   * Handle touch start
   */
  private handleTouchStart(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) return
    
    this.activeTouches.set(pointer.id, pointer)
    
    // Store touch start info for first touch
    if (this.activeTouches.size === 1) {
      this.touchStartTime = Date.now()
      this.touchStartPos = { x: pointer.x, y: pointer.y }
      
      // Setup hold detection
      this.scene.time.delayedCall(this.config.holdDelay!, () => {
        if (this.activeTouches.has(pointer.id)) {
          this.handleHold(pointer)
        }
      })
    }
    
    // Emit touch start
    this.eventBus.emit('touch:start', {
      pointer,
      touches: this.activeTouches.size
    })
    
    // Multi-touch detection
    if (this.activeTouches.size === 2) {
      this.handlePinchStart()
    }
  }

  /**
   * Handle touch move
   */
  private handleTouchMove(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch || !this.activeTouches.has(pointer.id)) return
    
    // Update touch position
    this.activeTouches.set(pointer.id, pointer)
    
    // Emit touch move
    this.eventBus.emit('touch:move', {
      pointer,
      touches: this.activeTouches.size
    })
    
    // Handle pinch/zoom
    if (this.activeTouches.size === 2) {
      this.handlePinchMove()
    }
  }

  /**
   * Handle touch end
   */
  private handleTouchEnd(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch || !this.activeTouches.has(pointer.id)) return
    
    const touchDuration = Date.now() - this.touchStartTime
    const touchDistance = this.getDistance(
      this.touchStartPos,
      { x: pointer.x, y: pointer.y }
    )
    
    // Check for tap
    if (touchDuration < 200 && touchDistance < 10) {
      this.handleTap(pointer)
    }
    
    // Check for swipe
    if (touchDistance > this.config.swipeThreshold!) {
      this.handleSwipe(pointer)
    }
    
    // Remove from active touches
    this.activeTouches.delete(pointer.id)
    
    // Emit touch end
    this.eventBus.emit('touch:end', {
      pointer,
      touches: this.activeTouches.size
    })
  }

  /**
   * Handle tap
   */
  private handleTap(pointer: Phaser.Input.Pointer): void {
    const now = Date.now()
    
    // Check for double tap
    if (now - this.lastTapTime < this.config.doubleTapDelay!) {
      this.eventBus.emit('touch:double-tap', { pointer })
      this.lastTapTime = 0
    } else {
      this.eventBus.emit('touch:tap', { pointer })
      this.lastTapTime = now
    }
  }

  /**
   * Handle swipe
   */
  private handleSwipe(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.touchStartPos.x
    const dy = pointer.y - this.touchStartPos.y
    const angle = Math.atan2(dy, dx)
    
    let direction: 'up' | 'down' | 'left' | 'right'
    
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'right' : 'left'
    } else {
      direction = dy > 0 ? 'down' : 'up'
    }
    
    this.eventBus.emit('touch:swipe', {
      pointer,
      direction,
      distance: this.getDistance(this.touchStartPos, { x: pointer.x, y: pointer.y }),
      angle
    })
  }

  /**
   * Handle hold
   */
  private handleHold(pointer: Phaser.Input.Pointer): void {
    this.eventBus.emit('touch:hold', { pointer })
  }

  /**
   * Handle pinch start
   */
  private handlePinchStart(): void {
    const touches = Array.from(this.activeTouches.values())
    if (touches.length !== 2) return
    
    const distance = this.getDistance(
      { x: touches[0].x, y: touches[0].y },
      { x: touches[1].x, y: touches[1].y }
    )
    
    this.eventBus.emit('touch:pinch-start', {
      distance,
      touches
    })
  }

  /**
   * Handle pinch move
   */
  private handlePinchMove(): void {
    const touches = Array.from(this.activeTouches.values())
    if (touches.length !== 2) return
    
    const distance = this.getDistance(
      { x: touches[0].x, y: touches[0].y },
      { x: touches[1].x, y: touches[1].y }
    )
    
    this.eventBus.emit('touch:pinch-move', {
      distance,
      touches
    })
  }

  /**
   * Get distance between two points
   */
  private getDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Create virtual joystick
   */
  createVirtualJoystick(config?: {
    x?: number
    y?: number
    radius?: number
    baseColor?: number
    thumbColor?: number
  }): Phaser.GameObjects.Container {
    const x = config?.x || 150
    const y = config?.y || this.scene.scale.height - 150
    const radius = config?.radius || 50
    
    const container = this.scene.add.container(x, y)
    
    // Base
    const base = this.scene.add.circle(0, 0, radius, config?.baseColor || 0x888888, 0.5)
    base.setInteractive()
    
    // Thumb
    const thumb = this.scene.add.circle(0, 0, radius * 0.5, config?.thumbColor || 0xcccccc, 0.8)
    
    container.add([base, thumb])
    container.setDepth(1000)
    container.setScrollFactor(0)
    
    // Handle input
    let isDragging = false
    
    base.on('pointerdown', () => {
      isDragging = true
    })
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return
      
      const localX = pointer.x - x
      const localY = pointer.y - y
      const distance = Math.min(radius, Math.sqrt(localX * localX + localY * localY))
      const angle = Math.atan2(localY, localX)
      
      thumb.x = Math.cos(angle) * distance
      thumb.y = Math.sin(angle) * distance
      
      // Emit joystick event
      this.eventBus.emit('joystick:move', {
        x: thumb.x / radius,
        y: thumb.y / radius,
        angle,
        distance: distance / radius
      })
    })
    
    this.scene.input.on('pointerup', () => {
      if (!isDragging) return
      isDragging = false
      
      // Reset thumb position
      this.scene.tweens.add({
        targets: thumb,
        x: 0,
        y: 0,
        duration: 100
      })
      
      // Emit joystick release
      this.eventBus.emit('joystick:release')
    })
    
    return container
  }

  /**
   * Create virtual button
   */
  createVirtualButton(config: {
    x: number
    y: number
    text?: string
    radius?: number
    color?: number
    onPress?: () => void
    onRelease?: () => void
  }): Phaser.GameObjects.Container {
    const container = this.scene.add.container(config.x, config.y)
    const radius = config.radius || 40
    
    // Button background
    const bg = this.scene.add.circle(0, 0, radius, config.color || 0x5e92f3, 0.8)
    bg.setInteractive()
    
    // Button text
    if (config.text) {
      const text = this.scene.add.text(0, 0, config.text, {
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0.5)
      container.add(text)
    }
    
    container.add(bg)
    container.setDepth(1000)
    container.setScrollFactor(0)
    
    // Handle input
    bg.on('pointerdown', () => {
      bg.setScale(0.9)
      if (config.onPress) config.onPress()
    })
    
    bg.on('pointerup', () => {
      bg.setScale(1)
      if (config.onRelease) config.onRelease()
    })
    
    bg.on('pointerout', () => {
      bg.setScale(1)
    })
    
    return container
  }

  /**
   * Destroy touch manager
   */
  destroy(): void {
    this.scene.input.off('pointerdown', this.handleTouchStart, this)
    this.scene.input.off('pointermove', this.handleTouchMove, this)
    this.scene.input.off('pointerup', this.handleTouchEnd, this)
    this.activeTouches.clear()
  }
}