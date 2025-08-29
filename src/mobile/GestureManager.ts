import { fromEvent, merge, Observable, Subject } from 'rxjs'
import { map, filter, switchMap, takeUntil, tap, share, distinctUntilChanged } from 'rxjs/operators'
import { ReactiveEventBus } from '../utils/ReactiveEventBus'

export interface TouchPoint {
  id: number
  x: number
  y: number
  timestamp: number
}

export interface GestureEvent {
  type: 'tap' | 'double-tap' | 'long-press' | 'swipe' | 'pinch' | 'rotate'
  data: any
  touches: TouchPoint[]
  timestamp: number
}

/**
 * Advanced gesture recognition for mobile H5 games
 * Provides high-level gesture events from low-level touch input
 */
export class GestureManager {
  private eventBus: ReactiveEventBus
  private element: HTMLElement
  private gestureEvents$ = new Subject<GestureEvent>()
  
  // Configuration
  private config = {
    tapTimeout: 300,
    doubleTapInterval: 300,
    longPressDelay: 500,
    swipeMinDistance: 50,
    swipeMaxTime: 300,
    pinchMinDistance: 10
  }

  constructor(element: HTMLElement) {
    this.element = element
    this.eventBus = ReactiveEventBus.getInstance()
    this.initializeGestureDetection()
  }

  /**
   * Get gesture events observable
   */
  getGestureEvents(): Observable<GestureEvent> {
    return this.gestureEvents$.asObservable().pipe(share())
  }

  /**
   * Get specific gesture type
   */
  onGesture(type: GestureEvent['type']): Observable<GestureEvent> {
    return this.getGestureEvents().pipe(
      filter(event => event.type === type)
    )
  }

  /**
   * Initialize all gesture detection
   */
  private initializeGestureDetection(): void {
    // Prevent default touch behaviors
    this.element.style.touchAction = 'none'
    this.element.addEventListener('touchstart', e => e.preventDefault(), { passive: false })
    this.element.addEventListener('touchmove', e => e.preventDefault(), { passive: false })
    
    // Create touch observables
    const touchStart$ = fromEvent<TouchEvent>(this.element, 'touchstart')
    const touchMove$ = fromEvent<TouchEvent>(this.element, 'touchmove')
    const touchEnd$ = fromEvent<TouchEvent>(this.element, 'touchend')
    
    // Setup gesture detectors
    this.setupTapDetection(touchStart$, touchEnd$)
    this.setupSwipeDetection(touchStart$, touchMove$, touchEnd$)
    this.setupPinchDetection(touchStart$, touchMove$, touchEnd$)
    this.setupLongPressDetection(touchStart$, touchEnd$)
  }

  /**
   * Tap and double-tap detection
   */
  private setupTapDetection(touchStart$: Observable<TouchEvent>, touchEnd$: Observable<TouchEvent>): void {
    const tap$ = touchStart$.pipe(
      filter(e => e.touches.length === 1),
      switchMap(startEvent => 
        touchEnd$.pipe(
          takeUntil(timer(this.config.tapTimeout)),
          filter(endEvent => {
            const touch = this.getTouchPoint(endEvent.changedTouches[0])
            const startTouch = this.getTouchPoint(startEvent.touches[0])
            const distance = this.getDistance(startTouch, touch)
            return distance < 10 // Max movement for tap
          }),
          map(endEvent => ({
            startEvent,
            endEvent,
            touch: this.getTouchPoint(endEvent.changedTouches[0])
          }))
        )
      ),
      share()
    )

    // Single tap
    tap$.pipe(
      switchMap(tapData => 
        timer(this.config.doubleTapInterval).pipe(
          map(() => tapData),
          takeUntil(tap$) // Cancel if another tap comes
        )
      )
    ).subscribe(tapData => {
      this.emitGesture('tap', {
        position: tapData.touch,
        duration: tapData.endEvent.timeStamp - tapData.startEvent.timeStamp
      }, [tapData.touch])
    })

    // Double tap
    tap$.pipe(
      bufferTime(this.config.doubleTapInterval),
      filter(taps => taps.length === 2),
      filter(taps => {
        const distance = this.getDistance(taps[0].touch, taps[1].touch)
        return distance < 50 // Max distance between taps
      })
    ).subscribe(taps => {
      this.emitGesture('double-tap', {
        position: taps[1].touch,
        interval: taps[1].endEvent.timeStamp - taps[0].endEvent.timeStamp
      }, [taps[1].touch])
    })
  }

