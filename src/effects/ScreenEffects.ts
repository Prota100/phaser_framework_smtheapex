import Phaser from 'phaser'

/**
 * Screen Effects Manager
 */
export class ScreenEffects {
  private scene: Phaser.Scene
  private camera: Phaser.Cameras.Scene2D.Camera
  private originalCameraPosition: { x: number; y: number }

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.camera = scene.cameras.main
    this.originalCameraPosition = { x: 0, y: 0 }
  }

  /**
   * Screen shake effect
   */
  shake(duration: number = 100, intensity: number = 5): void {
    this.camera.shake(duration, intensity * 0.01)
  }

  /**
   * Screen flash effect
   */
  flash(duration: number = 100, color: number = 0xffffff, alpha: number = 1): void {
    this.camera.flash(duration, 
      (color >> 16) & 0xff,  // R
      (color >> 8) & 0xff,   // G
      color & 0xff,          // B
      false,
      (camera: any, progress: number) => {
        // Optional callback
      }
    )
  }

  /**
   * Screen fade effect
   */
  fadeIn(duration: number = 500, color: number = 0x000000, callback?: () => void): void {
    this.camera.fadeIn(duration,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff
    )
    
    if (callback) {
      this.camera.once('camerafadeincomplete', callback)
    }
  }

  /**
   * Screen fade out effect
   */
  fadeOut(duration: number = 500, color: number = 0x000000, callback?: () => void): void {
    this.camera.fadeOut(duration,
      (color >> 16) & 0xff,
      (color >> 8) & 0xff,
      color & 0xff
    )
    
    if (callback) {
      this.camera.once('camerafadeoutcomplete', callback)
    }
  }

  /**
   * Zoom effect
   */
  zoom(scale: number, duration: number = 300, ease: string = 'Power2'): void {
    this.scene.tweens.add({
      targets: this.camera,
      zoom: scale,
      duration: duration,
      ease: ease
    })
  }

  /**
   * Pan camera to position
   */
  pan(x: number, y: number, duration: number = 1000, ease: string = 'Power2', callback?: () => void): void {
    this.camera.pan(x, y, duration, ease, false, (camera, progress) => {
      if (progress === 1 && callback) {
        callback()
      }
    })
  }

  /**
   * Rotate camera
   */
  rotate(angle: number, duration: number = 500, ease: string = 'Power2'): void {
    this.scene.tweens.add({
      targets: this.camera,
      rotation: angle,
      duration: duration,
      ease: ease
    })
  }

  /**
   * Vignette effect
   */
  addVignette(radius: number = 0.5, strength: number = 0.5): void {
    const postFxPlugin = this.camera.postFX
    if (postFxPlugin) {
      postFxPlugin.addVignette(0.5, 0.5, radius, strength)
    }
  }

  /**
   * Blur effect
   */
  addBlur(strength: number = 2): void {
    const postFxPlugin = this.camera.postFX
    if (postFxPlugin) {
      postFxPlugin.addBlur(0, strength, strength, 1)
    }
  }

  /**
   * Pixelate effect
   */
  addPixelate(amount: number = 5): void {
    const postFxPlugin = this.camera.postFX
    if (postFxPlugin) {
      postFxPlugin.addPixelate(amount)
    }
  }

  /**
   * Chromatic aberration effect
   */
  chromaticAberration(duration: number = 100, intensity: number = 5): void {
    const graphics = this.scene.add.graphics()
    const { width, height } = this.scene.scale
    
    // Create RGB offset effect
    const redOffset = this.scene.add.renderTexture(0, 0, width, height)
    const greenOffset = this.scene.add.renderTexture(0, 0, width, height)
    const blueOffset = this.scene.add.renderTexture(0, 0, width, height)
    
    redOffset.setTint(0xff0000)
    greenOffset.setTint(0x00ff00)
    blueOffset.setTint(0x0000ff)
    
    // Animate offsets
    this.scene.tweens.add({
      targets: [redOffset, greenOffset, blueOffset],
      alpha: { from: 0.3, to: 0 },
      duration: duration,
      onUpdate: () => {
        redOffset.x = Phaser.Math.Between(-intensity, intensity)
        greenOffset.x = Phaser.Math.Between(-intensity, intensity)
        blueOffset.x = Phaser.Math.Between(-intensity, intensity)
      },
      onComplete: () => {
        redOffset.destroy()
        greenOffset.destroy()
        blueOffset.destroy()
        graphics.destroy()
      }
    })
  }

  /**
   * Glitch effect
   */
  glitch(duration: number = 200, intensity: number = 10): void {
    const originalX = this.camera.scrollX
    const originalY = this.camera.scrollY
    
    const glitchTimer = this.scene.time.addEvent({
      delay: 20,
      callback: () => {
        this.camera.scrollX = originalX + Phaser.Math.Between(-intensity, intensity)
        this.camera.scrollY = originalY + Phaser.Math.Between(-intensity, intensity)
        
        // Random color shift - Note: Camera tinting not supported in Phaser 3
        // This would need to be implemented as a post-processing effect
      },
      repeat: duration / 20
    })
    
    this.scene.time.delayedCall(duration, () => {
      this.camera.scrollX = originalX
      this.camera.scrollY = originalY
      // Note: clearTint not available for cameras
      glitchTimer.destroy()
    })
  }

  /**
   * Wave distortion effect
   */
  waveDistortion(duration: number = 2000, amplitude: number = 10, frequency: number = 0.02): void {
    let time = 0
    
    const waveEvent = this.scene.time.addEvent({
      delay: 16,
      callback: () => {
        time += 16
        const offset = Math.sin(time * frequency) * amplitude
        this.camera.scrollY = this.originalCameraPosition.y + offset
      },
      repeat: duration / 16
    })
    
    this.scene.time.delayedCall(duration, () => {
      this.camera.scrollY = this.originalCameraPosition.y
      waveEvent.destroy()
    })
  }

  /**
   * Reset all effects
   */
  reset(): void {
    this.camera.resetFX()
    this.camera.resetPostPipeline()
    // Note: clearTint not available for cameras
    this.camera.setZoom(1)
    this.camera.setRotation(0)
    this.camera.scrollX = this.originalCameraPosition.x
    this.camera.scrollY = this.originalCameraPosition.y
  }

  /**
   * Destroy screen effects
   */
  destroy(): void {
    this.reset()
  }
}