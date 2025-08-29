import { SaveData, GameEvents } from '../types'
import { EventBus } from './EventBus'

/**
 * Save/Load Manager with compression and integrity checking
 */
export class SaveManager {
  private storageKey: string
  private eventBus: EventBus
  private autoSaveInterval: number
  private autoSaveTimer?: number
  private useCompression: boolean

  constructor(storageKey: string = 'game-save', autoSaveInterval: number = 30000, useCompression: boolean = false) {
    this.storageKey = storageKey
    this.eventBus = EventBus.getInstance()
    this.autoSaveInterval = autoSaveInterval
    this.useCompression = useCompression
    
    if (this.autoSaveInterval > 0) {
      this.startAutoSave()
    }
  }

  /**
   * Save game data
   */
  async save(data: any): Promise<boolean> {
    try {
      const saveData: SaveData = {
        version: this.getVersion(),
        timestamp: Date.now(),
        data: data,
        hash: this.generateHash(data)
      }
      
      let serialized = JSON.stringify(saveData)
      
      // Apply compression if enabled
      if (this.useCompression) {
        serialized = await this.compress(serialized)
      }
      
      localStorage.setItem(this.storageKey, serialized)
      
      this.eventBus.emit(GameEvents.SAVE_GAME, saveData)
      
      console.log('Game saved successfully')
      return true
    } catch (error) {
      console.error('Failed to save game:', error)
      return false
    }
  }

  /**
   * Load game data
   */
  async load(): Promise<any | null> {
    try {
      let serialized = localStorage.getItem(this.storageKey)
      
      if (!serialized) {
        console.log('No save data found')
        return null
      }
      
      // Decompress if needed
      if (this.useCompression) {
        serialized = await this.decompress(serialized)
      }
      
      const saveData: SaveData = JSON.parse(serialized)
      
      // Verify integrity
      if (!this.verifyIntegrity(saveData)) {
        console.warn('Save data integrity check failed')
        return null
      }
      
      // Check version compatibility
      if (!this.isVersionCompatible(saveData.version)) {
        console.warn('Save data version incompatible')
        return this.migrate(saveData)
      }
      
      this.eventBus.emit(GameEvents.LOAD_GAME, saveData)
      
      console.log('Game loaded successfully')
      return saveData.data
    } catch (error) {
      console.error('Failed to load game:', error)
      return null
    }
  }

  /**
   * Delete save data
   */
  delete(): boolean {
    try {
      localStorage.removeItem(this.storageKey)
      console.log('Save data deleted')
      return true
    } catch (error) {
      console.error('Failed to delete save data:', error)
      return false
    }
  }

  /**
   * Check if save exists
   */
  exists(): boolean {
    return localStorage.getItem(this.storageKey) !== null
  }

  /**
   * Get save metadata without loading full data
   */
  getMetadata(): { version: string; timestamp: number } | null {
    try {
      const serialized = localStorage.getItem(this.storageKey)
      if (!serialized) return null
      
      // Parse just enough to get metadata
      const saveData = JSON.parse(serialized.substring(0, 200) + '}}')
      return {
        version: saveData.version,
        timestamp: saveData.timestamp
      }
    } catch {
      return null
    }
  }

  /**
   * Start auto-save
   */
  private startAutoSave(): void {
    this.stopAutoSave()
    
    this.autoSaveTimer = window.setInterval(() => {
      this.eventBus.emit('autosave:trigger')
    }, this.autoSaveInterval)
  }

  /**
   * Stop auto-save
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = undefined
    }
  }

  /**
   * Generate hash for integrity checking
   */
  private generateHash(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return hash.toString(36)
  }

  /**
   * Verify save data integrity
   */
  private verifyIntegrity(saveData: SaveData): boolean {
    if (!saveData.hash) return true // No hash, skip verification
    
    const expectedHash = this.generateHash(saveData.data)
    return saveData.hash === expectedHash
  }

  /**
   * Get current version
   */
  private getVersion(): string {
    return '1.0.0' // Should be loaded from package.json or config
  }

  /**
   * Check version compatibility
   */
  private isVersionCompatible(version: string): boolean {
    const current = this.getVersion().split('.').map(Number)
    const saved = version.split('.').map(Number)
    
    // Major version must match
    return current[0] === saved[0]
  }

  /**
   * Migrate old save data
   */
  private migrate(saveData: SaveData): any {
    console.log(`Migrating save from v${saveData.version} to v${this.getVersion()}`)
    
    // Implement migration logic based on versions
    // This is a placeholder implementation
    return saveData.data
  }

  /**
   * Compress data (placeholder - implement actual compression if needed)
   */
  private async compress(data: string): Promise<string> {
    // In a real implementation, you might use a library like lz-string
    return btoa(data) // Simple base64 encoding for now
  }

  /**
   * Decompress data (placeholder - implement actual decompression if needed)
   */
  private async decompress(data: string): Promise<string> {
    // In a real implementation, you might use a library like lz-string
    return atob(data) // Simple base64 decoding for now
  }

  /**
   * Export save as downloadable file
   */
  exportSave(): void {
    const saveData = localStorage.getItem(this.storageKey)
    if (!saveData) {
      console.warn('No save data to export')
      return
    }
    
    const blob = new Blob([saveData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gamesave-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Import save from file
   */
  async importSave(file: File): Promise<boolean> {
    try {
      const text = await file.text()
      localStorage.setItem(this.storageKey, text)
      console.log('Save imported successfully')
      return true
    } catch (error) {
      console.error('Failed to import save:', error)
      return false
    }
  }

  /**
   * Destroy save manager
   */
  destroy(): void {
    this.stopAutoSave()
  }
}