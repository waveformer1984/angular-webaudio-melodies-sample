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

    // Test note on/off
    const voiceId = synthesizer.noteOn(60, 100);
    this.assert(typeof voiceId === 'string', 'Note on should return voice ID');
    this.assert(synthesizer.getActiveVoices() === 1, 'Should have one active voice');

    synthesizer.noteOff(voiceId);
    // Note: voices are cleaned up asynchronously, so we can't test immediately

    // Test preset loading
    const presets = synthesizer.getPresets();
    this.assert(presets.length > 0, 'Should have available presets');

    const loaded = synthesizer.loadPreset(presets[0]);
    this.assert(loaded, 'Preset should load successfully');

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