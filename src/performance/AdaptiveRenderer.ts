import { Observable, BehaviorSubject, combineLatest } from 'rxjs'
import { map, distinctUntilChanged, throttleTime, filter } from 'rxjs/operators'
import { ReactiveEventBus } from '../utils/ReactiveEventBus'

export interface RenderSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra'
  targetFPS: number
  resolution: number
  antialiasing: boolean
  particleLimit: number
  shadowQuality: 'off' | 'low' | 'high'
  postProcessing: boolean
}

export interface AdaptivePerformanceMetrics {
  fps: number
  frameTime: number
  memory: number
  drawCalls: number
  triangles: number
  batteryLevel?: number
  thermal?: 'normal' | 'fair' | 'serious' | 'critical'
}

/**
 * Adaptive Rendering System for Mobile H5 Games
 * Automatically adjusts visual quality based on device performance
 */
export class AdaptiveRenderer {
  private eventBus: ReactiveEventBus
  private game: Phaser.Game
  private currentSettings$ = new BehaviorSubject<RenderSettings>(this.getDefaultSettings())
  private performanceMetrics$ = new BehaviorSubject<AdaptivePerformanceMetrics>(this.getInitialMetrics())
  
  // Performance thresholds
  private thresholds = {
    fpsTargets: { high: 58, medium: 45, low: 30 },
    memoryWarning: 150, // MB
    thermalThrottling: 'fair' as const
  }

  // Device classification
  private deviceTier: 'low' | 'mid' | 'high' = 'mid'
  
  constructor(game: Phaser.Game) {
    this.game = game
    this.eventBus = ReactiveEventBus.getInstance()
    this.detectDeviceTier()
    this.initializeAdaptiveRendering()
  }

  /**
   * Initialize adaptive rendering system
   */
  private initializeAdaptiveRendering(): void {
    // Monitor performance metrics
    this.monitorPerformance()
    
    // React to performance changes
    this.setupPerformanceReactions()
    
    // Handle device specific events
    this.handleDeviceEvents()
    
    // Initial quality adjustment
    this.adjustQualityBasedOnDevice()
  }

