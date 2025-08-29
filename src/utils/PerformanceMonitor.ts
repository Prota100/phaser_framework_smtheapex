import { PerformanceMetrics, GameEvents } from '../types'
import { EventBus } from './EventBus'

/**
 * Performance Monitor for FPS and memory tracking
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private eventBus: EventBus
  private metrics: PerformanceMetrics
  private targetFPS: number
  private autoOptimize: boolean
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private fpsUpdateInterval: number = 1000
  private lastFPSUpdate: number = 0
  private warningThreshold: number = 0.7 // 70% of target FPS

  private constructor(targetFPS: number = 60, autoOptimize: boolean = true) {
    this.eventBus = EventBus.getInstance()
    this.targetFPS = targetFPS
    this.autoOptimize = autoOptimize
    this.metrics = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(targetFPS?: number, autoOptimize?: boolean): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(targetFPS, autoOptimize)
    }
    return PerformanceMonitor.instance
  }

  /**
   * Update performance metrics
   */
  update(time: number, delta: number): void {
    // Calculate FPS
    this.frameCount++
    this.metrics.frameTime = delta
    
    if (time - this.lastFPSUpdate >= this.fpsUpdateInterval) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (time - this.lastFPSUpdate))
      this.frameCount = 0
      this.lastFPSUpdate = time
      
      // Check performance
      this.checkPerformance()
      
      // Update memory if available
      this.updateMemoryMetrics()
    }
  }

  /**
   * Check performance and emit warnings
   */
  private checkPerformance(): void {
    const fpsRatio = this.metrics.fps / this.targetFPS
    
    if (fpsRatio < this.warningThreshold) {
      this.eventBus.emit(GameEvents.PERFORMANCE_WARNING, {
        fps: this.metrics.fps,
        target: this.targetFPS,
        ratio: fpsRatio
      })
      
      if (this.autoOptimize) {
        this.optimizePerformance()
      }
    }
  }

  /**
   * Update memory metrics
   */
  private updateMemoryMetrics(): void {
    // @ts-ignore - performance.memory is Chrome-specific
    if (performance.memory) {
      // @ts-ignore
      this.metrics.memory = {
        // @ts-ignore
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // Convert to MB
        // @ts-ignore
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
      }
    }
  }

  /**
   * Auto-optimize performance
   */
  private optimizePerformance(): void {
    console.warn(`Performance warning: FPS ${this.metrics.fps}/${this.targetFPS}`)
    
    // Emit optimization event for scenes to handle
    this.eventBus.emit('performance:optimize', {
      level: this.getOptimizationLevel()
    })
  }

  /**
   * Get optimization level based on performance
   */
  private getOptimizationLevel(): 'low' | 'medium' | 'high' {
    const fpsRatio = this.metrics.fps / this.targetFPS
    
    if (fpsRatio < 0.3) return 'high'
    if (fpsRatio < 0.6) return 'medium'
    return 'low'
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get FPS
   */
  getFPS(): number {
    return this.metrics.fps
  }

  /**
   * Get frame time
   */
  getFrameTime(): number {
    return this.metrics.frameTime
  }

  /**
   * Get memory usage
   */
  getMemoryUsage(): { used: number; limit: number } | undefined {
    return this.metrics.memory
  }

  /**
   * Set target FPS
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = fps
  }

  /**
   * Enable/disable auto optimization
   */
  setAutoOptimize(enabled: boolean): void {
    this.autoOptimize = enabled
  }

  /**
   * Create debug overlay
   */
  createDebugOverlay(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const container = scene.add.container(10, 10)
    
    const bg = scene.add.rectangle(0, 0, 150, 80, 0x000000, 0.7)
      .setOrigin(0)
    
    const fpsText = scene.add.text(5, 5, 'FPS: 0', {
      fontSize: '14px',
      color: '#00ff00'
    })
    
    const frameTimeText = scene.add.text(5, 25, 'Frame: 0ms', {
      fontSize: '14px',
      color: '#00ff00'
    })
    
    const memoryText = scene.add.text(5, 45, 'Memory: N/A', {
      fontSize: '14px',
      color: '#00ff00'
    })
    
    container.add([bg, fpsText, frameTimeText, memoryText])
    container.setDepth(Number.MAX_SAFE_INTEGER)
    container.setScrollFactor(0)
    
    // Update text
    scene.events.on('update', () => {
      const metrics = this.getMetrics()
      
      // Update FPS color based on performance
      let fpsColor = '#00ff00' // Green
      if (metrics.fps < this.targetFPS * 0.7) fpsColor = '#ffff00' // Yellow
      if (metrics.fps < this.targetFPS * 0.3) fpsColor = '#ff0000' // Red
      
      fpsText.setText(`FPS: ${metrics.fps}`)
      fpsText.setColor(fpsColor)
      
      frameTimeText.setText(`Frame: ${metrics.frameTime.toFixed(1)}ms`)
      
      if (metrics.memory) {
        memoryText.setText(`Memory: ${metrics.memory.used}/${metrics.memory.limit}MB`)
      }
    })
    
    return container
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      drawCalls: 0
    }
    this.frameCount = 0
    this.lastFPSUpdate = 0
  }
}