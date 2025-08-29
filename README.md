# Phaser Framework by SmtheApex

A comprehensive, modular Phaser 3 framework with RexUI integration, DOM overlay system, and mobile-first design.

## Features

- 🎮 **Complete Phaser 3 Setup** - Pre-configured game initialization with smart render detection
- 🎨 **RexUI Integration** - Rich UI components with built-in dialogs, panels, and widgets
- 🌐 **DOM Overlay System** - HTML/CSS overlays for complex UI elements
- 📱 **Mobile-First** - Touch controls, PWA support, and responsive design
- ⚡ **Performance Monitoring** - Built-in FPS tracking and optimization
- 💾 **Save/Load System** - Automatic save management with integrity checking
- 🎭 **Scene Management** - Stack-based scene transitions and management
- ✨ **Effects System** - Particles, screen effects, and animations
- 🔧 **TypeScript Ready** - Full TypeScript support with type definitions

## Installation

```bash
npm install @smtheapex/phaser-framework
```

Or clone from repository:

```bash
git clone https://github.com/Prota100/phaser_framework_smtheapex.git
cd phaser_framework_smtheapex
npm install
npm run build
```

## Quick Start

```typescript
import { GameManager, BaseScene, mergeConfig, DEFAULT_GAME_CONFIG } from '@smtheapex/phaser-framework'

// Create a simple scene
class MainScene extends BaseScene {
  constructor() {
    super({ key: 'MainScene' })
  }

  create() {
    super.create()
    
    // Add your game logic here
    this.add.text(400, 300, 'Hello Phaser Framework!', {
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5)
  }
}

// Configure and start game
const config = mergeConfig({
  game: {
    width: 800,
    height: 600,
    parent: 'game-container'
  }
})

const gameManager = new GameManager(config)
gameManager.initialize([MainScene])
```

## Core Modules

### GameManager
Central game lifecycle management:

```typescript
import { GameManager } from '@smtheapex/phaser-framework'

const gameManager = new GameManager({
  game: {
    width: 1280,
    height: 720,
    parent: 'game-container'
  },
  ui: {
    useRexUI: true,
    useDOMOverlay: true
  },
  performance: {
    enableMonitoring: true,
    targetFPS: 60
  }
})
```

### BaseScene
Extended Phaser scene with built-in functionality:

```typescript
import { BaseScene } from '@smtheapex/phaser-framework'

class GameScene extends BaseScene {
  constructor() {
    super({ key: 'GameScene' })
  }

  create() {
    super.create() // Essential for framework features
    
    // Your scene setup
  }
}
```

### UIManager
Unified UI system combining RexUI and DOM:

```typescript
import { UIManager } from '@smtheapex/phaser-framework'

const uiManager = new UIManager(this, {
  useRexUI: true,
  useDOMOverlay: true
})

// Create RexUI dialog
const dialog = uiManager.createDialog({
  title: 'Welcome',
  content: 'Hello World!',
  buttons: ['OK', 'Cancel']
})

// Create DOM panel
const panel = uiManager.createDOMElement(`
  <div class="custom-panel">
    <h2>Custom Panel</h2>
    <p>HTML content here</p>
  </div>
`)
```

### SaveManager
Automatic save/load with integrity checking:

```typescript
import { SaveManager } from '@smtheapex/phaser-framework'

const saveManager = new SaveManager('my-game-save', 30000) // Auto-save every 30s

// Save data
await saveManager.save({ level: 1, score: 1000 })

// Load data
const gameData = await saveManager.load()
```

### Performance Monitor
Real-time performance tracking:

```typescript
import { PerformanceMonitor } from '@smtheapex/phaser-framework'

const monitor = PerformanceMonitor.getInstance(60, true) // 60 FPS target, auto-optimize

// In scene update loop
update(time: number, delta: number) {
  monitor.update(time, delta)
  
  // Get current metrics
  const fps = monitor.getFPS()
  const frameTime = monitor.getFrameTime()
}
```

## Mobile Support

### Touch Manager
Advanced touch input handling:

```typescript
import { TouchManager } from '@smtheapex/phaser-framework'

const touchManager = new TouchManager(this, {
  doubleTapDelay: 300,
  swipeThreshold: 50,
  holdDelay: 500
})

// Listen for touch events
this.eventBus.on('touch:swipe', (data) => {
  console.log('Swipe direction:', data.direction)
})

// Create virtual controls
const joystick = touchManager.createVirtualJoystick({
  x: 150, y: this.scale.height - 150
})
```

### PWA Manager
Progressive Web App support:

```typescript
import { PWAManager } from '@smtheapex/phaser-framework'

const pwaManager = new PWAManager()
await pwaManager.initialize()

// Show install prompt
if (pwaManager.canInstall()) {
  pwaManager.showInstallBanner()
}
```

## Effects System

### Particle System
Rich particle effects:

```typescript
import { ParticleSystem } from '@smtheapex/phaser-framework'

const particles = new ParticleSystem(this)

// Create explosion
particles.createExplosion(400, 300, {
  color: 0xff0000,
  count: 50,
  speed: 200
})

// Create trail effect
particles.createTrail(player, {
  color: 0x00ffff,
  frequency: 10,
  scale: 0.5
})
```

### Screen Effects
Camera and screen effects:

```typescript
import { ScreenEffects } from '@smtheapex/phaser-framework'

const screenFX = new ScreenEffects(this)

// Screen shake
screenFX.shake(100, 5)

// Fade transition
screenFX.fadeOut(500, 0x000000, () => {
  // Callback when fade complete
})

// Glitch effect
screenFX.glitch(200, 10)
```

## Event System

Global event bus for communication:

```typescript
import { EventBus } from '@smtheapex/phaser-framework'

const eventBus = EventBus.getInstance()

// Emit events
eventBus.emit('player:levelup', { level: 2 })

// Listen for events
eventBus.on('player:levelup', (data) => {
  console.log('Player reached level:', data.level)
})
```

## Configuration

The framework supports extensive configuration:

```typescript
import { FrameworkConfig } from '@smtheapex/phaser-framework'

const config: FrameworkConfig = {
  game: {
    width: 1280,
    height: 720,
    backgroundColor: 0x1a1a2e,
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 300 } }
    }
  },
  ui: {
    useRexUI: true,
    useDOMOverlay: true,
    responsiveBreakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1440
    }
  },
  performance: {
    enableMonitoring: true,
    targetFPS: 60,
    autoOptimize: true
  },
  mobile: {
    enablePWA: true,
    enableTouch: true
  },
  save: {
    storageKey: 'my-game',
    autoSaveInterval: 30000,
    compression: false
  }
}
```

## Examples

Check the `examples/` directory for complete game examples:

- **Basic Game** - Simple setup with UI
- **Mobile Game** - Touch controls and PWA
- **Advanced Game** - All features combined

## API Reference

See the `dist/` folder for complete TypeScript definitions and documentation.

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile browsers with ES2020 support

## Development

```bash
# Install dependencies
npm install

# Build framework
npm run build

# Watch for changes
npm run dev

# Run tests
npm test
```

## License

MIT License - see LICENSE file for details.

## Contributing

Pull requests are welcome! Please read the contributing guidelines first.

## Support

- GitHub Issues: Report bugs and feature requests
- Discussions: Community support and questions
- Documentation: Full API reference and guides

---

Built with ❤️ by SmtheApex