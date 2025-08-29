import { BehaviorSubject, Observable, fromEvent } from 'rxjs'
import { map, filter, distinctUntilChanged, throttleTime } from 'rxjs/operators'
import { ReactiveEventBus } from '../utils/ReactiveEventBus'

export interface AudioSettings {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  voiceVolume: number
  muted: boolean
  spatialAudio: boolean
  audioQuality: 'low' | 'medium' | 'high'
}

export interface AudioContext3D {
  position: { x: number, y: number, z?: number }
  velocity: { x: number, y: number, z?: number }
  orientation: { x: number, y: number, z?: number }
  maxDistance: number
  rolloffFactor: number
}

/**
 * Reactive Audio Manager with 3D spatial audio support
 * Optimized for mobile H5 games with automatic quality adaptation
 */
export class ReactiveAudioManager {
  private game: Phaser.Game
  private eventBus: ReactiveEventBus
  private settings$ = new BehaviorSubject<AudioSettings>(this.getDefaultSettings())
  private audioContext: AudioContext | null = null
  private spatialContext: AudioContext3D | null = null
  
  // Audio pools for efficient memory usage
  private musicPool = new Map<string, Phaser.Sound.BaseSound>()
  private sfxPool = new Map<string, Phaser.Sound.BaseSound[]>()
  private voicePool = new Map<string, Phaser.Sound.BaseSound>()
  
  // Performance tracking
  private activeAudioCount = 0
  private maxConcurrentAudio = 32

  constructor(game: Phaser.Game) {
    this.game = game
    this.eventBus = ReactiveEventBus.getInstance()
    this.initializeAudioSystem()
  }

  /**
   * Initialize reactive audio system
   */
  private initializeAudioSystem(): void {
    // Initialize Web Audio API if available
    this.initializeWebAudioAPI()
    
    // Setup reactive volume controls
    this.setupVolumeReactions()
    
    // Handle mobile audio restrictions
    this.handleMobileAudioUnlock()
    
    // Performance monitoring
    this.setupPerformanceMonitoring()
    
    // Spatial audio setup
    this.setupSpatialAudio()
  }

