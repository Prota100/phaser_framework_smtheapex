import Phaser from 'phaser'

/**
 * Global Event Bus for cross-component communication
 */
export class EventBus extends Phaser.Events.EventEmitter {
  private static instance: EventBus

  private constructor() {
    super()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  /**
   * Emit event with optional data
   */
  emit(event: string | symbol, ...args: any[]): boolean {
    console.log(`[EventBus] Emitting: ${String(event)}`, ...args)
    return super.emit(event, ...args)
  }

  /**
   * Subscribe to event once
   */
  once(event: string | symbol, fn: Function, context?: any): this {
    console.log(`[EventBus] Once listener added: ${String(event)}`)
    return super.once(event, fn, context)
  }

  /**
   * Subscribe to event
   */
  on(event: string | symbol, fn: Function, context?: any): this {
    console.log(`[EventBus] Listener added: ${String(event)}`)
    return super.on(event, fn, context)
  }

  /**
   * Unsubscribe from event
   */
  off(event: string | symbol, fn?: Function, context?: any, once?: boolean): this {
    console.log(`[EventBus] Listener removed: ${String(event)}`)
    return super.off(event, fn, context, once)
  }

  /**
   * Reset event bus (useful for testing)
   */
  reset(): void {
    this.removeAllListeners()
    console.log('[EventBus] All listeners removed')
  }
}