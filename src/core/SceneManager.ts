import Phaser from 'phaser'
import { EventBus } from '../utils/EventBus'
import { GameEvents } from '../types'

/**
 * Scene Manager for handling scene transitions and state
 */
export class SceneManager {
  private game: Phaser.Game
  private eventBus: EventBus
  private sceneStack: string[] = []
  private sceneData: Map<string, any> = new Map()

  constructor(game: Phaser.Game) {
    this.game = game
    this.eventBus = EventBus.getInstance()
    this.setupEventListeners()
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.eventBus.on(GameEvents.SCENE_TRANSITION, this.handleSceneTransition, this)
  }

  /**
   * Handle scene transition event
   */
  private handleSceneTransition(data: { from: string; to: string; data?: any }): void {
    this.transition(data.to, data.data, data.from)
  }

  /**
   * Start a scene
   */
  start(sceneKey: string, data?: any): void {
    this.game.scene.start(sceneKey, data)
    this.sceneStack = [sceneKey]
    if (data) {
      this.sceneData.set(sceneKey, data)
    }
  }

  /**
   * Transition to a scene
   */
  transition(sceneKey: string, data?: any, fromScene?: string): void {
    if (fromScene) {
      this.game.scene.stop(fromScene)
    }
    
    this.game.scene.start(sceneKey, data)
    this.sceneStack.push(sceneKey)
    
    if (data) {
      this.sceneData.set(sceneKey, data)
    }
  }

  /**
   * Push a scene (pause current, start new)
   */
  push(sceneKey: string, data?: any): void {
    const currentScene = this.getCurrentScene()
    if (currentScene) {
      this.game.scene.pause(currentScene)
    }
    
    this.game.scene.start(sceneKey, data)
    this.sceneStack.push(sceneKey)
    
    if (data) {
      this.sceneData.set(sceneKey, data)
    }
  }

  /**
   * Pop a scene (stop current, resume previous)
   */
  pop(): string | null {
    if (this.sceneStack.length <= 1) {
      console.warn('Cannot pop the last scene')
      return null
    }
    
    const currentScene = this.sceneStack.pop()!
    this.game.scene.stop(currentScene)
    this.sceneData.delete(currentScene)
    
    const previousScene = this.getCurrentScene()
    if (previousScene) {
      this.game.scene.resume(previousScene)
    }
    
    return currentScene
  }

  /**
   * Replace current scene
   */
  replace(sceneKey: string, data?: any): void {
    const currentScene = this.getCurrentScene()
    if (currentScene) {
      this.game.scene.stop(currentScene)
      this.sceneStack.pop()
      this.sceneData.delete(currentScene)
    }
    
    this.game.scene.start(sceneKey, data)
    this.sceneStack.push(sceneKey)
    
    if (data) {
      this.sceneData.set(sceneKey, data)
    }
  }

  /**
   * Get current active scene
   */
  getCurrentScene(): string | null {
    return this.sceneStack[this.sceneStack.length - 1] || null
  }

  /**
   * Get scene data
   */
  getSceneData(sceneKey: string): any {
    return this.sceneData.get(sceneKey)
  }

  /**
   * Check if scene is active
   */
  isSceneActive(sceneKey: string): boolean {
    return this.game.scene.isActive(sceneKey)
  }

  /**
   * Check if scene is paused
   */
  isScenePaused(sceneKey: string): boolean {
    return this.game.scene.isPaused(sceneKey)
  }

  /**
   * Pause a scene
   */
  pause(sceneKey?: string): void {
    const scene = sceneKey || this.getCurrentScene()
    if (scene) {
      this.game.scene.pause(scene)
    }
  }

  /**
   * Resume a scene
   */
  resume(sceneKey?: string): void {
    const scene = sceneKey || this.getCurrentScene()
    if (scene) {
      this.game.scene.resume(scene)
    }
  }

  /**
   * Stop a scene
   */
  stop(sceneKey?: string): void {
    const scene = sceneKey || this.getCurrentScene()
    if (scene) {
      this.game.scene.stop(scene)
      const index = this.sceneStack.indexOf(scene)
      if (index > -1) {
        this.sceneStack.splice(index, 1)
      }
      this.sceneData.delete(scene)
    }
  }

  /**
   * Restart current scene
   */
  restart(data?: any): void {
    const currentScene = this.getCurrentScene()
    if (currentScene) {
      this.game.scene.start(currentScene, data)
      if (data) {
        this.sceneData.set(currentScene, data)
      }
    }
  }

  /**
   * Get all active scenes
   */
  getActiveScenes(): string[] {
    return this.sceneStack.slice()
  }

  /**
   * Clear all scenes except one
   */
  clearAllExcept(sceneKey: string): void {
    const scenesToStop = this.sceneStack.filter(s => s !== sceneKey)
    scenesToStop.forEach(scene => {
      this.game.scene.stop(scene)
      this.sceneData.delete(scene)
    })
    this.sceneStack = [sceneKey]
  }

  /**
   * Destroy scene manager
   */
  destroy(): void {
    this.eventBus.off(GameEvents.SCENE_TRANSITION, this.handleSceneTransition, this)
    this.sceneStack = []
    this.sceneData.clear()
  }
}