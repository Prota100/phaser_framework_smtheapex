/**
 * Main entry point for Phaser Framework 2025
 * TypeScript + Vite + Modern Architecture
 */

import { PhaserFramework } from './core/PhaserFramework';
import { EnhancedResponsiveManager } from './core/EnhancedResponsiveManager';
import { EnhancedEmbedManager } from './core/EnhancedEmbedManager';
import { EnhancedFullscreenManager } from './core/EnhancedFullscreenManager';
import { ReactiveEventBus } from './utils/ReactiveEventBus';
import { GameStateManager } from './state/GameStateManager';

// Global framework instance
let frameworkInstance: PhaserFramework | null = null;

// Global managers
let responsiveManager: EnhancedResponsiveManager | null = null;
let embedManager: EnhancedEmbedManager | null = null;
let fullscreenManager: EnhancedFullscreenManager | null = null;

/**
 * Initialize the framework
 */
export function initializeFramework(): PhaserFramework {
    if (!frameworkInstance) {
        console.log('🚀 Initializing Phaser Framework 2025...');
        
        // Initialize core systems
        const eventBus = ReactiveEventBus.getInstance();
        const stateManager = GameStateManager.getInstance();
        
        // Create framework instance first
        frameworkInstance = new PhaserFramework({
            width: 800,
            height: 600,
            backgroundColor: '#2c3e50',
            parent: 'game-container'
        });
        
        // Initialize managers with framework instance
        responsiveManager = new EnhancedResponsiveManager(frameworkInstance as any);
        embedManager = new EnhancedEmbedManager(frameworkInstance as any);
        fullscreenManager = new EnhancedFullscreenManager();
        
        console.log('✅ Framework initialized successfully!');
    }
    
    return frameworkInstance;
}

/**
 * Get the current framework instance
 */
export function getFramework(): PhaserFramework | null {
    return frameworkInstance;
}

/**
 * Get responsive manager
 */
export function getResponsiveManager(): EnhancedResponsiveManager | null {
    return responsiveManager;
}

/**
 * Get embed manager
 */
export function getEmbedManager(): EnhancedEmbedManager | null {
    return embedManager;
}

/**
 * Get fullscreen manager
 */
export function getFullscreenManager(): EnhancedFullscreenManager | null {
    return fullscreenManager;
}

/**
 * Cleanup framework
 */
export function destroyFramework(): void {
    if (frameworkInstance) {
        frameworkInstance.destroy();
        frameworkInstance = null;
    }
    
    if (responsiveManager) {
        responsiveManager.destroy?.();
        responsiveManager = null;
    }
    
    if (embedManager) {
        embedManager.destroy?.();
        embedManager = null;
    }
    
    if (fullscreenManager) {
        fullscreenManager.destroy?.();
        fullscreenManager = null;
    }
    
    console.log('🧹 Framework cleaned up');
}

// Make functions globally available
(window as any).PhaserFramework2025 = {
    initializeFramework,
    getFramework,
    getResponsiveManager,
    getEmbedManager,
    getFullscreenManager,
    destroyFramework
};

// Initialize framework on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Phaser Framework 2025 - TypeScript Edition Ready!');
    console.log('📦 Build: Vite + Vercel');
    console.log('🎯 Language: TypeScript');
    console.log('🔄 Reactive: RxJS');
    console.log('🎮 Engine: Phaser 3.90.0');
});