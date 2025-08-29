/**
 * Core Phaser Framework - TypeScript Edition
 * Main framework class with enhanced features
 */

import * as Phaser from 'phaser';

export interface FrameworkConfig extends Phaser.Types.Core.GameConfig {
    enableRxJS?: boolean;
    enableStateManagement?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableResponsiveDesign?: boolean;
}

export class PhaserFramework extends Phaser.Game {
    private frameworkConfig: FrameworkConfig;

    constructor(config: FrameworkConfig) {
        // Merge with default framework settings
        const defaultConfig: FrameworkConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            backgroundColor: '#2c3e50',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            enableRxJS: true,
            enableStateManagement: true,
            enablePerformanceMonitoring: true,
            enableResponsiveDesign: true,
            ...config
        };

        super(defaultConfig);
        
        this.frameworkConfig = defaultConfig;
        this.initializeFramework();
    }

    private initializeFramework(): void {
        console.log('🎮 Phaser Framework 2025 - Core Initialization');
        console.log('Configuration:', {
            size: `${this.config.width}×${this.config.height}`,
            renderer: 'AUTO',
            rxjs: this.frameworkConfig.enableRxJS,
            stateManagement: this.frameworkConfig.enableStateManagement,
            performance: this.frameworkConfig.enablePerformanceMonitoring,
            responsive: this.frameworkConfig.enableResponsiveDesign
        });

        // Framework ready event
        this.events.once('ready', () => {
            console.log('✅ Phaser Framework 2025 ready!');
        });
    }

    public getFrameworkInfo(): object {
        return {
            version: '2025.1.0',
            phaserVersion: Phaser.VERSION,
            renderer: this.renderer ? 'WebGL/Canvas' : 'Unknown',
            canvas: {
                width: this.canvas.width,
                height: this.canvas.height
            },
            features: {
                rxjs: this.frameworkConfig.enableRxJS,
                stateManagement: this.frameworkConfig.enableStateManagement,
                performance: this.frameworkConfig.enablePerformanceMonitoring,
                responsive: this.frameworkConfig.enableResponsiveDesign
            }
        };
    }

    public destroy(removeCanvas: boolean = true): void {
        console.log('🧹 Destroying Phaser Framework 2025');
        super.destroy(removeCanvas);
    }
}