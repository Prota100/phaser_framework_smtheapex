import { Subject, Observable, BehaviorSubject, fromEvent, merge, timer } from 'rxjs'
import { filter, map, share, distinctUntilChanged, debounceTime, throttleTime, buffer, bufferTime, take, switchMap, takeUntil, scan } from 'rxjs/operators'

/**
 * Reactive Event Bus using RxJS for advanced game event handling
 * Provides reactive programming patterns for game events
 */
export class ReactiveEventBus {
  private static instance: ReactiveEventBus
  private subjects = new Map<string, Subject<any>>()
  private gameState$ = new BehaviorSubject<any>({})
  
  private constructor() {}

  static getInstance(): ReactiveEventBus {
    if (!ReactiveEventBus.instance) {
      ReactiveEventBus.instance = new ReactiveEventBus()
    }
    return ReactiveEventBus.instance
  }

  /**
   * Create or get observable stream for an event
   */
  stream<T = any>(eventName: string): Observable<T> {
    if (!this.subjects.has(eventName)) {
      this.subjects.set(eventName, new Subject<T>())
    }
    return this.subjects.get(eventName)!.asObservable().pipe(share())
  }

  /**
   * Emit event to stream
   */
  emit<T = any>(eventName: string, data?: T): void {
    if (this.subjects.has(eventName)) {
      this.subjects.get(eventName)!.next(data)
    }
  }

  /**
   * Game state management
   */
  updateGameState(state: Partial<any>): void {
    const currentState = this.gameState$.value
    this.gameState$.next({ ...currentState, ...state })
  }

  getGameState(): Observable<any> {
    return this.gameState$.asObservable().pipe(distinctUntilChanged())
  }

  getCurrentGameState(): any {
    return this.gameState$.value
  }

  /**
   * Advanced reactive patterns for game development
   */

  // Double-click detection
  doubleClick(eventName: string, timeWindow = 300): Observable<any> {
    return this.stream(eventName).pipe(
      bufferTime(timeWindow),
      filter(events => events.length === 2),
      map(events => events[1])
    )
  }

  // Combo detection (sequence of events)
  combo(eventNames: string[], timeWindow = 1000): Observable<string[]> {
    const streams = eventNames.map(name => 
      this.stream(name).pipe(map(() => name))
    )
    
    return merge(...streams).pipe(
      buffer(this.stream('combo-reset').pipe(debounceTime(timeWindow))),
      filter(sequence => sequence.length === eventNames.length),
      filter(sequence => eventNames.every((event, index) => sequence[index] === event))
    )
  }

  // Long press detection
  longPress(eventName: string, duration = 500): Observable<any> {
    const start$ = this.stream(`${eventName}:start`)
    const end$ = this.stream(`${eventName}:end`)
    
    return start$.pipe(
      switchMap((data: any) => 
        timer(duration).pipe(
          takeUntil(end$),
          map(() => data)
        )
      )
    )
  }

  // Throttled input (prevent spam)
  throttledInput(eventName: string, interval = 100): Observable<any> {
    return this.stream(eventName).pipe(
      throttleTime(interval, undefined, { leading: true, trailing: false })
    )
  }

  // Debounced input (wait for pause)
  debouncedInput(eventName: string, delay = 300): Observable<any> {
    return this.stream(eventName).pipe(debounceTime(delay))
  }

  // Health/mana monitoring with thresholds
  createThresholdMonitor(stateKey: string, threshold: number, type: 'below' | 'above' = 'below'): Observable<number> {
    return this.getGameState().pipe(
      map(state => state[stateKey]),
      distinctUntilChanged(),
      filter(value => type === 'below' ? value < threshold : value > threshold)
    )
  }

  // Score streak detection
  createStreakDetector(eventName: string, streakLength = 3): Observable<number> {
    return this.stream(eventName).pipe(
      scan((streak: number, _: any) => streak + 1, 0),
      filter((streak: number) => streak >= streakLength),
      distinctUntilChanged()
    )
  }

  /**
   * Mobile-specific reactive patterns
   */

  // Swipe gesture detection
  swipeGesture(): Observable<{direction: 'up' | 'down' | 'left' | 'right', velocity: number}> {
    const touchStart$ = this.stream('touch:start')
    const touchEnd$ = this.stream('touch:end')
    
    return touchStart$.pipe(
      switchMap((startEvent: any) => 
        touchEnd$.pipe(
          take(1),
          map((endEvent: any) => this.calculateSwipe(startEvent, endEvent)),
          filter(swipe => swipe !== null)
        )
      )
    )
  }

  private calculateSwipe(start: any, end: any): {direction: 'up' | 'down' | 'left' | 'right', velocity: number} | null {
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const deltaTime = end.timestamp - start.timestamp
    
    if (deltaTime > 300) return null // Too slow
    
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime
    if (velocity < 0.5) return null // Too slow
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return { direction: deltaX > 0 ? 'right' : 'left', velocity }
    } else {
      return { direction: deltaY > 0 ? 'down' : 'up', velocity }
    }
  }

  // Device orientation changes
  orientationChange(): Observable<{orientation: 'portrait' | 'landscape', angle: number}> {
    return fromEvent(window, 'orientationchange').pipe(
      map(() => ({
        orientation: (window.innerHeight > window.innerWidth ? 'portrait' : 'landscape') as 'portrait' | 'landscape',
        angle: (screen as any).orientation?.angle || 0
      })),
      distinctUntilChanged((a, b) => a.orientation === b.orientation)
    )
  }

  /**
   * Performance monitoring streams
   */
  createPerformanceMonitor(): Observable<{fps: number, memory: number}> {
    return new Observable(observer => {
      let lastTime = performance.now()
      let frameCount = 0
      
      const measureFrame = () => {
        frameCount++
        const currentTime = performance.now()
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
          const memory = (performance as any).memory 
            ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
            : 0
          
          observer.next({ fps, memory })
          
          frameCount = 0
          lastTime = currentTime
        }
        
        requestAnimationFrame(measureFrame)
      }
      
      measureFrame()
    }) as Observable<{fps: number, memory: number}>
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.subjects.forEach(subject => subject.complete())
    this.subjects.clear()
    this.gameState$.complete()
  }

  reset(): void {
    this.subjects.forEach(subject => subject.complete())
    this.subjects.clear()
    this.gameState$.next({})
  }
}

// Helper types for better TypeScript support
export interface GameEvent<T = any> {
  type: string
  data?: T
  timestamp: number
}

export interface TouchEvent {
  x: number
  y: number
  timestamp: number
}

export interface SwipeGesture {
  direction: 'up' | 'down' | 'left' | 'right'
  velocity: number
  distance: number
}