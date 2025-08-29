/**
 * Game State Manager - TypeScript Edition  
 * RxJS-based global state management
 */

import { BehaviorSubject, Observable } from 'rxjs';

export interface GlobalGameState {
    isInitialized: boolean;
    currentScene: string;
    playerData: any;
    gameSettings: any;
}

export class GameStateManager {
    private static instance: GameStateManager;
    private state$ = new BehaviorSubject<GlobalGameState>({
        isInitialized: false,
        currentScene: '',
        playerData: {},
        gameSettings: {}
    });

    private constructor() {
        console.log('🔄 Game State Manager initialized');
    }

    static getInstance(): GameStateManager {
        if (!GameStateManager.instance) {
            GameStateManager.instance = new GameStateManager();
        }
        return GameStateManager.instance;
    }

    getState(): Observable<GlobalGameState> {
        return this.state$.asObservable();
    }

    getCurrentState(): GlobalGameState {
        return this.state$.value;
    }

    updateState(updates: Partial<GlobalGameState>): void {
        const currentState = this.state$.value;
        this.state$.next({ ...currentState, ...updates });
    }

    destroy(): void {
        this.state$.complete();
        console.log('🔄 Game State Manager destroyed');
    }
}