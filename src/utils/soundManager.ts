// Sound Manager for game audio effects
class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    this.initializeAudio();
  }

  private initializeAudio() {
    try {
      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  // Create oscillator-based sound effects
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = this.volume): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || !this.enabled) {
        resolve();
        return;
      }

      this.resumeAudioContext().then(() => {
        const oscillator = this.audioContext!.createOscillator();
        const gainNode = this.audioContext!.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext!.destination);

        oscillator.frequency.setValueAtTime(frequency, this.audioContext!.currentTime);
        oscillator.type = type;

        // Create envelope for smoother sound
        gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext!.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext!.currentTime + duration);

        oscillator.start(this.audioContext!.currentTime);
        oscillator.stop(this.audioContext!.currentTime + duration);

        setTimeout(() => resolve(), duration * 1000);
      });
    });
  }

  // Button click sound
  async playButtonClick() {
    await this.createTone(800, 0.1, 'square', this.volume * 0.8);
  }

  // Success sound (e.g., joining game, setting number)
  async playSuccess() {
    await this.createTone(523, 0.15); // C5
    await this.createTone(659, 0.15); // E5
    await this.createTone(784, 0.2);  // G5
  }

  // Error sound
  async playError() {
    await this.createTone(300, 0.1, 'sawtooth');
    await this.createTone(250, 0.1, 'sawtooth');
    await this.createTone(200, 0.15, 'sawtooth');
  }

  // Notification sound (opponent joined, turn change)
  async playNotification() {
    await this.createTone(660, 0.1);
    await this.createTone(880, 0.15);
  }

  // Warning sound for must-guess-right pressure states
  async playWarning() {
    await this.createTone(932, 0.1, 'square', this.volume * 0.85);
    await this.createTone(932, 0.1, 'square', this.volume * 0.85);
    await this.createTone(740, 0.24, 'sawtooth', this.volume * 0.95);
  }

  // Draw sound
  async playDraw() {
    await this.createTone(523, 0.12, 'triangle', this.volume * 0.7);
    await this.createTone(659, 0.12, 'triangle', this.volume * 0.7);
    await this.createTone(587, 0.18, 'triangle', this.volume * 0.7);
  }

  // Guess feedback sounds
  async playCorrectPosition() {
    await this.createTone(523, 0.1); // C5 - bright, positive
  }

  async playCorrectDigit() {
    await this.createTone(440, 0.1); // A4 - medium positive
  }

  async playNoMatch() {
    await this.createTone(330, 0.08, 'triangle', this.volume * 0.6); // E4 - subtle negative
  }

  // Game state sounds
  async playGameStart() {
    const notes = [262, 330, 392, 523]; // C-E-G-C chord
    for (const note of notes) {
      this.createTone(note, 0.2, 'sine', this.volume * 0.7);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  async playGameWin() {
    const melody = [523, 659, 784, 1047]; // Victory fanfare
    for (const note of melody) {
      this.createTone(note, 0.3, 'sine', this.volume * 0.9);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async playGameLose() {
    const notes = [440, 370, 330, 262]; // Descending sad melody
    for (const note of notes) {
      this.createTone(note, 0.4, 'sine', this.volume * 0.7);
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  // Typing/input sounds
  async playKeypress() {
    await this.createTone(600 + Math.random() * 200, 0.05, 'square', this.volume * 0.4);
  }

  // Connection sounds
  async playConnect() {
    await this.createTone(880, 0.1);
    await this.createTone(1174, 0.15); // Ascending connection sound
  }

  async playDisconnect() {
    await this.createTone(880, 0.1);
    await this.createTone(660, 0.15); // Descending disconnection sound
  }

  // Control methods
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) {
      this.initializeAudio();
    }
  }

  getEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }
}

export const soundManager = new SoundManager();
