# Angular Web Audio Melodies Sample

A developer sample application built with Angular that demonstrates melody generation using the Gemini API. The generated melodies are played directly in the browser using the Web Audio API, creating an interactive music synthesis experience.

<a href="https://idx.google.com/import?url=https://github.com/google-gemini/angular-webaudio-melodies-sample">
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://cdn.idx.dev/btn/open_dark_32@2x.png">
  <source media="(prefers-color-scheme: light)" srcset="https://cdn.idx.dev/btn/open_light_32@2x.png">
  <img height="32" alt="Open in IDX" src="https://cdn.idx.dev/btn/open_purple_32@2x.png">
</picture>
</a>

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Resonance Effects and Hydi Integration](#resonance-effects-and-hydi-integration)
- [DAW Architecture](#daw-architecture)
- [Dependencies](#dependencies)
- [Contributing](#contributing)
- [License](#license)
- [API Key Privacy](#api-key-privacy)

## Project Overview

This Angular application showcases the integration of Google's Gemini AI with Web Audio API to generate and play musical melodies. Users can input text prompts to generate custom melodies that are synthesized and played in real-time within the browser.

The project demonstrates:
- Angular framework best practices
- Integration with Google Gemini API
- Web Audio API for audio synthesis
- Real-time melody generation and playback
- Responsive UI with interactive keyboard visualization

## Features

- **AI-Powered Melody Generation**: Generate melodies from text prompts using Google's Gemini API
- **Real-Time Audio Playback**: Play generated melodies using Web Audio API
- **Interactive Keyboard**: Visual keyboard component that highlights notes during playback
- **Advanced Resonance Effects**: Apply sophisticated resonance filtering to enhance audio quality
- **Hydi Effects Integration**: Access to Hydi harmonic synthesis with dynamic modulation
- **Rezonate Core System**: Comprehensive resonance processing with multiple filter stages
- **Preset Configurations**: Built-in presets for warm, bright, and mellow resonance profiles
- **Real-Time Effect Control**: Dynamic adjustment of resonance and Hydi parameters during playback
- **Responsive Design**: Works across different screen sizes and devices
- **TypeScript**: Fully typed codebase for better development experience
- **Unit Testing**: Comprehensive test coverage with Jasmine and Karma

## Prerequisites

Before running this application, ensure you have the following installed:

1. **Node.js and npm**
   - Download and install from: https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
   - Recommended version: Node.js 18+ and npm 9+

2. **Gemini API Key**
   - Visit Google AI Studio: https://aistudio.google.com/
   - Click "Get API Key" to obtain your API key

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/google-gemini/angular-webaudio-melodies-sample.git
   cd angular-webaudio-melodies-sample
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify installation:**
   ```bash
   npm --version
   node --version
   ```

## Usage

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Open your browser** and navigate to `http://localhost:4200`

3. **Enter your Gemini API key** in the designated input field

4. **Generate melodies:**
   - Enter a text prompt (e.g., "Twinkle Twinkle Little Star")
   - Click the "Generate" button
   - Listen to the synthesized melody and watch the keyboard visualization

5. **Apply resonance effects:**
   - Use the Rezonate Controls panel below the keyboard
   - Enable/disable resonance filtering
   - Select from preset configurations (Warm, Bright, Mellow)
   - Adjust master gain for overall effect intensity

6. **Experiment with Hydi effects:**
   - Enable Hydi harmonic synthesis
   - Choose from preset configurations (Gentle, Intense, Ethereal)
   - Adjust intensity and modulation rate in real-time
   - Combine with resonance for rich, complex timbres

### Available Scripts

- `npm start` - Start the development server
- `npm run build` - Build the application for production
- `npm run watch` - Build the application in watch mode
- `npm test` - Run unit tests

## Resonance Effects and Hydi Integration

### Rezonate Core System

The application now includes a sophisticated resonance effects system that enhances melody playback with advanced audio processing:

#### Resonance Filtering
- **Multi-stage Biquad Filters**: Four cascaded filter stages for rich resonance
- **Dynamic Configuration**: Real-time adjustment of frequency, gain, and Q-factor
- **Preset Profiles**: Built-in presets for different sonic characteristics:
  - **Warm**: Emphasizes low-mid frequencies for rich, mellow tones
  - **Bright**: Enhances high frequencies for crisp, clear sound
  - **Mellow**: Balanced response with gentle resonance

#### Hydi Effects
- **Harmonic Synthesis**: Generates additional harmonics for complex timbres
- **Dynamic Modulation**: LFO-controlled frequency modulation for evolving textures
- **Intensity Control**: Adjustable harmonic strength and modulation depth
- **Preset Configurations**:
  - **Gentle**: Subtle harmonic enhancement
  - **Intense**: Strong harmonic presence with fast modulation
  - **Ethereal**: Slow modulation for ambient, otherworldly effects

#### Real-time Control
- **Live Parameter Adjustment**: Modify effects during melody playback
- **Visual Feedback**: Status indicators for active effects
- **Seamless Integration**: Effects apply to both generated and manually played notes

### Usage with Effects

1. **Enable Resonance**: Toggle resonance filtering for enhanced audio quality
2. **Select Presets**: Choose from predefined effect profiles
3. **Adjust Parameters**: Fine-tune gain, intensity, and modulation in real-time
4. **Combine Effects**: Use resonance and Hydi together for complex sound design

## Dependencies

### Production Dependencies

- **@angular/core**: ^17.3.0 - Core Angular framework
- **@angular/common**: ^17.3.0 - Common Angular utilities
- **@angular/platform-browser**: ^17.3.0 - Browser platform
- **@angular/router**: ^17.3.0 - Angular routing
- **@angular/forms**: ^17.3.0 - Angular forms
- **@angular/animations**: ^17.3.0 - Angular animations
- **@google/generative-ai**: ^0.11.3 - Google Gemini API client
- **rxjs**: ~7.8.0 - Reactive programming library
- **tslib**: ^2.3.0 - TypeScript helper library
- **zone.js**: ~0.14.3 - Angular change detection

### Development Dependencies

- **@angular/cli**: ^17.3.4 - Angular CLI
- **@angular/compiler-cli**: ^17.3.0 - Angular compiler
- **typescript**: ~5.4.2 - TypeScript compiler
- **karma**: ~6.4.0 - Test runner
- **jasmine**: ~5.1.0 - Testing framework
- **karma-jasmine**: ~5.1.0 - Karma Jasmine adapter

## Contributing

We welcome contributions to this project! Please see our [Contributing Guidelines](docs/CONTRIBUTING.md) for details on:

- Signing the Contributor License Agreement (CLA)
- Code review process
- Community guidelines
- How to submit pull requests

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## API Key Privacy

**Important Security Notice:**

Calling the Google AI Gemini API directly from the frontend is recommended for prototyping only. For production applications, we strongly recommend calling the API server-side to protect your API key.

**Security Risks:**
- Embedding API keys in client-side code exposes them to potential theft
- Malicious actors could extract and misuse your API key
- This could result in unauthorized usage charges

**Recommended Approach:**
- Implement server-side API calls
- Store API keys securely on your backend
- Use environment variables or secure key management services

For examples of secure server-side implementation, see the [Gemini API tutorials](https://ai.google.dev/gemini-api/docs/get-started).

## DAW Architecture

This project has evolved into a comprehensive Digital Audio Workstation (DAW) with advanced features:

### Core Components

- **DAW Engine** (`daw-core.ts`): Central audio engine managing tracks, clips, and playback
- **Rezonate Core** (`rezonate-core.ts`): Advanced resonance effects processing system
- **Synthesizer** (`daw-synthesizer.ts`): Polyphonic software synthesizer with multiple presets
- **Project Manager** (`daw-project-manager.ts`): Project save/load and session management
- **File Handler** (`daw-file-handler.ts`): Import/export functionality for various audio formats
- **Automation System** (`daw-automation.ts`): Parameter automation with envelope-based curves
- **Analysis Tools** (`daw-analysis.ts`): Real-time spectrum analysis and level metering
- **Effects Library** (`daw-effects.ts`): Comprehensive built-in effects (EQ, compression, reverb, etc.)
- **Performance Monitor** (`daw-performance.ts`): Memory management and performance optimization
- **Test Suite** (`daw-tests.ts`): Comprehensive unit and integration tests

### UI Components

- **Main DAW Interface** (`daw-main.ts`): Central hub integrating all components
- **Transport Controls** (`daw-transport.ts`): Play, pause, record, and navigation controls
- **Timeline** (`daw-timeline.ts`): Arrangement view with clip editing and automation
- **Mixer** (`daw-mixer.ts`): Track controls, effects, and routing
- **Rezonate Controls** (`rezonate-controls.ts`): Resonance and Hydi effect controls

### Key Features

- **Multi-track Recording**: Support for audio and MIDI tracks
- **Real-time Effects Processing**: Low-latency effects with dynamic parameter control
- **Advanced Automation**: Envelope-based automation for all parameters
- **Professional Mixing**: Comprehensive mixer with EQ, compression, and routing
- **High-Performance Architecture**: Optimized for low latency and high-quality audio
- **Cross-Platform Compatibility**: Works across different browsers and devices
- **Extensible Plugin System**: Modular architecture for adding new features

### File Structure

```
src/app/
├── daw-core.ts              # Central DAW engine
├── rezonate-core.ts         # Resonance effects system
├── daw-synthesizer.ts       # Software synthesizer
├── daw-project-manager.ts   # Project management
├── daw-file-handler.ts      # File I/O operations
├── daw-automation.ts        # Parameter automation
├── daw-analysis.ts          # Audio analysis tools
├── daw-effects.ts           # Effects library
├── daw-performance.ts       # Performance optimization
├── daw-tests.ts             # Test suite
├── daw-main.ts              # Main DAW interface
├── daw-transport.ts         # Transport controls
├── daw-timeline.ts          # Timeline/arrangement view
├── daw-mixer.ts             # Mixer interface
├── rezonate-controls.ts     # Resonance controls UI
├── keyboard.component.ts    # Virtual keyboard (enhanced)
├── app.component.ts         # Main app component
└── note-frequencies.ts      # Note frequency mappings
```

### Performance Optimizations

- **Memory Pooling**: Efficient buffer management to reduce garbage collection
- **Audio Worklets**: Low-latency processing using Web Audio API worklets
- **Progressive Rendering**: Smooth UI updates with requestAnimationFrame
- **Resource Pooling**: Reusable object pools for frequently created resources
- **Adaptive Quality**: Automatic quality adjustments based on device capabilities

### Testing and Quality Assurance

The project includes comprehensive testing:
- **Unit Tests**: Individual component testing
- **Integration Tests**: Full workflow testing
- **Performance Benchmarks**: Audio processing performance metrics
- **Cross-browser Testing**: Compatibility verification

Run tests with: `npm test`

### Development and Contributing

The DAW architecture is designed to be modular and extensible. New features can be added by:
1. Creating new components following the established patterns
2. Adding effects to the effects library
3. Extending the synthesizer with new presets
4. Implementing new analysis tools

See the [Contributing Guidelines](docs/CONTRIBUTING.md) for detailed development information.
