import Phaser from 'phaser'
import type RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin'

// Scene with RexUI support
export interface RexUIScene extends Phaser.Scene {
  rexUI: RexUIPlugin
}

// Framework Configuration
export interface FrameworkConfig {
  game: {
    width: number
    height: number
    parent?: string
    backgroundColor?: string | number
    renderType?: number
    physics?: Phaser.Types.Core.PhysicsConfig
    scale?: Phaser.Types.Core.ScaleConfig
  }
  ui?: {
    useRexUI?: boolean
    useDOMOverlay?: boolean
    responsiveBreakpoints?: ResponsiveBreakpoints
  }
  performance?: {
    enableMonitoring?: boolean
    targetFPS?: number
    autoOptimize?: boolean
  }
  mobile?: {
    enablePWA?: boolean
    enableTouch?: boolean
    touchConfig?: TouchConfig
  }
  save?: {
    storageKey?: string
    autoSaveInterval?: number
    compression?: boolean
  }
}

// Responsive Breakpoints
export interface ResponsiveBreakpoints {
  mobile: number
  tablet: number
  desktop: number
}

// Touch Configuration
export interface TouchConfig {
  doubleTapDelay?: number
  swipeThreshold?: number
  holdDelay?: number
}

// Save Data Structure
export interface SaveData {
  version: string
  timestamp: number
  data: any
  hash?: string
}

// Event Types
export enum GameEvents {
  SCENE_READY = 'scene:ready',
  SCENE_TRANSITION = 'scene:transition',
  SAVE_GAME = 'save:game',
  LOAD_GAME = 'load:game',
  UI_PANEL_OPEN = 'ui:panel:open',
  UI_PANEL_CLOSE = 'ui:panel:close',
  PERFORMANCE_WARNING = 'performance:warning',
  RESIZE = 'resize',
  ORIENTATION_CHANGE = 'orientation:change'
}

// UI Panel Base Interface
export interface UIPanel {
  id: string
  container: Phaser.GameObjects.Container
  isOpen: boolean
  open(): void
  close(): void
  destroy(): void
}

// Performance Metrics
export interface PerformanceMetrics {
  fps: number
  frameTime: number
  drawCalls: number
  memory?: {
    used: number
    limit: number
  }
}