  /**
   * Swipe gesture detection
   */
  private setupSwipeDetection(
    touchStart$: Observable<TouchEvent>, 
    touchMove$: Observable<TouchEvent>, 
    touchEnd$: Observable<TouchEvent>
  ): void {
    touchStart$.pipe(
      filter(e => e.touches.length === 1),
      switchMap(startEvent => {
        const startTouch = this.getTouchPoint(startEvent.touches[0])
        
        return touchEnd$.pipe(
          takeUntil(timer(this.config.swipeMaxTime)),
          filter(endEvent => {
            const endTouch = this.getTouchPoint(endEvent.changedTouches[0])
            const distance = this.getDistance(startTouch, endTouch)
            return distance >= this.config.swipeMinDistance
          }),
          map(endEvent => ({
            start: startTouch,
            end: this.getTouchPoint(endEvent.changedTouches[0]),
            duration: endEvent.timeStamp - startEvent.timeStamp
          }))
        )
      })
    ).subscribe(swipeData => {
      const deltaX = swipeData.end.x - swipeData.start.x
      const deltaY = swipeData.end.y - swipeData.start.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const velocity = distance / swipeData.duration
      
      let direction: string
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        direction = deltaX > 0 ? 'right' : 'left'
      } else {
        direction = deltaY > 0 ? 'down' : 'up'
      }
      
      this.emitGesture('swipe', {
        direction,
        distance,
        velocity,
        deltaX,
        deltaY,
        duration: swipeData.duration
      }, [swipeData.start, swipeData.end])
    })
  }

  /**
   * Pinch gesture detection (zoom)
   */
  private setupPinchDetection(
    touchStart$: Observable<TouchEvent>, 
    touchMove$: Observable<TouchEvent>, 
    touchEnd$: Observable<TouchEvent>
  ): void {
    touchStart$.pipe(
      filter(e => e.touches.length === 2),
      switchMap(startEvent => {
        const startTouches = [
          this.getTouchPoint(startEvent.touches[0]),
          this.getTouchPoint(startEvent.touches[1])
        ]
        const startDistance = this.getDistance(startTouches[0], startTouches[1])
        const startCenter = this.getCenter(startTouches)
        
        return touchMove$.pipe(
          filter(e => e.touches.length === 2),
          map(moveEvent => {
            const currentTouches = [
              this.getTouchPoint(moveEvent.touches[0]),
              this.getTouchPoint(moveEvent.touches[1])
            ]
            const currentDistance = this.getDistance(currentTouches[0], currentTouches[1])
            const currentCenter = this.getCenter(currentTouches)
            
            return {
              scale: currentDistance / startDistance,
              center: currentCenter,
              startCenter,
              touches: currentTouches
            }
          }),
          distinctUntilChanged((a, b) => Math.abs(a.scale - b.scale) < 0.01),
          takeUntil(touchEnd$.pipe(filter(e => e.touches.length < 2)))
        )
      })
    ).subscribe(pinchData => {
      this.emitGesture('pinch', {
        scale: pinchData.scale,
        center: pinchData.center,
        startCenter: pinchData.startCenter,
        zoom: pinchData.scale > 1 ? 'in' : 'out'
      }, pinchData.touches)
    })
  }

  /**
   * Long press detection
   */
  private setupLongPressDetection(touchStart$: Observable<TouchEvent>, touchEnd$: Observable<TouchEvent>): void {
    touchStart$.pipe(
      filter(e => e.touches.length === 1),
      switchMap(startEvent => {
        const startTouch = this.getTouchPoint(startEvent.touches[0])
        
        return timer(this.config.longPressDelay).pipe(
          takeUntil(touchEnd$),
          takeUntil(
            fromEvent<TouchEvent>(this.element, 'touchmove').pipe(
              filter(moveEvent => {
                const moveTouch = this.getTouchPoint(moveEvent.touches[0])
                const distance = this.getDistance(startTouch, moveTouch)
                return distance > 10 // Cancel if finger moves too much
              })
            )
          ),
          map(() => startTouch)
        )
      })
    ).subscribe(touch => {
      this.emitGesture('long-press', {
        position: touch,
        duration: this.config.longPressDelay
      }, [touch])
    })
  }

  /**
   * Emit gesture event
   */
  private emitGesture(type: GestureEvent['type'], data: any, touches: TouchPoint[]): void {
    const event: GestureEvent = {
      type,
      data,
      touches,
      timestamp: Date.now()
    }
    
    this.gestureEvents$.next(event)
    this.eventBus.emit(`gesture:${type}`, event)
  }

  /**
   * Helper functions
   */
  private getTouchPoint(touch: Touch): TouchPoint {
    const rect = this.element.getBoundingClientRect()
    return {
      id: touch.identifier,
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      timestamp: Date.now()
    }
  }

  private getDistance(touch1: TouchPoint, touch2: TouchPoint): number {
    const deltaX = touch2.x - touch1.x
    const deltaY = touch2.y - touch1.y
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  private getCenter(touches: TouchPoint[]): TouchPoint {
    const sumX = touches.reduce((sum, touch) => sum + touch.x, 0)
    const sumY = touches.reduce((sum, touch) => sum + touch.y, 0)
    return {
      id: -1,
      x: sumX / touches.length,
      y: sumY / touches.length,
      timestamp: Date.now()
    }
  }

  /**
   * Configuration
   */
  setConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.gestureEvents$.complete()
  }
}

// Import timer operator
import { timer } from 'rxjs'
import { bufferTime } from 'rxjs/operators'