import Phaser from 'phaser'

/**
 * Particle System Manager
 */
export class ParticleSystem {
  private scene: Phaser.Scene
  private emitters: Map<string, Phaser.GameObjects.Particles.ParticleEmitter> = new Map()

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /**
   * Create explosion effect
   */
  createExplosion(x: number, y: number, config?: {
    color?: number
    count?: number
    speed?: number
    scale?: number
    duration?: number
  }): void {
    const color = config?.color || 0xffffff
    const count = config?.count || 30
    const speed = config?.speed || 200
    const scale = config?.scale || 1
    const duration = config?.duration || 500

    // Create particle texture if not exists
    const textureKey = `particle-${color}`
    if (!this.scene.textures.exists(textureKey)) {
      this.createParticleTexture(textureKey, color)
    }

    const emitter = this.scene.add.particles(x, y, textureKey, {
      speed: { min: speed * 0.5, max: speed },
      scale: { start: scale, end: 0 },
      blendMode: 'ADD',
      lifespan: duration,
      quantity: count,
      emitting: false
    })

    emitter.explode(count, x, y)

    // Clean up after animation
    this.scene.time.delayedCall(duration, () => {
      emitter.destroy()
    })
  }

  /**
   * Create trail effect
   */
  createTrail(target: Phaser.GameObjects.GameObject, config?: {
    color?: number
    frequency?: number
    scale?: number
    lifespan?: number
    blendMode?: string
  }): string {
    const color = config?.color || 0xffffff
    const frequency = config?.frequency || 10
    const scale = config?.scale || 0.5
    const lifespan = config?.lifespan || 300
    const blendMode = config?.blendMode || 'ADD'

    // Create particle texture if not exists
    const textureKey = `particle-${color}`
    if (!this.scene.textures.exists(textureKey)) {
      this.createParticleTexture(textureKey, color)
    }

    const emitter = this.scene.add.particles(0, 0, textureKey, {
      follow: target as any,
      frequency: frequency,
      scale: { start: scale, end: 0 },
      blendMode: blendMode,
      lifespan: lifespan,
      alpha: { start: 1, end: 0 }
    })

    const id = `trail-${Date.now()}`
    this.emitters.set(id, emitter)

    return id
  }

  /**
   * Create fountain effect
   */
  createFountain(x: number, y: number, config?: {
    color?: number
    angle?: number
    speed?: number
    gravity?: number
    frequency?: number
    scale?: number
  }): string {
    const color = config?.color || 0x00ffff
    const angle = config?.angle || -90
    const speed = config?.speed || 300
    const gravity = config?.gravity || 400
    const frequency = config?.frequency || 20
    const scale = config?.scale || 0.5

    // Create particle texture if not exists
    const textureKey = `particle-${color}`
    if (!this.scene.textures.exists(textureKey)) {
      this.createParticleTexture(textureKey, color)
    }

    const emitter = this.scene.add.particles(x, y, textureKey, {
      angle: { min: angle - 15, max: angle + 15 },
      speed: { min: speed * 0.8, max: speed },
      gravityY: gravity,
      scale: { start: scale, end: 0 },
      blendMode: 'ADD',
      frequency: frequency,
      lifespan: 2000
    })

    const id = `fountain-${Date.now()}`
    this.emitters.set(id, emitter)

    return id
  }

  /**
   * Create smoke effect
   */
  createSmoke(x: number, y: number, config?: {
    color?: number
    frequency?: number
    speed?: number
    scale?: number
  }): string {
    const color = config?.color || 0x888888
    const frequency = config?.frequency || 50
    const speed = config?.speed || 50
    const scale = config?.scale || 1

    // Create particle texture if not exists
    const textureKey = `smoke-${color}`
    if (!this.scene.textures.exists(textureKey)) {
      this.createSmokeTexture(textureKey, color)
    }

    const emitter = this.scene.add.particles(x, y, textureKey, {
      speed: { min: speed * 0.5, max: speed },
      angle: { min: -100, max: -80 },
      scale: { start: scale * 0.5, end: scale * 1.5 },
      alpha: { start: 0.5, end: 0 },
      blendMode: 'NORMAL',
      frequency: frequency,
      lifespan: 2000
    })

    const id = `smoke-${Date.now()}`
    this.emitters.set(id, emitter)

    return id
  }

  /**
   * Create sparkle effect
   */
  createSparkle(x: number, y: number, config?: {
    color?: number
    count?: number
    radius?: number
    duration?: number
  }): void {
    const color = config?.color || 0xffff00
    const count = config?.count || 10
    const radius = config?.radius || 50
    const duration = config?.duration || 1000

    // Create star texture if not exists
    const textureKey = `star-${color}`
    if (!this.scene.textures.exists(textureKey)) {
      this.createStarTexture(textureKey, color)
    }

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count
      const targetX = x + Math.cos(angle) * radius
      const targetY = y + Math.sin(angle) * radius

      const star = this.scene.add.image(x, y, textureKey)
      star.setScale(0)
      star.setBlendMode('ADD')

      this.scene.tweens.add({
        targets: star,
        x: targetX,
        y: targetY,
        scale: { from: 0, to: 0.5 },
        alpha: { from: 1, to: 0 },
        angle: 360,
        duration: duration,
        ease: 'Power2',
        onComplete: () => star.destroy()
      })
    }
  }

  /**
   * Stop emitter
   */
  stopEmitter(id: string): void {
    const emitter = this.emitters.get(id)
    if (emitter) {
      emitter.stop()
      this.scene.time.delayedCall(2000, () => {
        emitter.destroy()
        this.emitters.delete(id)
      })
    }
  }

  /**
   * Stop all emitters
   */
  stopAllEmitters(): void {
    this.emitters.forEach((emitter, id) => {
      this.stopEmitter(id)
    })
  }

  /**
   * Create particle texture
   */
  private createParticleTexture(key: string, color: number): void {
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(color, 1)
    graphics.fillCircle(8, 8, 8)
    graphics.generateTexture(key, 16, 16)
    graphics.destroy()
  }

  /**
   * Create smoke texture
   */
  private createSmokeTexture(key: string, color: number): void {
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(color, 0.3)
    graphics.fillCircle(16, 16, 16)
    graphics.fillStyle(color, 0.5)
    graphics.fillCircle(16, 16, 10)
    graphics.generateTexture(key, 32, 32)
    graphics.destroy()
  }

  /**
   * Create star texture
   */
  private createStarTexture(key: string, color: number): void {
    const graphics = this.scene.add.graphics()
    graphics.fillStyle(color, 1)
    
    // Draw star shape
    const points: number[] = []
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10
      const radius = i % 2 === 0 ? 8 : 4
      points.push(8 + Math.cos(angle) * radius)
      points.push(8 + Math.sin(angle) * radius)
    }
    
    graphics.fillPoints(points, true)
    graphics.generateTexture(key, 16, 16)
    graphics.destroy()
  }

  /**
   * Destroy particle system
   */
  destroy(): void {
    this.stopAllEmitters()
  }
}