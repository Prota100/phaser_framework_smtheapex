import Phaser from 'phaser'

/**
 * Asset Loader with progress tracking and caching
 */
export class AssetLoader {
  private scene: Phaser.Scene
  private loadedAssets: Set<string> = new Set()
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Load image assets
   */
  loadImages(assets: Array<{ key: string; path: string }>): void {
    assets.forEach(asset => {
      if (!this.loadedAssets.has(asset.key)) {
        this.scene.load.image(asset.key, asset.path)
        this.loadedAssets.add(asset.key)
      }
    })
  }

  /**
   * Load sprite sheets
   */
  loadSpritesheets(assets: Array<{ 
    key: string; 
    path: string; 
    frameWidth: number; 
    frameHeight: number 
  }>): void {
    assets.forEach(asset => {
      if (!this.loadedAssets.has(asset.key)) {
        this.scene.load.spritesheet(asset.key, asset.path, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        })
        this.loadedAssets.add(asset.key)
      }
    })
  }

  /**
   * Load atlases
   */
  loadAtlases(assets: Array<{ key: string; texture: string; atlas: string }>): void {
    assets.forEach(asset => {
      if (!this.loadedAssets.has(asset.key)) {
        this.scene.load.atlas(asset.key, asset.texture, asset.atlas)
        this.loadedAssets.add(asset.key)
      }
    })
  }

  /**
   * Load audio files
   */
  loadAudio(assets: Array<{ key: string; paths: string[] }>): void {
    assets.forEach(asset => {
      if (!this.loadedAssets.has(asset.key)) {
        this.scene.load.audio(asset.key, asset.paths)
        this.loadedAssets.add(asset.key)
      }
    })
  }

  /**
   * Load JSON data
   */
  loadJSON(assets: Array<{ key: string; path: string }>): void {
    assets.forEach(asset => {
      if (!this.loadedAssets.has(asset.key)) {
        this.scene.load.json(asset.key, asset.path)
        this.loadedAssets.add(asset.key)
      }
    })
  }

  /**
   * Load fonts
   */
  async loadFonts(fonts: Array<{ family: string; url: string }>): Promise<void> {
    const fontPromises = fonts.map(async font => {
      if (!this.loadedAssets.has(font.family)) {
        const fontFace = new FontFace(font.family, `url(${font.url})`)
        await fontFace.load()
        ;(document.fonts as any).add(fontFace)
        this.loadedAssets.add(font.family)
      }
    })
    
    await Promise.all(fontPromises)
  }

  /**
   * Create loading screen
   */
  createLoadingScreen(config?: {
    backgroundColor?: number
    barColor?: number
    textColor?: string
    logo?: string
  }): void {
    const width = this.scene.scale.width
    const height = this.scene.scale.height
    
    // Background
    const bg = this.scene.add.rectangle(
      width / 2, 
      height / 2, 
      width, 
      height, 
      config?.backgroundColor || 0x1a1a2e
    )
    
    // Progress bar background
    const progressBarBg = this.scene.add.rectangle(
      width / 2,
      height / 2,
      400,
      20,
      0x0f0f1e
    )
    
    // Progress bar
    const progressBar = this.scene.add.rectangle(
      width / 2 - 200,
      height / 2,
      0,
      20,
      config?.barColor || 0x5e92f3
    ).setOrigin(0, 0.5)
    
    // Loading text
    const loadingText = this.scene.add.text(
      width / 2,
      height / 2 + 40,
      'Loading... 0%',
      {
        fontSize: '20px',
        color: config?.textColor || '#ffffff',
        fontFamily: 'Arial'
      }
    ).setOrigin(0.5)
    
    // Logo if provided
    let logo: Phaser.GameObjects.Image | undefined
    if (config?.logo && this.scene.textures.exists(config.logo)) {
      logo = this.scene.add.image(width / 2, height / 2 - 100, config.logo)
    }
    
    // Update progress
    this.scene.load.on('progress', (value: number) => {
      progressBar.width = 400 * value
      loadingText.setText(`Loading... ${Math.round(value * 100)}%`)
    })
    
    // Clean up on complete
    this.scene.load.on('complete', () => {
      bg.destroy()
      progressBarBg.destroy()
      progressBar.destroy()
      loadingText.destroy()
      logo?.destroy()
    })
  }

  /**
   * Preload all assets with configuration
   */
  preloadAll(config: {
    images?: Array<{ key: string; path: string }>
    spritesheets?: Array<{ key: string; path: string; frameWidth: number; frameHeight: number }>
    atlases?: Array<{ key: string; texture: string; atlas: string }>
    audio?: Array<{ key: string; paths: string[] }>
    json?: Array<{ key: string; path: string }>
    fonts?: Array<{ family: string; url: string }>
    showLoadingScreen?: boolean
    loadingScreenConfig?: any
  }): void {
    if (config.showLoadingScreen) {
      this.createLoadingScreen(config.loadingScreenConfig)
    }
    
    if (config.images) this.loadImages(config.images)
    if (config.spritesheets) this.loadSpritesheets(config.spritesheets)
    if (config.atlases) this.loadAtlases(config.atlases)
    if (config.audio) this.loadAudio(config.audio)
    if (config.json) this.loadJSON(config.json)
    
    // Fonts are loaded separately as they're async
    if (config.fonts) {
      this.scene.load.on('complete', () => {
        this.loadFonts(config.fonts!)
      })
    }
  }

  /**
   * Check if asset is loaded
   */
  isLoaded(key: string): boolean {
    return this.loadedAssets.has(key)
  }

  /**
   * Clear cache for specific assets
   */
  clearCache(keys?: string[]): void {
    if (keys) {
      keys.forEach(key => {
        this.loadedAssets.delete(key)
        // Also remove from Phaser's cache
        this.scene.textures.remove(key)
        this.scene.cache.audio.remove(key)
        this.scene.cache.json.remove(key)
      })
    } else {
      this.loadedAssets.clear()
    }
  }
}