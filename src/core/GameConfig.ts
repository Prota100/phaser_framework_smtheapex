import { FrameworkConfig } from '../types'

/**
 * Default game configuration
 */
export const DEFAULT_GAME_CONFIG: FrameworkConfig = {
  game: {
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: 0x1a1a2e,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: '100%',
      height: '100%',
      autoRound: true
    }
  },
  ui: {
    useRexUI: true,
    useDOMOverlay: true,
    responsiveBreakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1440
    }
  },
  performance: {
    enableMonitoring: false,
    targetFPS: 60,
    autoOptimize: true
  },
  mobile: {
    enablePWA: false,
    enableTouch: true,
    touchConfig: {
      doubleTapDelay: 300,
      swipeThreshold: 50,
      holdDelay: 500
    }
  },
  save: {
    storageKey: 'game-save',
    autoSaveInterval: 30000,
    compression: false
  }
}

/**
 * Merge configurations
 */
export function mergeConfig(userConfig: Partial<FrameworkConfig>, defaultConfig: FrameworkConfig = DEFAULT_GAME_CONFIG): FrameworkConfig {
  return {
    game: { ...defaultConfig.game, ...userConfig.game },
    ui: { ...defaultConfig.ui, ...userConfig.ui },
    performance: { ...defaultConfig.performance, ...userConfig.performance },
    mobile: { ...defaultConfig.mobile, ...userConfig.mobile },
    save: { ...defaultConfig.save, ...userConfig.save }
  }
}