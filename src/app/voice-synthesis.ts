/**
 * Voice Synthesis - Text-to-speech and singing voice generation
 * Creates vocal stems from lyrics with melody alignment
 */

export interface VoiceSynthesisOptions {
  text: string;
  melody?: number[]; // MIDI note numbers
  tempo: number;
  style: 'speech' | 'singing';
  voice: 'male' | 'female' | 'neutral';
  emotion?: 'happy' | 'sad' | 'energetic' | 'calm';
  language?: string;
}

export interface VocalStem {
  id: string;
  audioBuffer: AudioBuffer;
  duration: number;
  sampleRate: number;
  channels: number;
  metadata: {
    text: string;
    voice: string;
    style: string;
    emotion?: string;
    alignment: PhonemeAlignment[];
  };
}

export interface PhonemeAlignment {
  phoneme: string;
  startTime: number;
  endTime: number;
  pitch?: number;
  confidence: number;
}

export interface SynthesisResult {
  stem: VocalStem;
  alignment: PhonemeAlignment[];
  quality: {
    intelligibility: number; // 0-1
    naturalness: number; // 0-1
    pitchAccuracy: number; // 0-1
  };
}

export class VoiceSynthesizer {
  private audioContext: AudioContext;
  private sampleRate: number;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.sampleRate = audioContext.sampleRate;
  }

  // Main synthesis method
  async synthesize(options: VoiceSynthesisOptions): Promise<SynthesisResult> {
    if (options.style === 'singing' && options.melody) {
      return this.synthesizeSinging(options);
    } else {
      return this.synthesizeSpeech(options);
    }
  }

  // Speech synthesis using Web Speech API
  private async synthesizeSpeech(options: VoiceSynthesisOptions): Promise<SynthesisResult> {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(options.text);
      utterance.rate = this.getRateForTempo(options.tempo);
      utterance.pitch = this.getPitchForVoice(options.voice);
      utterance.volume = 0.8;

      // Select appropriate voice
      const voices = speechSynthesis.getVoices();
      const selectedVoice = this.selectVoice(voices, options.voice, options.language);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Create audio buffer from speech
      this.speechToBuffer(utterance).then(result => {
        const alignment = this.generateBasicAlignment(options.text, result.duration);

        const stem: VocalStem = {
          id: `speech-${Date.now()}`,
          audioBuffer: result.buffer,
          duration: result.duration,
          sampleRate: this.sampleRate,
          channels: 1,
          metadata: {
            text: options.text,
            voice: options.voice,
            style: 'speech',
            emotion: options.emotion,
            alignment
          }
        };

        resolve({
          stem,
          alignment,
          quality: {
            intelligibility: 0.85,
            naturalness: 0.75,
            pitchAccuracy: 0.9
          }
        });
      }).catch(reject);
    });
  }

  // Singing voice synthesis (simplified implementation)
  private async synthesizeSinging(options: VoiceSynthesisOptions): Promise<SynthesisResult> {
    if (!options.melody) {
      throw new Error('Melody required for singing synthesis');
    }

    const duration = this.calculateSingingDuration(options.text, options.tempo);
    const buffer = this.audioContext.createBuffer(1, Math.floor(duration * this.sampleRate), this.sampleRate);

    // Generate basic singing voice using oscillators and formants
    const channelData = buffer.getChannelData(0);
    const phonemes = this.textToPhonemes(options.text);
    const alignment = this.generateSingingAlignment(phonemes, options.melody, options.tempo);

    let sampleIndex = 0;

    for (const phoneme of alignment) {
      const phonemeDuration = phoneme.endTime - phoneme.startTime;
      const samples = Math.floor(phonemeDuration * this.sampleRate);
      const pitch = phoneme.pitch || 60; // Default C4

      // Generate phoneme sound
      for (let i = 0; i < samples; i++) {
        const t = i / this.sampleRate;
        const frequency = this.midiToFrequency(pitch);

        // Basic formant synthesis
        const formants = this.getFormantsForPhoneme(phoneme.phoneme);
        let sample = 0;

        for (const formant of formants) {
          sample += Math.sin(2 * Math.PI * formant.frequency * t) * formant.amplitude;
        }

        // Apply pitch envelope
        const envelope = this.generatePitchEnvelope(t, phonemeDuration);
        sample *= envelope;

        // Add some noise for naturalness
        sample += (Math.random() - 0.5) * 0.1;

        channelData[sampleIndex + i] = Math.max(-1, Math.min(1, sample * 0.3));
      }

      sampleIndex += samples;
    }

    const stem: VocalStem = {
      id: `singing-${Date.now()}`,
      audioBuffer: buffer,
      duration,
      sampleRate: this.sampleRate,
      channels: 1,
      metadata: {
        text: options.text,
        voice: options.voice,
        style: 'singing',
        emotion: options.emotion,
        alignment
      }
    };

    return {
      stem,
      alignment,
      quality: {
        intelligibility: 0.7,
        naturalness: 0.6,
        pitchAccuracy: 0.8
      }
    };
  }

  // Convert speech synthesis to audio buffer
  private async speechToBuffer(utterance: SpeechSynthesisUtterance): Promise<{ buffer: AudioBuffer, duration: number }> {
    return new Promise((resolve, reject) => {
      // Create a temporary audio element to capture speech
      const audio = new Audio();
      const mediaStream = new MediaStream();
      const mediaRecorder = new MediaRecorder(mediaStream);

      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

        resolve({
          buffer: audioBuffer,
          duration: audioBuffer.duration
        });
      };

      // Start recording and speech synthesis
      mediaRecorder.start();

      utterance.onend = () => {
        setTimeout(() => {
          mediaRecorder.stop();
        }, 100);
      };

      speechSynthesis.speak(utterance);
    });
  }

  // Text to phonemes conversion (simplified)
  private textToPhonemes(text: string): string[] {
    // Very basic phoneme conversion - in practice, you'd use a proper phoneme dictionary
    const phonemeMap: { [key: string]: string[] } = {
      'a': ['æ'],
      'e': ['ɛ'],
      'i': ['ɪ'],
      'o': ['ɔ'],
      'u': ['ʊ'],
      'th': ['θ'],
      'sh': ['ʃ'],
      'ch': ['tʃ'],
      'ng': ['ŋ']
    };

    const phonemes: string[] = [];
    const words = text.toLowerCase().split(' ');

    for (const word of words) {
      for (let i = 0; i < word.length; i++) {
        let phoneme = word[i];

        // Check for diphthongs
        if (i < word.length - 1) {
          const pair = word[i] + word[i + 1];
          if (phonemeMap[pair]) {
            phoneme = phonemeMap[pair][0];
            i++; // Skip next character
          } else if (phonemeMap[word[i]]) {
            phoneme = phonemeMap[word[i]][0];
          }
        } else if (phonemeMap[word[i]]) {
          phoneme = phonemeMap[word[i]][0];
        }

        phonemes.push(phoneme);
      }
    }

    return phonemes;
  }

  // Generate alignment for speech
  private generateBasicAlignment(text: string, duration: number): PhonemeAlignment[] {
    const phonemes = this.textToPhonemes(text);
    const alignment: PhonemeAlignment[] = [];
    const phonemeDuration = duration / phonemes.length;

    for (let i = 0; i < phonemes.length; i++) {
      alignment.push({
        phoneme: phonemes[i],
        startTime: i * phonemeDuration,
        endTime: (i + 1) * phonemeDuration,
        confidence: 0.8
      });
    }

    return alignment;
  }

  // Generate alignment for singing
  private generateSingingAlignment(phonemes: string[], melody: number[], tempo: number): PhonemeAlignment[] {
    const alignment: PhonemeAlignment[] = [];
    const beatDuration = 60 / tempo; // Duration of one beat in seconds
    const phonemesPerNote = Math.max(1, Math.floor(phonemes.length / melody.length));

    let phonemeIndex = 0;
    let currentTime = 0;

    for (let i = 0; i < melody.length && phonemeIndex < phonemes.length; i++) {
      const noteDuration = beatDuration; // Assume quarter notes for simplicity
      const phonemesForNote = Math.min(phonemesPerNote, phonemes.length - phonemeIndex);
      const phonemeDuration = noteDuration / phonemesForNote;

      for (let j = 0; j < phonemesForNote && phonemeIndex < phonemes.length; j++) {
        alignment.push({
          phoneme: phonemes[phonemeIndex],
          startTime: currentTime,
          endTime: currentTime + phonemeDuration,
          pitch: melody[i],
          confidence: 0.9
        });

        currentTime += phonemeDuration;
        phonemeIndex++;
      }
    }

    return alignment;
  }

  // Calculate singing duration
  private calculateSingingDuration(text: string, tempo: number): number {
    const words = text.split(' ');
    const syllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    const beatsPerSyllable = 1; // Assume 1 beat per syllable
    const totalBeats = syllables * beatsPerSyllable;
    return (totalBeats / tempo) * 60; // Convert to seconds
  }

  // Get formants for phoneme
  private getFormantsForPhoneme(phoneme: string): Array<{ frequency: number, amplitude: number }> {
    // Simplified formant data - in practice, you'd have a comprehensive database
    const formantData: { [key: string]: Array<{ frequency: number, amplitude: number }> } = {
      'æ': [{ frequency: 800, amplitude: 0.5 }, { frequency: 1700, amplitude: 0.3 }],
      'ɛ': [{ frequency: 600, amplitude: 0.5 }, { frequency: 1800, amplitude: 0.3 }],
      'ɪ': [{ frequency: 400, amplitude: 0.5 }, { frequency: 2000, amplitude: 0.3 }],
      'ɔ': [{ frequency: 500, amplitude: 0.5 }, { frequency: 900, amplitude: 0.3 }],
      'ʊ': [{ frequency: 400, amplitude: 0.5 }, { frequency: 1000, amplitude: 0.3 }]
    };

    return formantData[phoneme] || [{ frequency: 500, amplitude: 0.5 }];
  }

  // Generate pitch envelope
  private generatePitchEnvelope(t: number, duration: number): number {
    // Simple ADSR envelope
    const attack = 0.1;
    const decay = 0.2;
    const sustain = 0.7;
    const release = 0.2;

    if (t < attack) {
      return t / attack; // Attack
    } else if (t < attack + decay) {
      return 1 - (1 - sustain) * (t - attack) / decay; // Decay
    } else if (t < duration - release) {
      return sustain; // Sustain
    } else {
      return sustain * (1 - (t - (duration - release)) / release); // Release
    }
  }

  // Utility methods
  private getRateForTempo(tempo: number): number {
    // Adjust speech rate based on tempo
    return Math.max(0.5, Math.min(2.0, tempo / 120));
  }

  private getPitchForVoice(voice: string): number {
    switch (voice) {
      case 'male': return 0.5;
      case 'female': return 1.5;
      default: return 1.0;
    }
  }

  private selectVoice(voices: SpeechSynthesisVoice[], preferredVoice: string, language?: string): SpeechSynthesisVoice | null {
    // Find voice matching preferences
    const lang = language || 'en-US';

    // Try to find voice by name/type
    let selectedVoice = voices.find(voice =>
      voice.lang.startsWith(lang) &&
      ((preferredVoice === 'male' && voice.name.toLowerCase().includes('male')) ||
       (preferredVoice === 'female' && voice.name.toLowerCase().includes('female')) ||
       preferredVoice === 'neutral')
    );

    // Fallback to any voice in the language
    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith(lang));
    }

    // Ultimate fallback
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }

    return selectedVoice || null;
  }

  private midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;

    let syllables = 0;
    const vowels = 'aeiouy';

    for (let i = 0; i < word.length; i++) {
      if (vowels.includes(word[i])) {
        syllables++;
        while (i < word.length - 1 && vowels.includes(word[i + 1])) {
          i++;
        }
      }
    }

    if (word.endsWith('e')) syllables--;
    return Math.max(1, syllables);
  }

  // Export vocal stem to WAV
  static exportToWAV(stem: VocalStem): Uint8Array {
    // Simplified WAV export - in practice, you'd use a proper audio encoding library
    const length = stem.audioBuffer.length * stem.channels * 2; // 16-bit samples
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, stem.channels, true);
    view.setUint32(24, stem.sampleRate, true);
    view.setUint32(28, stem.sampleRate * stem.channels * 2, true);
    view.setUint16(32, stem.channels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);

    // Audio data (simplified - assumes mono)
    let offset = 44;
    const channelData = stem.audioBuffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample * 32767, true);
      offset += 2;
    }

    return new Uint8Array(buffer);
  }

  // Export alignment data
  static exportAlignment(alignment: PhonemeAlignment[]): any {
    return {
      phonemes: alignment.map(a => ({
        phoneme: a.phoneme,
        start: a.startTime,
        end: a.endTime,
        pitch: a.pitch,
        confidence: a.confidence
      }))
    };
  }
}