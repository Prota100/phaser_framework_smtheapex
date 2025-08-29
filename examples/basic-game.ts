import { GameManager, BaseScene, UIManager, mergeConfig } from '../src'

/**
 * Basic Game Example - Shows simple setup with UI
 */
class BasicGameScene extends BaseScene {
  private uiManager!: UIManager
  private score: number = 0
  private scoreText!: Phaser.GameObjects.Text

  constructor() {
    super({ key: 'BasicGame' })
  }

  preload() {
    super.preload()
    
    // Load some basic assets
    this.load.image('player', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjNWU5MmYzIiByeD0iOCIvPgo8L3N2Zz4K')
  }

  create() {
    super.create()
    
    // Initialize UI Manager
    this.uiManager = new UIManager(this)
    
    // Create background
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x1a1a2e
    )
    
    // Add title
    this.add.text(this.scale.width / 2, 100, 'Basic Game Example', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
    
    // Add player sprite
    const player = this.add.image(this.scale.width / 2, this.scale.height / 2, 'player')
    player.setInteractive()
    
    // Add click interaction
    player.on('pointerdown', () => {
      this.score += 10
      this.updateScore()
      
      // Simple animation
      this.tweens.add({
        targets: player,
        scale: { from: 1, to: 1.2 },
        duration: 100,
        yoyo: true
      })
    })
    
    // Score display
    this.scoreText = this.add.text(20, 20, `Score: ${this.score}`, {
      fontSize: '24px',
      color: '#00ff00'
    })
    
    // Create UI buttons
    this.createUIButtons()
    
    // Show welcome dialog
    this.time.delayedCall(500, () => {
      this.showWelcomeDialog()
    })
  }

  private createUIButtons(): void {
    // Settings button
    const settingsBtn = this.add.text(this.scale.width - 20, 20, 'Settings', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#5e92f3',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setInteractive()
    
    settingsBtn.on('pointerdown', () => {
      this.showSettingsPanel()
    })
    
    // Reset button
    const resetBtn = this.add.text(this.scale.width - 20, 60, 'Reset', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#f39c12',
      padding: { x: 10, y: 5 }
    }).setOrigin(1, 0).setInteractive()
    
    resetBtn.on('pointerdown', () => {
      this.resetGame()
    })
  }

  private showWelcomeDialog(): void {
    const dialog = this.uiManager.createDialog({
      title: 'Welcome!',
      content: 'Click the blue square to earn points!',
      buttons: ['Got it!'],
      closeButton: true
    })
  }

  private showSettingsPanel(): void {
    const panel = this.uiManager.createDOMElement(`
      <div class="dom-panel" style="left: 50%; top: 50%; transform: translate(-50%, -50%);">
        <h3 style="margin: 0 0 15px 0; color: #fff;">Settings</h3>
        <div style="margin: 10px 0;">
          <label style="color: #fff; display: block; margin-bottom: 5px;">Volume:</label>
          <input type="range" min="0" max="100" value="50" style="width: 100%;">
        </div>
        <div style="margin: 10px 0;">
          <label style="color: #fff; display: block; margin-bottom: 5px;">Difficulty:</label>
          <select style="width: 100%; padding: 5px; background: rgba(255,255,255,0.1); color: #fff; border: 1px solid #666;">
            <option value="easy">Easy</option>
            <option value="normal" selected>Normal</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <button class="dom-button" onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
      </div>
    `)
  }

  private resetGame(): void {
    this.score = 0
    this.updateScore()
    this.uiManager.showNotification('Game Reset!', 'info', 2000)
  }

  private updateScore(): void {
    this.scoreText.setText(`Score: ${this.score}`)
  }
}

// Game configuration
const config = mergeConfig({
  game: {
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: 0x1a1a2e
  },
  ui: {
    useRexUI: true,
    useDOMOverlay: true
  }
})

// Initialize and start game
const gameManager = new GameManager(config)
gameManager.initialize([BasicGameScene])

export { BasicGameScene, gameManager }