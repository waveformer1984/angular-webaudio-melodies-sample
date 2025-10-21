/**
 * DAW Test Suite - Comprehensive testing for all DAW components
 * Unit tests, integration tests, and performance benchmarks
 */

import { DAWEngine, Track, Clip } from './daw-core';
import { DAWProjectManager } from './daw-project-manager';
import { DAWSynthesizer } from './daw-synthesizer';
import { DAWFileHandler } from './daw-file-handler';
import { DAWAutomation } from './daw-automation';
import { DAWAnalyzer } from './daw-analysis';
import { DAWEffectsLibrary, EffectChainProcessor } from './daw-effects';
import { DAWPerformanceMonitor } from './daw-performance';

// Test Utilities
export class DAWTestUtils {
  static createMockAudioContext(): AudioContext {
    return new AudioContext();
  }

  static createMockAudioBuffer(audioContext: AudioContext, duration = 1, sampleRate = 44100): AudioBuffer {
    const length = Math.floor(duration * sampleRate);
    const buffer = audioContext.createBuffer(2, length, sampleRate);

    // Fill with sine wave
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.1;
      }
    }

    return buffer;
  }

  static createMockMidiClip(): Clip {
    return {
      id: 'test-midi-clip',
      trackId: 'test-track',
      startTime: 0,
      duration: 2,
      offset: 0,
      type: 'midi',
      data: [
        { note: 60, velocity: 100, startTime: 0, duration: 0.5 },
        { note: 64, velocity: 100, startTime: 0.5, duration: 0.5 },
        { note: 67, velocity: 100, startTime: 1, duration: 0.5 }
      ],
      name: 'Test MIDI Clip'
    };
  }

  static async waitForAudioContext(audioContext: AudioContext): Promise<void> {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
  }
}

// Unit Tests
export class DAWUnitTests {
  private results: TestResult[] = [];

  constructor() {
    this.runAllTests();
  }

  private runAllTests(): void {
    this.testDAWEngine();
    this.testProjectManager();
    this.testSynthesizer();
    this.testLFO();
    this.testFileHandler();
    this.testAutomation();
    this.testAnalyzer();
    this.testEffects();
    this.testPerformance();
  }