  /**
   * Monitor performance metrics
   */
  private monitorPerformance(): void {
    // FPS monitoring
    const performanceMonitor = this.eventBus.createPerformanceMonitor()
    
    performanceMonitor.subscribe(metrics => {
      const extendedMetrics: AdaptivePerformanceMetrics = {
        ...metrics,
        frameTime: 1000 / metrics.fps,
        drawCalls: this.estimateDrawCalls(),
        triangles: this.estimateTriangles(),
        batteryLevel: this.getBatteryLevel(),
        thermal: this.getThermalState()
      }
      
      this.performanceMetrics$.next(extendedMetrics)
    })

    // Memory pressure monitoring
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = (performance as any).memory
        if (memInfo && memInfo.usedJSHeapSize) {
          const memoryMB = memInfo.usedJSHeapSize / 1024 / 1024
          const current = this.performanceMetrics$.value
          this.performanceMetrics$.next({
            ...current,
            memory: memoryMB
          })
        }
      }, 2000)
    }
  }

  /**
   * Setup performance-based reactions
   */
  private setupPerformanceReactions(): void {
    // Combine performance metrics with current settings
    combineLatest([
      this.performanceMetrics$.pipe(throttleTime(1000)),
      this.currentSettings$
    ]).pipe(
      map(([metrics, settings]) => this.calculateOptimalSettings(metrics, settings)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    ).subscribe(newSettings => {
      this.applyRenderSettings(newSettings)
    })

    // Emergency quality reduction
    this.performanceMetrics$.pipe(
      filter(metrics => metrics.fps < 20 || metrics.memory > this.thresholds.memoryWarning),
      throttleTime(5000) // Don't react too frequently
    ).subscribe(() => {
      this.emergencyQualityReduction()
    })
  }

  /**
   * Calculate optimal settings based on performance
   */
  private calculateOptimalSettings(metrics: AdaptivePerformanceMetrics, currentSettings: RenderSettings): RenderSettings {
    const newSettings = { ...currentSettings }
    
    // FPS-based adjustments
    if (metrics.fps < this.thresholds.fpsTargets.low) {
      newSettings.quality = 'low'
      newSettings.resolution = 0.5
      newSettings.antialiasing = false
      newSettings.particleLimit = 50
      newSettings.shadowQuality = 'off'
      newSettings.postProcessing = false
    } else if (metrics.fps < this.thresholds.fpsTargets.medium) {
      newSettings.quality = 'medium'
      newSettings.resolution = 0.7
      newSettings.antialiasing = false
      newSettings.particleLimit = 100
      newSettings.shadowQuality = 'low'
      newSettings.postProcessing = false
    } else if (metrics.fps >= this.thresholds.fpsTargets.high) {
      // Can potentially increase quality
      if (this.deviceTier === 'high' && currentSettings.quality !== 'ultra') {
        newSettings.quality = 'high'
        newSettings.resolution = 1.0
        newSettings.antialiasing = true
        newSettings.particleLimit = 300
        newSettings.shadowQuality = 'high'
        newSettings.postProcessing = true
      }
    }

    // Memory-based adjustments
    if (metrics.memory > this.thresholds.memoryWarning * 0.8) {
      newSettings.particleLimit = Math.min(newSettings.particleLimit, 50)
      newSettings.postProcessing = false
    }

    // Thermal throttling
    if (metrics.thermal && ['serious', 'critical'].includes(metrics.thermal)) {
      newSettings.quality = 'low'
      newSettings.targetFPS = 30
    }

    // Battery optimization
    if (metrics.batteryLevel && metrics.batteryLevel < 20) {
      newSettings.quality = 'low'
      newSettings.targetFPS = 30
      newSettings.postProcessing = false
    }

    return newSettings
  }

  /**
   * Apply render settings to the game
   */
  private applyRenderSettings(settings: RenderSettings): void {
    const currentSettings = this.currentSettings$.value
    
    // Only apply if settings actually changed
    if (JSON.stringify(settings) === JSON.stringify(currentSettings)) {
      return
    }

    console.log('🎮 Adaptive Renderer: Applying settings', settings)

    // Update resolution
    if (settings.resolution !== currentSettings.resolution) {
      this.updateResolution(settings.resolution)
    }

    // Update render settings
    if (this.game.renderer) {
      const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer
      
      if (renderer.gl) {
        // Update antialiasing (requires context recreation)
        if (settings.antialiasing !== currentSettings.antialiasing) {
          this.updateAntialiasing(settings.antialiasing)
        }
      }
    }

    // Update particle limits
    this.updateParticleLimit(settings.particleLimit)

    // Update shadow quality
    this.updateShadowQuality(settings.shadowQuality)

    // Emit settings change event
    this.eventBus.emit('renderer:settingsChanged', {
      previous: currentSettings,
      current: settings,
      reason: 'performance_adaptation'
    })

    this.currentSettings$.next(settings)
  }

  /**
   * Emergency quality reduction
   */
  private emergencyQualityReduction(): void {
    console.warn('🚨 Emergency quality reduction triggered')
    
    const emergencySettings: RenderSettings = {
      quality: 'low',
      targetFPS: 30,
      resolution: 0.5,
      antialiasing: false,
      particleLimit: 25,
      shadowQuality: 'off',
      postProcessing: false
    }

    this.applyRenderSettings(emergencySettings)
    this.eventBus.emit('renderer:emergencyMode', emergencySettings)
  }

  /**
   * Device tier detection
   */
  private detectDeviceTier(): void {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    
    if (!gl) {
      this.deviceTier = 'low'
      return
    }

    const renderer = gl.getParameter(gl.RENDERER)
    const vendor = gl.getParameter(gl.VENDOR)
    
    // Simple heuristics (can be expanded)
    const gpuInfo = `${vendor} ${renderer}`.toLowerCase()
    
    if (gpuInfo.includes('adreno 6') || gpuInfo.includes('mali-g7') || gpuInfo.includes('apple a1')) {
      this.deviceTier = 'high'
    } else if (gpuInfo.includes('adreno 5') || gpuInfo.includes('mali-g') || gpuInfo.includes('apple a')) {
      this.deviceTier = 'mid'
    } else {
      this.deviceTier = 'low'
    }

    // Memory consideration
    const deviceMemory = (navigator as any).deviceMemory
    if (deviceMemory && deviceMemory < 3) {
      this.deviceTier = 'low'
    } else if (deviceMemory && deviceMemory >= 6) {
      this.deviceTier = 'high'
    }

    console.log(`🎮 Device tier detected: ${this.deviceTier}`)
  }

  /**
   * Adjust quality based on device capabilities
   */
  private adjustQualityBasedOnDevice(): void {
    let initialSettings: RenderSettings

    switch (this.deviceTier) {
      case 'high':
        initialSettings = {
          quality: 'high',
          targetFPS: 60,
          resolution: 1.0,
          antialiasing: true,
          particleLimit: 300,
          shadowQuality: 'high',
          postProcessing: true
        }
        break
      
      case 'mid':
        initialSettings = {
          quality: 'medium',
          targetFPS: 60,
          resolution: 0.8,
          antialiasing: false,
          particleLimit: 150,
          shadowQuality: 'low',
          postProcessing: false
        }
        break
      
      case 'low':
        initialSettings = {
          quality: 'low',
          targetFPS: 30,
          resolution: 0.6,
          antialiasing: false,
          particleLimit: 50,
          shadowQuality: 'off',
          postProcessing: false
        }
        break
    }

    this.currentSettings$.next(initialSettings)
  }

  /**
   * Handle device-specific events
   */
  private handleDeviceEvents(): void {
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.applyRenderSettings({
          ...this.currentSettings$.value,
          targetFPS: 10 // Reduce FPS when not visible
        })
      }
    })

    // Handle page focus
    window.addEventListener('blur', () => {
      this.applyRenderSettings({
        ...this.currentSettings$.value,
        targetFPS: 15
      })
    })
  }

  /**
   * Utility methods for applying settings
   */
  private updateResolution(scale: number): void {
    if (this.game.scale) {
      this.game.scale.setZoom(scale)
    }
  }

  private updateAntialiasing(enabled: boolean): void {
    // This would require recreating the renderer context
    // In practice, this is often set at initialization
    this.eventBus.emit('renderer:antialiasingChanged', enabled)
  }

  private updateParticleLimit(limit: number): void {
    this.eventBus.emit('particles:limitChanged', limit)
  }

  private updateShadowQuality(quality: RenderSettings['shadowQuality']): void {
    this.eventBus.emit('shadows:qualityChanged', quality)
  }

  /**
   * Estimation methods (would be replaced with actual game metrics)
   */
  private estimateDrawCalls(): number {
    return Math.floor(Math.random() * 100) + 50
  }

  private estimateTriangles(): number {
    return Math.floor(Math.random() * 10000) + 5000
  }

  private getBatteryLevel(): number | undefined {
    return (navigator as any).getBattery?.()?.then((battery: any) => battery.level * 100)
  }

  private getThermalState(): AdaptivePerformanceMetrics['thermal'] {
    // This would integrate with actual thermal APIs when available
    return 'normal'
  }

  /**
   * Public API
   */
  getCurrentSettings(): Observable<RenderSettings> {
    return this.currentSettings$.asObservable()
  }

  getPerformanceMetrics(): Observable<AdaptivePerformanceMetrics> {
    return this.performanceMetrics$.asObservable()
  }

  forceQuality(quality: RenderSettings['quality']): void {
    const settings = this.getSettingsForQuality(quality)
    this.applyRenderSettings(settings)
  }

  private getSettingsForQuality(quality: RenderSettings['quality']): RenderSettings {
    const baseSettings = this.currentSettings$.value
    
    switch (quality) {
      case 'low':
        return { ...baseSettings, quality, resolution: 0.5, antialiasing: false, particleLimit: 50 }
      case 'medium':
        return { ...baseSettings, quality, resolution: 0.7, antialiasing: false, particleLimit: 150 }
      case 'high':
        return { ...baseSettings, quality, resolution: 0.9, antialiasing: true, particleLimit: 250 }
      case 'ultra':
        return { ...baseSettings, quality, resolution: 1.0, antialiasing: true, particleLimit: 400 }
      default:
        return baseSettings
    }
  }

  private getDefaultSettings(): RenderSettings {
    return {
      quality: 'medium',
      targetFPS: 60,
      resolution: 1.0,
      antialiasing: false,
      particleLimit: 150,
      shadowQuality: 'low',
      postProcessing: false
    }
  }

  private getInitialMetrics(): AdaptivePerformanceMetrics {
    return {
      fps: 60,
      frameTime: 16.67,
      memory: 0,
      drawCalls: 0,
      triangles: 0
    }
  }

  destroy(): void {
    this.currentSettings$.complete()
    this.performanceMetrics$.complete()
  }
}