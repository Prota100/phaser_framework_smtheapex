import { BehaviorSubject, Observable, combineLatest } from 'rxjs'
import { map, distinctUntilChanged, filter } from 'rxjs/operators'
import { ReactiveEventBus } from '../utils/ReactiveEventBus'

/**
 * Global game state management with reactive patterns
 * Inspired by modern state management but optimized for games
 */
export interface GameState {
  // Core game state
  scene: string
  loading: boolean
  paused: boolean
  
  // Player state
  player: {
    id: string
    level: number
    experience: number
    health: number
    maxHealth: number
    mana: number
    maxMana: number
    position: { x: number, y: number }
    inventory: any[]
  }
  
  // Game progression
  progress: {
    currentLevel: string
    unlockedLevels: string[]
    achievements: string[]
    score: number
    highScore: number
  }
  
  // UI state
  ui: {
    activeMenus: string[]
    notifications: Array<{id: string, type: string, message: string}>
    modal: string | null
  }
  
  // Performance metrics
  performance: {
    fps: number
    memory: number
    loadTime: number
  }
  
  // Mobile specific
  mobile: {
    orientation: 'portrait' | 'landscape'
    isTouch: boolean
    vibrationEnabled: boolean
  }
}

export class GameStateManager {
  private static instance: GameStateManager
  private eventBus: ReactiveEventBus
  private state$ = new BehaviorSubject<GameState>(this.getInitialState())
  
  private constructor() {
    this.eventBus = ReactiveEventBus.getInstance()
    this.setupStateReactions()
  }