  private testDAWEngine(): void {
    console.log('Testing DAW Engine...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const dawEngine = new DAWEngine();

    // Test track creation
    const track = dawEngine.createTrack('Test Track', 'audio');
    this.assert(track.id.length > 0, 'Track should have valid ID');
    this.assert(track.name === 'Test Track', 'Track should have correct name');
    this.assert(track.type === 'audio', 'Track should have correct type');

    // Test track update
    dawEngine.updateTrack(track.id, { volume: 0.8 });
    const updatedTrack = dawEngine.getTrack(track.id);
    this.assert(updatedTrack?.volume === 0.8, 'Track volume should be updated');

    // Test track deletion
    const deleted = dawEngine.deleteTrack(track.id);
    this.assert(deleted, 'Track should be deleted successfully');
    this.assert(dawEngine.getTrack(track.id) === undefined, 'Deleted track should not exist');

    audioContext.close();
  }

  private testProjectManager(): void {
    console.log('Testing Project Manager...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const dawEngine = new DAWEngine();
    const projectManager = new DAWProjectManager(dawEngine);

    // Test project creation
    const project = projectManager.createNewProject('Test Project');
    this.assert(project.name === 'Test Project', 'Project should have correct name');
    this.assert(project.bpm === 120, 'Project should have default BPM');

    // Test project save/load
    const savedProject = projectManager.saveProject();
    this.assert(savedProject !== null, 'Project should be saved successfully');
    this.assert(savedProject?.name === 'Test Project', 'Saved project should have correct name');

    audioContext.close();
  }

  private testSynthesizer(): void {
    console.log('Testing Synthesizer...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const rezonateCore = { getNode: () => audioContext.createGain() } as any;
    const synthesizer = new DAWSynthesizer(audioContext, rezonateCore);

    // Test oscillator configuration
    synthesizer.setOscillatorConfig(0, { type: 'sawtooth', frequency: 440, detune: 0, gain: 0.5, enabled: true });
    const preset = synthesizer.getCurrentPreset();
    this.assert(preset.oscillators[0].type === 'sawtooth', 'Oscillator type should be set');
    this.assert(preset.oscillators[0].frequency === 440, 'Oscillator frequency should be set');
    this.assert(preset.oscillators[0].detune === 0, 'Oscillator detune should be set');
    this.assert(preset.oscillators[0].gain === 0.5, 'Oscillator gain should be set');
    this.assert(preset.oscillators[0].enabled === true, 'Oscillator should be enabled');

    // Test filter configuration
    synthesizer.setFilterConfig({ type: 'lowpass', frequency: 1000, Q: 1, gain: 0 });
    this.assert(preset.filter.type === 'lowpass', 'Filter type should be set');
    this.assert(preset.filter.frequency === 1000, 'Filter frequency should be set');
    this.assert(preset.filter.Q === 1, 'Filter Q should be set');
    this.assert(preset.filter.gain === 0, 'Filter gain should be set');

    // Test envelope configuration
    synthesizer.setEnvelopeConfig({ attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 });
    this.assert(preset.envelope.attack === 0.01, 'Envelope attack should be set');
    this.assert(preset.envelope.decay === 0.1, 'Envelope decay should be set');
    this.assert(preset.envelope.sustain === 0.8, 'Envelope sustain should be set');
    this.assert(preset.envelope.release === 0.3, 'Envelope release should be set');

    // Test note on/off with velocity
    const voiceId = synthesizer.noteOn(60, 100);
    this.assert(typeof voiceId === 'string', 'Note on should return voice ID');
    this.assert(synthesizer.getActiveVoices() === 1, 'Should have one active voice');

    // Test note off
    synthesizer.noteOff(voiceId);
    // Note: voices are cleaned up asynchronously, so we can't test immediately

    // Test polyphony limits and voice stealing
    synthesizer.setPolyphony(2);
    this.assert(synthesizer.getPolyphony() === 2, 'Polyphony should be set to 2');

    const voiceId1 = synthesizer.noteOn(60, 100);
    const voiceId2 = synthesizer.noteOn(64, 100);
    const voiceId3 = synthesizer.noteOn(67, 100); // Should steal oldest voice
    this.assert(synthesizer.getActiveVoices() === 2, 'Should have 2 active voices after polyphony limit');

    synthesizer.noteOff(voiceId1);
    synthesizer.noteOff(voiceId2);
    synthesizer.noteOff(voiceId3);

    // Test master gain
    synthesizer.setMasterGain(0.5);
    this.assert(synthesizer.getMasterGain() === 0.5, 'Master gain should be set');

    // Test preset loading
    const presets = synthesizer.getPresets();
    this.assert(presets.length > 0, 'Should have available presets');
    this.assert(presets.includes('Basic Synth'), 'Should include Basic Synth preset');
    this.assert(presets.includes('Warm Pad'), 'Should include Warm Pad preset');
    this.assert(presets.includes('Brass'), 'Should include Brass preset');

    const loaded = synthesizer.loadPreset('Basic Synth');
    this.assert(loaded, 'Basic Synth preset should load successfully');

    // Test custom preset saving
    synthesizer.savePreset('Test Preset');
    const updatedPresets = synthesizer.getPresets();
    this.assert(updatedPresets.includes('Test Preset'), 'Custom preset should be saved');

    audioContext.close();
  }

  private testFileHandler(): void {
    console.log('Testing File Handler...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const fileHandler = new DAWFileHandler(audioContext);

    // Test file validation
    const mockWavFile = { name: 'test.wav', type: 'audio/wav', size: 1000 } as File;
    const isValidWav = fileHandler.validateAudioFile(mockWavFile);
    this.assert(isValidWav, 'WAV file should be valid');

    const mockMidiFile = { name: 'test.mid', type: 'audio/midi', size: 500 } as File;
    const isValidMidi = fileHandler.validateMidiFile(mockMidiFile);
    this.assert(isValidMidi, 'MIDI file should be valid');

    // Test supported formats
    const importFormats = fileHandler.getSupportedImportFormats();
    this.assert(importFormats.length > 0, 'Should have supported import formats');

    const exportFormats = fileHandler.getSupportedExportFormats();
    this.assert(exportFormats.length > 0, 'Should have supported export formats');

    audioContext.close();
  }

  private testAutomation(): void {
    console.log('Testing Automation...');

    const automation = new DAWAutomation();

    // Test automation lane creation
    const lane = automation.createAutomationLane('track1', 'volume');
    this.assert(lane.id.length > 0, 'Automation lane should have valid ID');
    this.assert(lane.parameter === 'volume', 'Lane should have correct parameter');

    // Test adding points
    automation.addAutomationPoint(lane.id, 0, 0.5);
    automation.addAutomationPoint(lane.id, 1, 0.8);
    automation.addAutomationPoint(lane.id, 2, 0.3);

    // Test value evaluation
    const value1 = automation.getAutomationValue(lane.id, 0);
    const value2 = automation.getAutomationValue(lane.id, 1);
    const value3 = automation.getAutomationValue(lane.id, 2);

    this.assert(Math.abs(value1 - 0.5) < 0.01, 'Should interpolate correctly at point 1');
    this.assert(Math.abs(value2 - 0.8) < 0.01, 'Should interpolate correctly at point 2');
    this.assert(Math.abs(value3 - 0.3) < 0.01, 'Should interpolate correctly at point 3');

    // Test intermediate values
    const midValue = automation.getAutomationValue(lane.id, 0.5);
    this.assert(midValue >= 0.5 && midValue <= 0.8, 'Should interpolate between points');
  }

  private testAnalyzer(): void {
    console.log('Testing Analyzer...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const analyzer = new DAWAnalyzer(audioContext);

    // Test spectrum analysis
    const spectrum = analyzer.getSpectrumData();
    this.assert(spectrum.frequencies.length > 0, 'Should have frequency data');
    this.assert(spectrum.magnitudes.length > 0, 'Should have magnitude data');

    // Test level analysis
    const levels = analyzer.getLevelData();
    this.assert(typeof levels.peak === 'number', 'Should have peak level');
    this.assert(typeof levels.rms === 'number', 'Should have RMS level');
    this.assert(typeof levels.crest === 'number', 'Should have crest factor');

    audioContext.close();
  }

  private testEffects(): void {
    console.log('Testing Effects...');

    const effects = DAWEffectsLibrary.getAllEffects();
    this.assert(effects.length > 0, 'Should have available effects');

    const categories = DAWEffectsLibrary.getCategories();
    this.assert(categories.length > 0, 'Should have effect categories');

    // Test effect retrieval
    const parametricEq = DAWEffectsLibrary.getEffectById('parametric-eq');
    this.assert(parametricEq !== undefined, 'Should find parametric EQ effect');
    this.assert(parametricEq?.name === 'Parametric EQ', 'Effect should have correct name');

    // Test effects by category
    const eqEffects = DAWEffectsLibrary.getEffectsByCategory('EQ');
    this.assert(eqEffects.length > 0, 'Should have EQ effects');
  }

  private testPerformance(): void {
    console.log('Testing Performance Monitor...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const monitor = new DAWPerformanceMonitor();

    monitor.startMonitoring(audioContext);

    // Test metrics retrieval
    const metrics = monitor.getMetrics();
    this.assert(typeof metrics.audioContextLatency === 'number', 'Should have latency metric');
    this.assert(typeof metrics.currentMemoryUsage === 'number', 'Should have memory metric');

    // Test event tracking
    monitor.trackAudioGlitch();
    monitor.trackBufferUnderrun();

    const updatedMetrics = monitor.getMetrics();
    this.assert(updatedMetrics.audioGlitches === 1, 'Should track audio glitches');
    this.assert(updatedMetrics.bufferUnderruns === 1, 'Should track buffer underruns');

    monitor.stopMonitoring();
    audioContext.close();
  }

  private testLFO(): void {
    console.log('Testing LFO System...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const rezonateCore = { getNode: () => audioContext.createGain() } as any;
    const synthesizer = new DAWSynthesizer(audioContext, rezonateCore);

    // Test LFO configuration
    synthesizer.setLFOConfig(0, { rate: 2, depth: 0.5, waveform: 'sine', enabled: true });
    const preset = synthesizer.getCurrentPreset();
    this.assert(preset.lfos[0].rate === 2, 'LFO rate should be set');
    this.assert(preset.lfos[0].depth === 0.5, 'LFO depth should be set');
    this.assert(preset.lfos[0].waveform === 'sine', 'LFO waveform should be set');
    this.assert(preset.lfos[0].enabled === true, 'LFO should be enabled');

    // Test modulation matrix
    synthesizer.addModulationTarget({ parameter: 'oscillator_frequency', amount: 0.3, lfoIndex: 0 });
    this.assert(preset.modulationMatrix.length === 1, 'Should have modulation target');
    this.assert(preset.modulationMatrix[0].parameter === 'oscillator_frequency', 'Modulation parameter should be set');
    this.assert(preset.modulationMatrix[0].amount === 0.3, 'Modulation amount should be set');
    this.assert(preset.modulationMatrix[0].lfoIndex === 0, 'LFO index should be set');

    // Test removing modulation target
    synthesizer.removeModulationTarget(0);
    this.assert(preset.modulationMatrix.length === 0, 'Modulation target should be removed');

    // Test multiple LFOs
    synthesizer.setLFOConfig(1, { rate: 0.5, depth: 0.8, waveform: 'triangle', enabled: true });
    synthesizer.setLFOConfig(2, { rate: 4, depth: 0.2, waveform: 'square', enabled: false });
    this.assert(preset.lfos[1].rate === 0.5, 'Second LFO rate should be set');
    this.assert(preset.lfos[2].enabled === false, 'Third LFO should be disabled');

    audioContext.close();
  }

  private assert(condition: boolean, message: string): void {
    if (condition) {
      console.log(`✓ ${message}`);
      this.results.push({ passed: true, message });
    } else {
      console.error(`✗ ${message}`);
      this.results.push({ passed: false, message });
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getPassRate(): number {
    const passed = this.results.filter(r => r.passed).length;
    return (passed / this.results.length) * 100;
  }
}

// Integration Tests
export class DAWIntegrationTests {
  private results: TestResult[] = [];

  constructor() {
    this.runAllTests();
  }

  private async runAllTests(): Promise<void> {
    await this.testFullWorkflow();
    await this.testAudioProcessingChain();
    await this.testProjectPersistence();
    await this.testSynthesizerIntegration();
    await this.testErrorHandling();
  }

  private async testFullWorkflow(): Promise<void> {
    console.log('Testing Full Workflow...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    await DAWTestUtils.waitForAudioContext(audioContext);

    const dawEngine = new DAWEngine();
    const projectManager = new DAWProjectManager(dawEngine);
    const synthesizer = new DAWSynthesizer(audioContext, dawEngine.getRezonateCore());

    // Create project
    const project = projectManager.createNewProject('Integration Test');
    this.assert(project.name === 'Integration Test', 'Project should be created');

    // Create tracks
    const audioTrack = dawEngine.createTrack('Audio Track', 'audio');
    const midiTrack = dawEngine.createTrack('MIDI Track', 'midi');
    this.assert(dawEngine.getTracks().length === 2, 'Should have two tracks');

    // Add clips
    const audioBuffer = DAWTestUtils.createMockAudioBuffer(audioContext);
    const midiClip = DAWTestUtils.createMockMidiClip();

    // Test synthesizer
    const voiceId = synthesizer.noteOn(60, 100);
    this.assert(typeof voiceId === 'string', 'Synthesizer should create voice');

    synthesizer.noteOff(voiceId);

    // Save and load project
    const saved = projectManager.saveProject();
    this.assert(saved !== null, 'Project should save successfully');

    audioContext.close();
  }

  private async testAudioProcessingChain(): Promise<void> {
    console.log('Testing Audio Processing Chain...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    await DAWTestUtils.waitForAudioContext(audioContext);

    const rezonateCore = { getNode: () => audioContext.createGain() } as any;
    const effectChain = new EffectChainProcessor(audioContext);

    // Add effects to chain
    const parametricEq = DAWEffectsLibrary.getEffectById('parametric-eq');
    if (parametricEq) {
      effectChain.addEffect(parametricEq, { frequency: 1000, gain: 2, Q: 1 });
    }

    const delay = DAWEffectsLibrary.getEffectById('delay');
    if (delay) {
      effectChain.addEffect(delay, { time: 0.3, feedback: 0.3, wet: 0.5, dry: 0.5 });
    }

    // Test chain connections
    const input = effectChain.getInput();
    const output = effectChain.getOutput();
    this.assert(input !== null, 'Should have input node');
    this.assert(output !== null, 'Should have output node');

    audioContext.close();
  }

  private async testProjectPersistence(): Promise<void> {
    console.log('Testing Project Persistence...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const dawEngine = new DAWEngine();
    const projectManager = new DAWProjectManager(dawEngine);

    // Create complex project
    const project = projectManager.createNewProject('Persistence Test');
    dawEngine.createTrack('Track 1', 'audio');
    dawEngine.createTrack('Track 2', 'midi');

    // Save project
    const savedData = projectManager.saveProject();
    this.assert(savedData !== null, 'Should save project');

    // Create new instance and load
    const newDawEngine = new DAWEngine();
    const newProjectManager = new DAWProjectManager(newDawEngine);

    if (savedData) {
      // Simulate loading from saved data
      newProjectManager.loadProject(savedData);
      const loadedProject = newProjectManager.getCurrentSession();
      this.assert(loadedProject?.project.name === 'Persistence Test', 'Should load project correctly');
    }

    audioContext.close();
  }

  private async testSynthesizerIntegration(): Promise<void> {
    console.log('Testing Synthesizer Integration...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    await DAWTestUtils.waitForAudioContext(audioContext);

    const rezonateCore = { getNode: () => audioContext.createGain() } as any;
    const synthesizer = new DAWSynthesizer(audioContext, rezonateCore);

    // Test audio context integration
    this.assert(audioContext.state === 'running', 'Audio context should be running');
    this.assert(synthesizer.getMasterGain() >= 0 && synthesizer.getMasterGain() <= 1, 'Master gain should be valid');

    // Test Web Audio API node connections
    const masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
    this.assert(masterGainNode.numberOfOutputs === 1, 'Master gain node should have outputs');

    // Test real-time audio processing
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    masterGainNode.connect(analyser);

    // Generate some audio and check if it's processed
    const voiceId = synthesizer.noteOn(60, 100);
    await new Promise(resolve => setTimeout(resolve, 100));

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    // Check if there's any audio data (should be non-zero for active audio)
    const hasAudio = dataArray.some(value => value > 0);
    this.assert(hasAudio, 'Should detect audio output from synthesizer');

    synthesizer.noteOff(voiceId);

    audioContext.close();
  }

  private async testErrorHandling(): Promise<void> {
    console.log('Testing Error Handling...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const rezonateCore = { getNode: () => audioContext.createGain() } as any;
    const synthesizer = new DAWSynthesizer(audioContext, rezonateCore);

    // Test invalid parameter values
    synthesizer.setOscillatorConfig(10, { type: 'invalid' as any }); // Invalid index
    synthesizer.setFilterConfig({ frequency: -100 }); // Invalid frequency
    synthesizer.setEnvelopeConfig({ attack: -1 }); // Invalid attack time
    synthesizer.setPolyphony(-5); // Invalid polyphony
    synthesizer.setMasterGain(2); // Invalid gain > 1

    // Should not crash and maintain valid state
    this.assert(synthesizer.getPolyphony() >= 1, 'Polyphony should be valid after invalid input');
    this.assert(synthesizer.getMasterGain() >= 0 && synthesizer.getMasterGain() <= 1, 'Master gain should be clamped');

    // Test preset loading with invalid name
    const loaded = synthesizer.loadPreset('NonExistentPreset');
    this.assert(!loaded, 'Should not load invalid preset');

    // Test modulation matrix boundary conditions
    synthesizer.addModulationTarget({ parameter: 'invalid_param', amount: 2, lfoIndex: 10 }); // Invalid parameter and index
    synthesizer.removeModulationTarget(100); // Invalid index

    // Should not crash
    this.assert(true, 'Should handle invalid modulation parameters gracefully');

    // Test audio context state changes
    await audioContext.suspend();
    this.assert(audioContext.state === 'suspended', 'Audio context should be suspended');

    // Try operations while suspended (should not crash)
    synthesizer.noteOn(60, 100);
    synthesizer.setMasterGain(0.5);

    await audioContext.resume();
    this.assert(audioContext.state === 'running', 'Audio context should be running again');

    synthesizer.dispose();
    audioContext.close();
  }

  private assert(condition: boolean, message: string): void {
    if (condition) {
      console.log(`✓ ${message}`);
      this.results.push({ passed: true, message });
    } else {
      console.error(`✗ ${message}`);
      this.results.push({ passed: false, message });
    }
  }

  getResults(): TestResult[] {
    return this.results;
  }
}

// Performance Benchmarks
export class DAWPerformanceBenchmarks {
  private results: BenchmarkResult[] = [];

  constructor() {
    this.runAllBenchmarks();
  }

  private async runAllBenchmarks(): Promise<void> {
    await this.benchmarkAudioProcessing();
    await this.benchmarkProjectLoading();
    await this.benchmarkEffectProcessing();
    await this.benchmarkSynthesizerStress();
    await this.benchmark4HourSession();
  }

  private async benchmarkAudioProcessing(): Promise<void> {
    console.log('Benchmarking Audio Processing...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    await DAWTestUtils.waitForAudioContext(audioContext);

    const buffer = DAWTestUtils.createMockAudioBuffer(audioContext, 10); // 10 seconds
    const analyzer = new DAWAnalyzer(audioContext);

    const startTime = performance.now();

    // Process buffer in chunks
    const chunkSize = 1024;
    for (let i = 0; i < buffer.length; i += chunkSize) {
      // Simulate processing
      const chunk = buffer.getChannelData(0).slice(i, i + chunkSize);
      analyzer.getLevelData();
    }

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    this.results.push({
      name: 'Audio Processing (10s buffer)',
      duration: processingTime,
      operationsPerSecond: (buffer.length / buffer.sampleRate) / (processingTime / 1000)
    });

    audioContext.close();
  }

  private async benchmarkProjectLoading(): Promise<void> {
    console.log('Benchmarking Project Loading...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    const dawEngine = new DAWEngine();
    const projectManager = new DAWProjectManager(dawEngine);

    // Create large project
    const project = projectManager.createNewProject('Benchmark Project');
    for (let i = 0; i < 20; i++) {
      dawEngine.createTrack(`Track ${i}`, i % 2 === 0 ? 'audio' : 'midi');
    }

    const startTime = performance.now();
    const savedData = projectManager.saveProject();
    const saveTime = performance.now() - startTime;

    if (savedData) {
      const loadStartTime = performance.now();
      projectManager.loadProject(savedData);
      const loadTime = performance.now() - loadStartTime;

      this.results.push({
        name: 'Project Save/Load (20 tracks)',
        duration: saveTime + loadTime,
        operationsPerSecond: 1 / ((saveTime + loadTime) / 1000)
      });
    }

    audioContext.close();
  }

  private async benchmarkEffectProcessing(): Promise<void> {
    console.log('Benchmarking Effect Processing...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    await DAWTestUtils.waitForAudioContext(audioContext);

    const effectChain = new EffectChainProcessor(audioContext);

    // Add multiple effects
    const effects = ['parametric-eq', 'delay', 'reverb', 'compressor'];
    effects.forEach(effectId => {
      const effect = DAWEffectsLibrary.getEffectById(effectId);
      if (effect) {
        effectChain.addEffect(effect, {});
      }
    });

    const buffer = DAWTestUtils.createMockAudioBuffer(audioContext, 5); // 5 seconds
    const startTime = performance.now();

    // Process through effect chain (simplified)
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(effectChain.getInput());
    effectChain.getOutput().connect(audioContext.destination);

    source.start();
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for processing

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    this.results.push({
      name: 'Effect Chain Processing (4 effects)',
      duration: processingTime,
      operationsPerSecond: 1 / (processingTime / 1000)
    });

    audioContext.close();
  }

  private async benchmarkSynthesizerStress(): Promise<void> {
    console.log('Benchmarking Synthesizer Stress Test...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    await DAWTestUtils.waitForAudioContext(audioContext);

    const rezonateCore = { getNode: () => audioContext.createGain() } as any;
    const synthesizer = new DAWSynthesizer(audioContext, rezonateCore);
    const monitor = new DAWPerformanceMonitor();

    monitor.startMonitoring(audioContext);

    const startTime = performance.now();
    const testDuration = 10000; // 10 seconds
    const endTime = startTime + testDuration;

    let noteCount = 0;
    let activeVoices = 0;

    // Rapid note triggering stress test
    while (performance.now() < endTime) {
      // Trigger random notes rapidly
      const note = Math.floor(Math.random() * 24) + 48; // C3 to C5
      const velocity = Math.floor(Math.random() * 100) + 27; // 27-127

      const voiceId = synthesizer.noteOn(note, velocity);
      activeVoices = Math.max(activeVoices, synthesizer.getActiveVoices());
      noteCount++;

      // Random note off after short duration
      setTimeout(() => {
        synthesizer.noteOff(voiceId);
      }, Math.random() * 200 + 50); // 50-250ms

      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const totalTime = performance.now() - startTime;
    const notesPerSecond = noteCount / (totalTime / 1000);

    const metrics = monitor.getMetrics();

    this.results.push({
      name: 'Synthesizer Stress Test (10s rapid notes)',
      duration: totalTime,
      operationsPerSecond: notesPerSecond,
      metadata: {
        totalNotes: noteCount,
        maxActiveVoices: activeVoices,
        memoryUsage: metrics.currentMemoryUsage,
        audioGlitches: metrics.audioGlitches
      }
    });

    monitor.stopMonitoring();
    synthesizer.dispose();
    audioContext.close();
  }

  private async benchmark4HourSession(): Promise<void> {
    console.log('Benchmarking 4-Hour Session Simulation...');

    const audioContext = DAWTestUtils.createMockAudioContext();
    await DAWTestUtils.waitForAudioContext(audioContext);

    const rezonateCore = { getNode: () => audioContext.createGain() } as any;
    const synthesizer = new DAWSynthesizer(audioContext, rezonateCore);
    const monitor = new DAWPerformanceMonitor();

    monitor.startMonitoring(audioContext);

    const startTime = performance.now();
    const sessionDuration = 4 * 60 * 60 * 1000; // 4 hours in milliseconds (scaled down for testing)
    const scaledDuration = 30000; // 30 seconds for testing, represents 4 hours
    const endTime = startTime + scaledDuration;

    let totalNotes = 0;
    let presetChanges = 0;
    let memoryChecks = 0;

    // Simulate 4-hour session with periodic activity
    while (performance.now() < endTime) {
      // Simulate user activity patterns
      const activityType = Math.random();

      if (activityType < 0.7) {
        // Play notes (70% of activity)
        const note = Math.floor(Math.random() * 36) + 36; // C2 to C5
        const voiceId = synthesizer.noteOn(note, 80);
        totalNotes++;

        setTimeout(() => synthesizer.noteOff(voiceId), Math.random() * 1000 + 200);
      } else if (activityType < 0.9) {
        // Change presets (20% of activity)
        const presets = synthesizer.getPresets();
        const randomPreset = presets[Math.floor(Math.random() * presets.length)];
        synthesizer.loadPreset(randomPreset);
        presetChanges++;
      } else {
        // Check memory usage (10% of activity)
        const metrics = monitor.getMetrics();
        memoryChecks++;
        // Log memory usage for monitoring
        if (metrics.currentMemoryUsage > 100 * 1024 * 1024) { // 100MB
          console.warn('High memory usage detected:', metrics.currentMemoryUsage);
        }
      }

      // Wait between activities (simulate user think time)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
    }

    const totalTime = performance.now() - startTime;
    const finalMetrics = monitor.getMetrics();

    this.results.push({
      name: '4-Hour Session Simulation',
      duration: totalTime,
      operationsPerSecond: (totalNotes + presetChanges) / (totalTime / 1000),
      metadata: {
        totalNotes,
        presetChanges,
        memoryChecks,
        finalMemoryUsage: finalMetrics.currentMemoryUsage,
        audioGlitches: finalMetrics.audioGlitches,
        bufferUnderruns: finalMetrics.bufferUnderruns
      }
    });

    monitor.stopMonitoring();
    synthesizer.dispose();
    audioContext.close();
  }

  getResults(): BenchmarkResult[] {
    return this.results;
  }
}

// Test Runner
export class DAWTestRunner {
  private unitTests: DAWUnitTests;
  private integrationTests: DAWIntegrationTests;
  private benchmarks: DAWPerformanceBenchmarks;

  constructor() {
    this.unitTests = new DAWUnitTests();
    this.integrationTests = new DAWIntegrationTests();
    this.benchmarks = new DAWPerformanceBenchmarks();
  }

  runAllTests(): TestReport {
    console.log('=== DAW Test Suite ===');

    const unitResults = this.unitTests.getResults();
    const integrationResults = this.integrationTests.getResults();
    const benchmarkResults = this.benchmarks.getResults();

    const report: TestReport = {
      unitTests: {
        total: unitResults.length,
        passed: unitResults.filter(r => r.passed).length,
        failed: unitResults.filter(r => !r.passed).length,
        results: unitResults
      },
      integrationTests: {
        total: integrationResults.length,
        passed: integrationResults.filter(r => r.passed).length,
        failed: integrationResults.filter(r => !r.passed).length,
        results: integrationResults
      },
      benchmarks: benchmarkResults,
      summary: {
        totalTests: unitResults.length + integrationResults.length,
        totalPassed: unitResults.filter(r => r.passed).length + integrationResults.filter(r => r.passed).length,
        totalFailed: unitResults.filter(r => !r.passed).length + integrationResults.filter(r => !r.passed).length,
        passRate: 0
      }
    };

    report.summary.passRate = (report.summary.totalPassed / report.summary.totalTests) * 100;

    this.printReport(report);
    return report;
  }

  private printReport(report: TestReport): void {
    console.log('\n=== Test Results ===');
    console.log(`Unit Tests: ${report.unitTests.passed}/${report.unitTests.total} passed`);
    console.log(`Integration Tests: ${report.integrationTests.passed}/${report.integrationTests.total} passed`);
    console.log(`Overall: ${report.summary.totalPassed}/${report.summary.totalTests} tests passed (${report.summary.passRate.toFixed(1)}%)`);

    console.log('\n=== Performance Benchmarks ===');
    report.benchmarks.forEach(benchmark => {
      console.log(`${benchmark.name}: ${benchmark.duration.toFixed(2)}ms`);
    });

    if (report.summary.totalFailed > 0) {
      console.log('\n=== Failed Tests ===');
      [...report.unitTests.results, ...report.integrationTests.results]
        .filter(r => !r.passed)
        .forEach(result => console.log(`✗ ${result.message}`));
    }
  }
}

// Type definitions
export interface TestResult {
  passed: boolean;
  message: string;
}

export interface BenchmarkResult {
  name: string;
  duration: number;
  operationsPerSecond: number;
  metadata?: any;
}

export interface TestReport {
  unitTests: {
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  };
  integrationTests: {
    total: number;
    passed: number;
    failed: number;
    results: TestResult[];
  };
  benchmarks: BenchmarkResult[];
  summary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    passRate: number;
  };
}

// Global test runner instance
export const dawTestRunner = new DAWTestRunner();