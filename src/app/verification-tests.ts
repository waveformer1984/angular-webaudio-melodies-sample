/**
 * Verification Tests - Comprehensive testing suite for Rezonate components
 * Tests all major functionality including audio, AI generation, and effects
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// Import all Rezonate components
import { RezonateCore } from './rezonate-core';
import { LyricsGenerator } from './lyrics-generator';
import { VoiceSynthesizer } from './voice-synthesis';
import { MIDIPatternGenerator } from './midi-pattern-generator';
import { SongIdeaGenerator } from './song-idea-generator';
import { ModelTrackVisualizer } from './model-track-visualizer';
import { SessionRecorder } from './session-recorder';
import { SoundPackPipeline } from './sound-pack-pipeline';

export class RezonateTestSuite {
  private audioContext: AudioContext;
  private testResults: TestResult[] = [];

  constructor() {
    // Create audio context for testing
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // Run all tests
  async runAllTests(): Promise<TestSuiteResult> {
    console.log('Starting Rezonate verification tests...');

    const tests = [
      this.testRezonateCore,
      this.testLyricsGenerator,
      this.testVoiceSynthesis,
      this.testMIDIPatternGenerator,
      this.testSongIdeaGenerator,
      this.testModelTrackVisualizer,
      this.testSessionRecorder,
      this.testSoundPackPipeline,
      this.testIntegration
    ];

    for (const test of tests) {
      try {
        const result = await test.call(this);
        this.testResults.push(result);
        console.log(`✓ ${result.testName}: ${result.passed ? 'PASSED' : 'FAILED'}`);
        if (!result.passed && result.error) {
          console.error(`  Error: ${result.error}`);
        }
      } catch (error) {
        const errorResult: TestResult = {
          testName: test.name,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0
        };
        this.testResults.push(errorResult);
        console.error(`✗ ${test.name}: FAILED - ${errorResult.error}`);
      }
    }

    const suiteResult: TestSuiteResult = {
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(r => r.passed).length,
      failedTests: this.testResults.filter(r => !r.passed).length,
      totalDuration: this.testResults.reduce((sum, r) => sum + r.duration, 0),
      results: this.testResults
    };

    console.log(`\nTest Suite Complete:`);
    console.log(`Total: ${suiteResult.totalTests}`);
    console.log(`Passed: ${suiteResult.passedTests}`);
    console.log(`Failed: ${suiteResult.failedTests}`);
    console.log(`Duration: ${suiteResult.totalDuration.toFixed(2)}ms`);

    return suiteResult;
  }

  // Test Rezonate Core functionality
  async testRezonateCore(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const rezonateCore = new RezonateCore(this.audioContext);

      // Test basic initialization
      expect(rezonateCore).toBeDefined();

      // Test resonance enable/disable
      rezonateCore.setResonanceEnabled(true);
      expect(rezonateCore.getResonanceEnabled()).toBe(true);

      rezonateCore.setResonanceEnabled(false);
      expect(rezonateCore.getResonanceEnabled()).toBe(false);

      // Test Hydi enable/disable
      const hydiConfig = {
        enabled: true,
        intensity: 0.5,
        harmonics: [0.5, 1.0, 2.0],
        modulationRate: 0.1
      };

      rezonateCore.enableHydi(hydiConfig);
      expect(rezonateCore.getHydiEnabled()).toBe(true);

      rezonateCore.enableHydi({ ...hydiConfig, enabled: false });
      expect(rezonateCore.getHydiEnabled()).toBe(false);

      // Test master gain
      rezonateCore.setMasterGain(0.8);
      // Note: We can't easily test internal gain values without exposing them

      // Test disposal
      rezonateCore.dispose();

      const duration = performance.now() - startTime;
      return {
        testName: 'RezonateCore',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'RezonateCore',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test Lyrics Generator
  async testLyricsGenerator(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const seed = {
        title: 'Test Song',
        mood: 'happy',
        style: 'pop',
        targetLength: 8
      };

      const lyrics = await LyricsGenerator.generateLyrics({ seed });

      // Test basic structure
      expect(lyrics).toBeDefined();
      expect(lyrics.title).toBe('Test Song');
      expect(lyrics.sections).toBeDefined();
      expect(lyrics.sections.length).toBeGreaterThan(0);

      // Test metadata
      expect(lyrics.metadata).toBeDefined();
      expect(lyrics.metadata.mood).toBe('happy');
      expect(lyrics.metadata.totalSyllables).toBeGreaterThan(0);

      // Test validation
      const validation = LyricsGenerator.validateLyrics(lyrics);
      expect(validation.valid).toBe(true);

      // Test export functions
      const textExport = LyricsGenerator.exportToText(lyrics);
      expect(textExport).toContain('Test Song');

      const jsonExport = LyricsGenerator.exportToJSON(lyrics);
      expect(jsonExport.title).toBe('Test Song');

      const duration = performance.now() - startTime;
      return {
        testName: 'LyricsGenerator',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'LyricsGenerator',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test Voice Synthesis
  async testVoiceSynthesis(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const synthesizer = new VoiceSynthesizer(this.audioContext);

      const options = {
        text: 'Hello world',
        tempo: 120,
        style: 'speech' as const,
        voice: 'female' as const
      };

      const result = await synthesizer.synthesize(options);

      // Test result structure
      expect(result).toBeDefined();
      expect(result.stem).toBeDefined();
      expect(result.stem.audioBuffer).toBeDefined();
      expect(result.stem.duration).toBeGreaterThan(0);
      expect(result.alignment).toBeDefined();
      expect(result.quality).toBeDefined();

      // Test quality metrics
      expect(result.quality.intelligibility).toBeGreaterThanOrEqual(0);
      expect(result.quality.intelligibility).toBeLessThanOrEqual(1);

      const duration = performance.now() - startTime;
      return {
        testName: 'VoiceSynthesis',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'VoiceSynthesis',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test MIDI Pattern Generator
  async testMIDIPatternGenerator(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const seed = {
        tempo: 120,
        key: 'C',
        scale: 'major',
        style: 'pop',
        complexity: 0.5,
        length: 4
      };

      // Test drum patterns
      const drumPatterns = MIDIPatternGenerator.generateDrumPatterns({
        seed,
        count: 2
      });

      expect(drumPatterns).toBeDefined();
      expect(drumPatterns.length).toBe(2);

      drumPatterns.forEach(pattern => {
        expect(pattern.type).toBe('drums');
        expect(pattern.notes).toBeDefined();
        expect(pattern.notes.length).toBeGreaterThan(0);
        expect(pattern.tempo).toBe(120);
      });

      // Test bass patterns
      const bassPatterns = MIDIPatternGenerator.generateBassPatterns({
        seed,
        count: 1
      });

      expect(bassPatterns).toBeDefined();
      expect(bassPatterns.length).toBe(1);
      expect(bassPatterns[0].type).toBe('bass');

      // Test chord patterns
      const chordPatterns = MIDIPatternGenerator.generateChordPatterns({
        seed,
        count: 1
      });

      expect(chordPatterns).toBeDefined();
      expect(chordPatterns.length).toBe(1);
      expect(chordPatterns[0].type).toBe('chords');

      // Test lead patterns
      const leadPatterns = MIDIPatternGenerator.generateLeadPatterns({
        seed,
        count: 1
      });

      expect(leadPatterns).toBeDefined();
      expect(leadPatterns.length).toBe(1);
      expect(leadPatterns[0].type).toBe('lead');

      const duration = performance.now() - startTime;
      return {
        testName: 'MIDIPatternGenerator',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'MIDIPatternGenerator',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test Song Idea Generator
  async testSongIdeaGenerator(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const seed = {
        mood: 'happy',
        style: 'pop',
        theme: 'love',
        tempo: 120,
        key: 'C',
        complexity: 0.5
      };

      const ideas = await SongIdeaGenerator.generateIdeas({
        seed,
        count: 2
      });

      expect(ideas).toBeDefined();
      expect(ideas.length).toBe(2);

      ideas.forEach(idea => {
        expect(idea.title).toBeDefined();
        expect(idea.chordProgression).toBeDefined();
        expect(idea.chordProgression.length).toBeGreaterThan(0);
        expect(idea.tempo).toBeGreaterThan(0);
        expect(idea.key).toBeDefined();
        expect(idea.mood).toBe('happy');
        expect(idea.style).toBe('pop');
        expect(idea.metadata).toBeDefined();
      });

      // Test validation
      const validation = SongIdeaGenerator.validateIdea(ideas[0]);
      expect(validation.valid).toBe(true);

      // Test export
      const jsonExport = SongIdeaGenerator.exportToJSON(ideas[0]);
      expect(jsonExport.title).toBe(ideas[0].title);

      const duration = performance.now() - startTime;
      return {
        testName: 'SongIdeaGenerator',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'SongIdeaGenerator',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test Model Track Visualizer
  async testModelTrackVisualizer(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const visualizer = new ModelTrackVisualizer(this.audioContext);

      // Create test audio buffer
      const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate, this.audioContext.sampleRate);
      const channelData = buffer.getChannelData(0);

      // Fill with test data (sine wave)
      for (let i = 0; i < buffer.length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / this.audioContext.sampleRate) * 0.1;
      }

      // Create test MIDI notes
      const midiNotes = [
        { pitch: 60, startTime: 0, duration: 1, velocity: 100 },
        { pitch: 64, startTime: 1, duration: 1, velocity: 100 },
        { pitch: 67, startTime: 2, duration: 1, velocity: 100 }
      ];

      const visualization = await visualizer.generateVisualization(buffer, midiNotes);

      // Test visualization structure
      expect(visualization).toBeDefined();
      expect(visualization.pianoRoll).toBeDefined();
      expect(visualization.waveform).toBeDefined();
      expect(visualization.spectrogram).toBeDefined();
      expect(visualization.patternHeatmap).toBeDefined();
      expect(visualization.metadata).toBeDefined();

      // Test piano roll data
      expect(visualization.pianoRoll.notes).toBeDefined();
      expect(visualization.pianoRoll.notes.length).toBe(3);

      // Test waveform data
      expect(visualization.waveform.peaks).toBeDefined();
      expect(visualization.waveform.rms).toBeDefined();

      // Test spectrogram data
      expect(visualization.spectrogram.frequencies).toBeDefined();
      expect(visualization.spectrogram.times).toBeDefined();
      expect(visualization.spectrogram.magnitudes).toBeDefined();

      const duration = performance.now() - startTime;
      return {
        testName: 'ModelTrackVisualizer',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'ModelTrackVisualizer',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test Session Recorder
  async testSessionRecorder(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      const recorder = new SessionRecorder('test-project');

      // Test basic functionality
      expect(recorder).toBeDefined();

      // Test session start/stop
      recorder.startRecording();
      expect(recorder.getStatus().isRecording).toBe(true);

      // Record some test actions
      recorder.recordAction('test_action', { param: 'value' });
      recorder.recordParameterChange('test_component', 'test_param', 0.5);
      recorder.recordClipEvent('created', 'test-clip-1', { trackId: 'track-1' });

      // Test snapshot
      recorder.takeSnapshot();

      // Stop recording
      recorder.stopRecording();
      expect(recorder.getStatus().isRecording).toBe(false);

      // Test data export
      const sessionData = recorder.getSessionData();
      expect(sessionData).toBeDefined();
      expect(sessionData.sessionId).toBeDefined();
      expect(sessionData.analytics).toBeDefined();
      expect(sessionData.events).toBeDefined();
      expect(sessionData.snapshots).toBeDefined();

      // Test JSON export
      const jsonExport = recorder.exportToJSON();
      expect(jsonExport).toBeDefined();
      expect(typeof jsonExport).toBe('string');

      // Test statistics
      const stats = recorder.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalActions).toBeGreaterThan(0);

      // Clean up
      recorder.dispose();

      const duration = performance.now() - startTime;
      return {
        testName: 'SessionRecorder',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'SessionRecorder',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test Sound Pack Pipeline
  async testSoundPackPipeline(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Create mock session data
      const mockSessionData = [
        {
          events: [
            { type: 'action', action: 'create_clip', timestamp: new Date() },
            { type: 'parameter_change', action: 'volume_change', timestamp: new Date() }
          ],
          derivedFeatures: {
            energy: 0.7,
            danceability: 0.8,
            tempo: 120,
            key: 'C'
          }
        }
      ];

      // Test pattern extraction
      const extractionResult = await SoundPackPipeline.extractPatterns(mockSessionData);
      expect(extractionResult).toBeDefined();
      expect(extractionResult.patterns).toBeDefined();
      expect(extractionResult.quality).toBeGreaterThanOrEqual(0);
      expect(extractionResult.novelty).toBeGreaterThanOrEqual(0);

      // Test pack generation (may return null if criteria not met)
      const pack = await SoundPackPipeline.generatePack(
        extractionResult.patterns,
        {
          minPatterns: 1,
          maxPatterns: 5,
          qualityThreshold: 0.1,
          noveltyThreshold: 0.1,
          includePresets: false,
          includeMIDI: true,
          targetStyles: ['electronic']
        },
        mockSessionData
      );

      // Pack might be null if patterns don't meet criteria - that's OK for testing
      if (pack) {
        expect(pack.id).toBeDefined();
        expect(pack.name).toBeDefined();
        expect(pack.contents).toBeDefined();
        expect(pack.metadata).toBeDefined();
      }

      const duration = performance.now() - startTime;
      return {
        testName: 'SoundPackPipeline',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'SoundPackPipeline',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Test integration between components
  async testIntegration(): Promise<TestResult> {
    const startTime = performance.now();

    try {
      // Test end-to-end workflow: Generate song idea -> Create lyrics -> Synthesize voice

      // 1. Generate song idea
      const songIdea = await SongIdeaGenerator.generateIdeas({
        seed: {
          mood: 'happy',
          style: 'pop',
          tempo: 120,
          key: 'C',
          complexity: 0.5
        },
        count: 1
      });

      expect(songIdea.length).toBe(1);
      const idea = songIdea[0];

      // 2. Generate lyrics based on song idea
      const lyrics = await LyricsGenerator.generateLyrics({
        seed: {
          title: idea.title,
          mood: idea.mood,
          style: idea.style,
          targetLength: 12
        }
      });

      expect(lyrics.sections.length).toBeGreaterThan(0);

      // 3. Extract text from lyrics for synthesis
      const lyricText = lyrics.sections
        .filter(section => section.type === 'verse' || section.type === 'chorus')
        .map(section => section.lines.map(line => line.text).join(' '))
        .join(' ');

      // 4. Synthesize voice (if we have lyrics)
      if (lyricText.length > 10) {
        const voiceSynthesizer = new VoiceSynthesizer(this.audioContext);
        const voiceResult = await voiceSynthesizer.synthesize({
          text: lyricText.substring(0, 100), // Limit for testing
          tempo: idea.tempo,
          style: 'speech',
          voice: 'female'
        });

        expect(voiceResult.stem).toBeDefined();
        expect(voiceResult.stem.audioBuffer).toBeDefined();
      }

      // 5. Test session recording of the workflow
      const sessionRecorder = new SessionRecorder('integration-test');
      sessionRecorder.startRecording();

      sessionRecorder.recordAction('generate_song_idea', { ideaId: idea.id });
      sessionRecorder.recordAction('generate_lyrics', { lyricsId: lyrics.title });
      sessionRecorder.recordAction('synthesize_voice', { textLength: lyricText.length });

      sessionRecorder.stopRecording();

      const sessionStats = sessionRecorder.getStatistics();
      expect(sessionStats.totalActions).toBe(3);

      sessionRecorder.dispose();

      const duration = performance.now() - startTime;
      return {
        testName: 'Integration',
        passed: true,
        duration
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        testName: 'Integration',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      };
    }
  }

  // Clean up resources
  dispose(): void {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Test result interfaces
export interface TestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: TestResult[];
}

// Utility functions for testing
declare global {
  function expect(actual: any): {
    toBe(expected: any): void;
    toBeDefined(): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
  };
}

// Simple expect implementation for testing
globalThis.expect = function(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    },
    toBeDefined() {
      if (actual === undefined || actual === null) {
        throw new Error(`Expected value to be defined, but got ${actual}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (typeof actual !== 'number' || actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual < expected) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      if (typeof actual !== 'number' || actual > expected) {
        throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
      }
    }
  };
};

// Export test runner
export async function runRezonateTests(): Promise<TestSuiteResult> {
  const testSuite = new RezonateTestSuite();
  const results = await testSuite.runAllTests();
  testSuite.dispose();
  return results;
}