  /**
   * Initialize Web Audio API for advanced features
   */
  private initializeWebAudioAPI(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Resume audio context on user interaction (mobile requirement)
      const resumeAudio = () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume()
        }
      }
      
      document.addEventListener('touchstart', resumeAudio, { once: true })
      document.addEventListener('click', resumeAudio, { once: true })
    } catch (error) {
      console.warn('Web Audio API not available:', error)
    }
  }

  /**
   * Setup reactive volume controls
   */
  private setupVolumeReactions(): void {
    this.settings$.pipe(
      distinctUntilChanged((a, b) => 
        a.masterVolume === b.masterVolume &&
        a.musicVolume === b.musicVolume &&
        a.sfxVolume === b.sfxVolume &&
        a.voiceVolume === b.voiceVolume &&
        a.muted === b.muted
      )
    ).subscribe(settings => {
      this.updateGameAudioSettings(settings)
    })

    // React to game state changes
    this.eventBus.getGameState().pipe(
      map(state => state.paused),
      distinctUntilChanged()
    ).subscribe(paused => {
      if (paused) {
        this.pauseAllAudio()
      } else {
        this.resumeAllAudio()
      }
    })
  }

  /**
   * Handle mobile audio unlock requirements
   */
  private handleMobileAudioUnlock(): void {
    if (!this.game.device.input.touch) return

    const unlockAudio = () => {
      // Play silent audio to unlock on mobile
      const silentSound = this.game.sound.add('silence', { volume: 0 })
      if (silentSound) {
        silentSound.play()
        silentSound.destroy()
      }
      
      this.eventBus.emit('audio:unlocked')
      document.removeEventListener('touchstart', unlockAudio)
    }

    document.addEventListener('touchstart', unlockAudio, { once: true })
  }

  /**
   * Setup performance monitoring
   */
  private setupPerformanceMonitoring(): void {
    this.eventBus.createPerformanceMonitor().pipe(
      throttleTime(2000),
      filter(perf => perf.fps < 45 || perf.memory > 100)
    ).subscribe(() => {
      this.adaptAudioQuality('low')
    })
  }

  /**
   * Setup spatial audio system
   */
  private setupSpatialAudio(): void {
    if (!this.audioContext) return

    this.spatialContext = {
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      orientation: { x: 0, y: -1, z: 0 },
      maxDistance: 1000,
      rolloffFactor: 1
    }

    // Update spatial context based on player position
    this.eventBus.getGameState().pipe(
      map(state => state.player.position),
      distinctUntilChanged((a, b) => a.x === b.x && a.y === b.y)
    ).subscribe(position => {
      if (this.spatialContext) {
        this.spatialContext.position = { x: position.x, y: position.y, z: 0 }
        this.updateSpatialAudio()
      }
    })
  }

  /**
   * Music management with crossfading
   */
  playMusic(key: string, options: {
    loop?: boolean
    volume?: number
    fadeIn?: number
    crossfade?: boolean
  } = {}): Observable<Phaser.Sound.BaseSound> {
    return new Observable(observer => {
      const { loop = true, volume = 1, fadeIn = 0, crossfade = false } = options

      // Stop current music if crossfading
      if (crossfade) {
        this.stopCurrentMusic(1000) // 1 second fade out
      }

      // Get or create music sound
      let music = this.musicPool.get(key)
      if (!music) {
        music = this.game.sound.add(key, {
          loop,
          volume: 0
        })
        this.musicPool.set(key, music)
      }

      // Apply current settings
      const settings = this.settings$.value
      const finalVolume = volume * settings.musicVolume * settings.masterVolume
      
      if (fadeIn > 0) {
        // Fade in
        const tweens = (this.game as any).tweens || (this.game.scene.scenes[0] as any)?.tweens
        if (tweens) {
          tweens.add({
            targets: music,
            volume: settings.muted ? 0 : finalVolume,
            duration: fadeIn,
            ease: 'Power2'
          })
        }
      } else {
        if (music && 'setVolume' in music) {
          (music as any).setVolume(settings.muted ? 0 : finalVolume)
        }
      }

      music.play()
      
      this.eventBus.emit('audio:musicStarted', { key, music })
      observer.next(music)
      observer.complete()
    })
  }

  /**
   * Sound effect management with pooling
   */
  playSFX(key: string, options: {
    volume?: number
    rate?: number
    detune?: number
    position?: { x: number, y: number }
    maxDistance?: number
  } = {}): Observable<Phaser.Sound.BaseSound> {
    return new Observable(observer => {
      // Check performance limits
      if (this.activeAudioCount >= this.maxConcurrentAudio) {
        observer.error(new Error('Max concurrent audio limit reached'))
        return
      }

      const { volume = 1, rate = 1, detune = 0, position, maxDistance = 500 } = options

      // Get from pool or create new
      let sfxArray = this.sfxPool.get(key) || []
      let sfx = sfxArray.find(s => !s.isPlaying)
      
      if (!sfx) {
        sfx = this.game.sound.add(key)
        if (!sfx) {
          observer.error(new Error(`Sound '${key}' not found`))
          return
        }
        sfxArray.push(sfx)
        this.sfxPool.set(key, sfxArray)
      }

      // Calculate spatial audio if position provided
      let spatialVolume = volume
      if (position && this.spatialContext) {
        const distance = Math.sqrt(
          Math.pow(position.x - this.spatialContext.position.x, 2) +
          Math.pow(position.y - this.spatialContext.position.y, 2)
        )
        spatialVolume = volume * Math.max(0, 1 - (distance / maxDistance))
      }

      // Apply settings
      const settings = this.settings$.value
      const finalVolume = spatialVolume * settings.sfxVolume * settings.masterVolume

      if ('setVolume' in sfx) (sfx as any).setVolume(settings.muted ? 0 : finalVolume)
      if ('setRate' in sfx) (sfx as any).setRate(rate)
      if ('setDetune' in sfx) (sfx as any).setDetune(detune)

      sfx.play()
      this.activeAudioCount++

      // Cleanup when finished
      sfx.once('complete', () => {
        this.activeAudioCount--
      })

      this.eventBus.emit('audio:sfxPlayed', { key, sfx, position })
      observer.next(sfx)
      observer.complete()
    })
  }

  /**
   * Voice/dialogue management
   */
  playVoice(key: string, options: {
    volume?: number
    onComplete?: () => void
  } = {}): Observable<Phaser.Sound.BaseSound> {
    return new Observable(observer => {
      // Stop current voice
      this.stopCurrentVoice()

      const { volume = 1, onComplete } = options

      let voice = this.voicePool.get(key)
      if (!voice) {
        voice = this.game.sound.add(key)
        if (!voice) {
          observer.error(new Error(`Voice '${key}' not found`))
          return
        }
        this.voicePool.set(key, voice)
      }

      // Apply settings
      const settings = this.settings$.value
      const finalVolume = volume * settings.voiceVolume * settings.masterVolume

      if ('setVolume' in voice) (voice as any).setVolume(settings.muted ? 0 : finalVolume)
      
      if (onComplete) {
        voice.once('complete', onComplete)
      }

      voice.play()
      
      this.eventBus.emit('audio:voiceStarted', { key, voice })
      observer.next(voice)
      observer.complete()
    })
  }

  /**
   * Dynamic music system
   */
  createDynamicMusic(layers: string[], options: {
    baseLayer: string
    transitionTime?: number
  }): Observable<{ addLayer: (layer: string) => void, removeLayer: (layer: string) => void }> {
    return new Observable(observer => {
      const activeLayers = new Map<string, Phaser.Sound.BaseSound>()
      const { baseLayer, transitionTime = 1000 } = options

      // Initialize with base layer
      this.playMusic(baseLayer, { volume: 1 }).subscribe(baseMusic => {
        activeLayers.set(baseLayer, baseMusic)
      })

      // Create layer controls
      const addLayer = (layer: string) => {
        if (activeLayers.has(layer)) return

        this.playMusic(layer, { volume: 0, loop: true }).subscribe(layerMusic => {
          activeLayers.set(layer, layerMusic)
          
          // Fade in layer
          const tweens = (this.game as any).tweens || (this.game.scene.scenes[0] as any)?.tweens
          if (tweens) {
            tweens.add({
              targets: layerMusic,
              volume: this.settings$.value.musicVolume * this.settings$.value.masterVolume,
              duration: transitionTime,
              ease: 'Power2'
            })
          }
        })
      }

      const removeLayer = (layer: string) => {
        const layerMusic = activeLayers.get(layer)
        if (!layerMusic) return

        // Fade out and remove
        const tweens = (this.game as any).tweens || (this.game.scene.scenes[0] as any)?.tweens
        if (tweens) {
          tweens.add({
            targets: layerMusic,
            volume: 0,
            duration: transitionTime,
            ease: 'Power2',
            onComplete: () => {
              layerMusic.stop()
              activeLayers.delete(layer)
            }
          })
        }
      }

      observer.next({ addLayer, removeLayer })
    })
  }

  /**
   * Settings management
   */
  updateSettings(settings: Partial<AudioSettings>): void {
    const current = this.settings$.value
    this.settings$.next({ ...current, ...settings })
  }

  getSettings(): Observable<AudioSettings> {
    return this.settings$.asObservable()
  }

  /**
   * Private helper methods
   */
  private updateGameAudioSettings(settings: AudioSettings): void {
    // Update Phaser sound manager
    this.game.sound.volume = settings.muted ? 0 : settings.masterVolume

    // Update individual sound volumes
    this.musicPool.forEach(music => {
      if (music.isPlaying && 'setVolume' in music) {
        (music as any).setVolume(settings.muted ? 0 : settings.musicVolume * settings.masterVolume)
      }
    })
  }

  private stopCurrentMusic(fadeOut = 0): void {
    this.musicPool.forEach(music => {
      if (music.isPlaying) {
        if (fadeOut > 0) {
          const tweens = (this.game as any).tweens || (this.game.scene.scenes[0] as any)?.tweens
          if (tweens) {
            tweens.add({
              targets: music,
              volume: 0,
              duration: fadeOut,
              ease: 'Power2',
              onComplete: () => music.stop()
            })
          }
        } else {
          music.stop()
        }
      }
    })
  }

  private stopCurrentVoice(): void {
    this.voicePool.forEach(voice => {
      if (voice.isPlaying) {
        voice.stop()
      }
    })
  }

  private pauseAllAudio(): void {
    this.game.sound.pauseAll()
  }

  private resumeAllAudio(): void {
    this.game.sound.resumeAll()
  }

  private updateSpatialAudio(): void {
    // Update 3D audio positions for all spatial sounds
    // This would integrate with Web Audio API's PannerNode
  }

  private adaptAudioQuality(quality: AudioSettings['audioQuality']): void {
    const settings = this.settings$.value
    if (settings.audioQuality !== quality) {
      this.updateSettings({ audioQuality: quality })
      
      // Adjust max concurrent audio based on quality
      switch (quality) {
        case 'low':
          this.maxConcurrentAudio = 16
          break
        case 'medium':
          this.maxConcurrentAudio = 24
          break
        case 'high':
          this.maxConcurrentAudio = 32
          break
      }
    }
  }

  private getDefaultSettings(): AudioSettings {
    return {
      masterVolume: 0.8,
      musicVolume: 0.7,
      sfxVolume: 0.8,
      voiceVolume: 1.0,
      muted: false,
      spatialAudio: true,
      audioQuality: 'medium'
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.settings$.complete()
    
    // Clean up audio pools
    this.musicPool.forEach(music => music.destroy())
    this.sfxPool.forEach(sfxArray => sfxArray.forEach(sfx => sfx.destroy()))
    this.voicePool.forEach(voice => voice.destroy())
    
    this.musicPool.clear()
    this.sfxPool.clear()
    this.voicePool.clear()
    
    if (this.audioContext) {
      this.audioContext.close()
    }
  }
}