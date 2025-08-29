# 🎮 Phaser Framework 2025 - Quick Start

A modern, advanced H5 mobile cross-platform game framework built on Phaser 3.87.0 with RxJS reactive patterns and 2025 web technologies.

## ✨ Features

- **🚀 2025 Technology Stack**: Latest web APIs, responsive design, PWA support
- **📱 Mobile-First**: 15+ device breakpoints, touch gestures, orientation handling
- **🎵 Advanced Audio**: Spatial audio, dynamic music layers, mobile optimization
- **⚡ Performance**: Adaptive rendering, device tier detection, memory optimization
- **🔄 Reactive Patterns**: RxJS-based event system for complex game interactions
- **🖼️ Responsive Design**: Container queries, safe areas, fullscreen API
- **🎯 TypeScript**: Fully typed codebase with modern development tools

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Open browser and go to:
# http://localhost:3000
```

## 🎮 Available Examples

1. **Basic Game Demo** - Core framework features with physics and controls
2. **Responsive & Embed Demo** - Modern responsive design showcase  
3. **Audio & Effects Demo** - Spatial audio and Web Audio API integration
4. **Gesture & Input Demo** - Touch gesture recognition and multi-input
5. **Performance Monitor** - Real-time performance metrics and optimization
6. **Advanced Features** - Complete game with all framework capabilities

## 📁 Project Structure

```
src/
├── core/           # Core framework systems
├── ui/             # UI management and responsive design
├── audio/          # Advanced audio systems
├── mobile/         # Mobile-specific features
├── performance/    # Performance optimization
├── utils/          # Reactive utilities and helpers
└── effects/        # Visual effects and particles

examples/           # Interactive demonstrations
dist/              # Built framework output
```

## 🛠️ Development Commands

```bash
npm start          # Start dev server with hot reload
npm run build      # Build for production
npm run type-check # TypeScript compilation check
npm run lint       # Code linting
npm run test       # Run tests
npm run clean      # Clean build directory
```

## 📱 2025 Mobile Features

- **Device Detection**: Automatic device tier classification
- **Responsive Breakpoints**: 15+ breakpoints from mobile_xs (320px) to desktop_xxl (2560px)
- **Touch Gestures**: Tap, swipe, pinch, long-press recognition
- **Orientation Lock**: Modern orientation API support
- **Safe Areas**: iOS notch and Android navigation handling
- **PWA Ready**: Service worker and manifest included

## 🎵 Audio System

- **Spatial Audio**: 3D positional audio with Web Audio API
- **Dynamic Music**: Layered music system with crossfading
- **Mobile Optimization**: Auto-unlock and performance adaptation
- **Reactive Controls**: RxJS-based volume and state management

## ⚡ Performance

- **Adaptive Rendering**: Quality adjustment based on device performance
- **Memory Management**: Efficient object pooling and cleanup
- **FPS Monitoring**: Real-time performance metrics
- **Battery Optimization**: Thermal throttling detection

## 🔧 Framework Integration

```typescript
import { GameManager } from './src/core/GameManager'
import { ReactiveAudioManager } from './src/audio/ReactiveAudioManager'
import { EnhancedResponsiveManager } from './src/core/EnhancedResponsiveManager'

// Initialize your game with enhanced systems
const gameManager = new GameManager({
  // Your game configuration
})
```

## 📚 Documentation

Each system includes comprehensive inline documentation and TypeScript definitions. Check the source files in `src/` for detailed API documentation.

## 🤝 Contributing

This framework is designed for modern H5 mobile game development. Feel free to extend and customize for your specific needs.

## 📄 License

MIT License - see LICENSE file for details.

---

**🎮 Ready to build amazing H5 mobile games with cutting-edge 2025 technology!**