  static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager()
    }
    return GameStateManager.instance
  }

  /**
   * Get current state as observable
   */
  getState(): Observable<GameState> {
    return this.state$.asObservable()
  }

  /**
   * Get current state snapshot
   */
  getCurrentState(): GameState {
    return this.state$.value
  }

  /**
   * Update state partially
   */
  updateState(updates: Partial<GameState>): void {
    const currentState = this.state$.value
    const newState = this.mergeState(currentState, updates)
    this.state$.next(newState)
    
    // Emit to reactive event bus for legacy compatibility
    this.eventBus.emit('state:updated', { previous: currentState, current: newState })
  }

  /**
   * Select specific part of state
   */
  select<K extends keyof GameState>(key: K): Observable<GameState[K]> {
    return this.state$.pipe(
      map(state => state[key]),
      distinctUntilChanged()
    )
  }

  /**
   * Select nested state
   */
  selectNested<T>(selector: (state: GameState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    )
  }

  /**
   * Player state selectors
   */
  selectPlayer() {
    return this.select('player')
  }

  selectPlayerHealth(): Observable<{current: number, max: number, percentage: number}> {
    return this.selectNested(state => ({
      current: state.player.health,
      max: state.player.maxHealth,
      percentage: (state.player.health / state.player.maxHealth) * 100
    }))
  }

  selectPlayerMana(): Observable<{current: number, max: number, percentage: number}> {
    return this.selectNested(state => ({
      current: state.player.mana,
      max: state.player.maxMana,
      percentage: (state.player.mana / state.player.maxMana) * 100
    }))
  }

  /**
   * UI state management
   */
  showModal(modalId: string): void {
    this.updateState({
      ui: { ...this.getCurrentState().ui, modal: modalId }
    })
  }

  hideModal(): void {
    this.updateState({
      ui: { ...this.getCurrentState().ui, modal: null }
    })
  }

  addNotification(notification: {type: string, message: string}): void {
    const currentNotifications = this.getCurrentState().ui.notifications
    const newNotification = {
      id: `notif_${Date.now()}`,
      ...notification
    }
    
    this.updateState({
      ui: {
        ...this.getCurrentState().ui,
        notifications: [...currentNotifications, newNotification]
      }
    })
  }

  removeNotification(id: string): void {
    const currentNotifications = this.getCurrentState().ui.notifications
    this.updateState({
      ui: {
        ...this.getCurrentState().ui,
        notifications: currentNotifications.filter(n => n.id !== id)
      }
    })
  }

  /**
   * Game actions with state updates
   */
  async changeScene(sceneKey: string): Promise<void> {
    this.updateState({ loading: true, scene: sceneKey })
    
    // Simulate scene loading
    await new Promise(resolve => setTimeout(resolve, 100))
    
    this.updateState({ loading: false })
  }

  pauseGame(): void {
    this.updateState({ paused: true })
    this.eventBus.emit('game:paused')
  }

  resumeGame(): void {
    this.updateState({ paused: false })
    this.eventBus.emit('game:resumed')
  }

  updatePlayerHealth(health: number): void {
    const currentPlayer = this.getCurrentState().player
    this.updateState({
      player: { ...currentPlayer, health: Math.max(0, Math.min(health, currentPlayer.maxHealth)) }
    })
  }

  updatePlayerMana(mana: number): void {
    const currentPlayer = this.getCurrentState().player
    this.updateState({
      player: { ...currentPlayer, mana: Math.max(0, Math.min(mana, currentPlayer.maxMana)) }
    })
  }

  updatePlayerPosition(x: number, y: number): void {
    const currentPlayer = this.getCurrentState().player
    this.updateState({
      player: { ...currentPlayer, position: { x, y } }
    })
  }

  addExperience(exp: number): void {
    const currentPlayer = this.getCurrentState().player
    const newExperience = currentPlayer.experience + exp
    const newLevel = Math.floor(newExperience / 100) + 1
    
    this.updateState({
      player: {
        ...currentPlayer,
        experience: newExperience,
        level: Math.max(currentPlayer.level, newLevel)
      }
    })
    
    if (newLevel > currentPlayer.level) {
      this.eventBus.emit('player:levelUp', { newLevel, experience: newExperience })
    }
  }

  unlockAchievement(achievementId: string): void {
    const currentProgress = this.getCurrentState().progress
    if (!currentProgress.achievements.includes(achievementId)) {
      this.updateState({
        progress: {
          ...currentProgress,
          achievements: [...currentProgress.achievements, achievementId]
        }
      })
      this.eventBus.emit('achievement:unlocked', achievementId)
    }
  }

  updateScore(score: number): void {
    const currentProgress = this.getCurrentState().progress
    const newHighScore = Math.max(currentProgress.highScore, score)
    
    this.updateState({
      progress: {
        ...currentProgress,
        score,
        highScore: newHighScore
      }
    })
    
    if (newHighScore > currentProgress.highScore) {
      this.eventBus.emit('score:newHighScore', newHighScore)
    }
  }

  /**
   * Setup reactive patterns
   */
  private setupStateReactions(): void {
    // Auto-save when important state changes
    this.selectNested(state => ({
      level: state.player.level,
      experience: state.player.experience,
      progress: state.progress
    })).subscribe(data => {
      this.eventBus.emit('game:autoSave', data)
    })

    // Health critical threshold monitoring
    this.selectPlayerHealth().pipe(
      filter(health => health.percentage <= 20)
    ).subscribe(health => {
      this.eventBus.emit('player:healthCritical', health)
    })

    // Performance monitoring integration
    this.eventBus.createPerformanceMonitor().subscribe(perf => {
      this.updateState({
        performance: { ...this.getCurrentState().performance, ...perf }
      })
    })

    // Orientation change handling
    this.eventBus.orientationChange().subscribe(orientation => {
      this.updateState({
        mobile: { ...this.getCurrentState().mobile, orientation: orientation.orientation }
      })
    })
  }

  /**
   * Persistence
   */
  saveToStorage(): void {
    const state = this.getCurrentState()
    const persistentData = {
      player: state.player,
      progress: state.progress,
      mobile: state.mobile
    }
    localStorage.setItem('gameState', JSON.stringify(persistentData))
  }

  loadFromStorage(): void {
    const saved = localStorage.getItem('gameState')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        this.updateState(data)
      } catch (error) {
        console.warn('Failed to load saved state:', error)
      }
    }
  }

  /**
   * Utilities
   */
  private getInitialState(): GameState {
    return {
      scene: 'MainMenu',
      loading: false,
      paused: false,
      player: {
        id: 'player',
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        position: { x: 0, y: 0 },
        inventory: []
      },
      progress: {
        currentLevel: 'level1',
        unlockedLevels: ['level1'],
        achievements: [],
        score: 0,
        highScore: 0
      },
      ui: {
        activeMenus: [],
        notifications: [],
        modal: null
      },
      performance: {
        fps: 60,
        memory: 0,
        loadTime: 0
      },
      mobile: {
        orientation: 'portrait',
        isTouch: 'ontouchstart' in window,
        vibrationEnabled: true
      }
    }
  }

  private mergeState(current: GameState, updates: Partial<GameState>): GameState {
    const merged = { ...current }
    
    for (const [key, value] of Object.entries(updates)) {
      const typedKey = key as keyof GameState
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        (merged as any)[typedKey] = { ...(merged as any)[typedKey], ...value }
      } else {
        (merged as any)[typedKey] = value
      }
    }
    
    return merged
  }

  /**
   * Debug utilities
   */
  debug(): void {
    console.log('Current Game State:', this.getCurrentState())
  }

  reset(): void {
    this.state$.next(this.getInitialState())
  }

  destroy(): void {
    this.state$.complete()
  }
}