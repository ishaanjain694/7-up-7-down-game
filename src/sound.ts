/**
 * Web Audio API procedural sound synthesizer for 7 Up 7 Down.
 * Zero external audio dependencies - 100% reliable and consistent across
 * modern desktop and mobile browsers (Chrome, Safari/WebKit, iOS, Firefox, Edge).
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private dynamicsCompressor: DynamicsCompressorNode | null = null;
  private muted: boolean = false;
  private unlocked: boolean = false;

  constructor() {
    // Read saved mute preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('7up7down_muted');
      this.muted = saved === 'true';
      this.setupGlobalUnlock();
    }
  }

  /**
   * Cross-browser AudioContext unlocking.
   * Browsers (especially iOS Safari, Android Chrome, and Safari Desktop) require
   * a user gesture to resume AudioContext. We attach one-time gesture listeners
   * to wake up the audio context immediately.
   */
  private setupGlobalUnlock() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.initCtx();
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        // Play silent 1-sample buffer to satisfy iOS audio session unlock
        if (!this.unlocked) {
          try {
            const buffer = this.ctx.createBuffer(1, 1, 22050);
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.ctx.destination);
            source.start(0);
            this.unlocked = true;
          } catch {
            // Ignore if already playing
          }
        }
      }
      // Remove listeners once unlocked
      ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach((evt) => {
        window.removeEventListener(evt, unlockHandler);
      });
    };

    ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, unlockHandler, { once: true, passive: true });
    });
  }

  private initCtx(): boolean {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          return false;
        }
      }
    }

    if (!this.ctx) return false;

    // Initialize compressor and master gain once to prevent clipping across device speakers
    if (!this.masterGain && this.ctx) {
      try {
        this.dynamicsCompressor = this.ctx.createDynamicsCompressor();
        this.dynamicsCompressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.dynamicsCompressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.dynamicsCompressor.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.dynamicsCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.dynamicsCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        this.dynamicsCompressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      } catch {
        // Fallback
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return true;
  }

  private getDestination(): AudioNode | null {
    if (!this.initCtx() || !this.ctx) return null;
    return this.dynamicsCompressor || this.ctx.destination;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('7up7down_muted', String(this.muted));
    return this.muted;
  }

  /**
   * 1. JOIN ROOM SOUND
   * Crisp, luxurious 3-note ascending casino table entrance chime
   * (E5 -> A5 -> C#6 with shimmering metallic decay).
   */
  public playJoinRoom() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const now = this.ctx.currentTime;
    const notes = [
      { freq: 659.25, time: 0.0, dur: 0.45, vol: 0.18 },  // E5
      { freq: 880.0, time: 0.1, dur: 0.5, vol: 0.22 },   // A5
      { freq: 1108.73, time: 0.22, dur: 0.7, vol: 0.26 }, // C#6
    ];

    notes.forEach(({ freq, time, dur, vol }) => {
      if (!this.ctx) return;
      const startTime = now + time;

      // Primary chime tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      // Sparkle overtone
      const overtone = this.ctx.createOscillator();
      const overtoneGain = this.ctx.createGain();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(freq * 2, startTime);

      // Envelope
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(vol, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      overtoneGain.gain.setValueAtTime(0.0001, startTime);
      overtoneGain.gain.exponentialRampToValueAtTime(vol * 0.35, startTime + 0.015);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur * 0.7);

      osc.connect(gain);
      overtone.connect(overtoneGain);
      gain.connect(dest);
      overtoneGain.connect(dest);

      osc.start(startTime);
      overtone.start(startTime);
      osc.stop(startTime + dur);
      overtone.stop(startTime + dur);
    });
  }

  /**
   * FRIEND JOINED TABLE SOUND
   * Cheerful two-tone ping when another friend sits at the table.
   */
  public playFriendJoined() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const now = this.ctx.currentTime;
    const tones = [
      { freq: 783.99, time: 0.0, dur: 0.2 },  // G5
      { freq: 1174.66, time: 0.08, dur: 0.35 }, // D6
    ];

    tones.forEach(({ freq, time, dur }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + time;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  /**
   * 2. WINNING SOUND
   * Triumphant, ascending major fanfare with rich harmonics and coin chimes.
   */
  public playWin() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const now = this.ctx.currentTime;
    // Ascending arpeggio: C5 -> E5 -> G5 -> C6 -> E6
    const notes = [
      { f: 523.25, t: 0.0, d: 0.25, v: 0.22 },
      { f: 659.25, t: 0.08, d: 0.25, v: 0.24 },
      { f: 783.99, t: 0.16, d: 0.3, v: 0.26 },
      { f: 1046.5, t: 0.26, d: 0.45, v: 0.3 },
      { f: 1318.51, t: 0.36, d: 0.65, v: 0.28 },
    ];

    notes.forEach(({ f, t, d, v }) => {
      if (!this.ctx) return;
      const startTime = now + t;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, startTime);

      // Bell overtone
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(f * 2, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(v, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + d);

      bellGain.gain.setValueAtTime(0.0001, startTime);
      bellGain.gain.exponentialRampToValueAtTime(v * 0.3, startTime + 0.015);
      bellGain.gain.exponentialRampToValueAtTime(0.0001, startTime + d * 0.8);

      osc.connect(gain);
      bell.connect(bellGain);
      gain.connect(dest);
      bellGain.connect(dest);

      osc.start(startTime);
      bell.start(startTime);
      osc.stop(startTime + d);
      bell.stop(startTime + d);
    });

    // Followed by celebratory coin sparkle
    setTimeout(() => {
      this.playCoin();
    }, 280);
  }

  /**
   * 3. LOSING SOUND
   * Distinct, comical yet casino-style descending minor tone slide
   * (F4 -> Eb4 -> D4 -> Bb3 slide with mellow lowpass filter).
   */
  public playLose() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const now = this.ctx.currentTime;
    // 3 distinct descending steps with slight downward pitch bends
    const steps = [
      { startFreq: 349.23, endFreq: 329.63, time: 0.0, dur: 0.22, vol: 0.22 }, // F4 -> E4
      { startFreq: 311.13, endFreq: 293.66, time: 0.2, dur: 0.24, vol: 0.24 }, // Eb4 -> D4
      { startFreq: 261.63, endFreq: 220.0, time: 0.42, dur: 0.45, vol: 0.26 }, // C4 -> A3 slide
    ];

    steps.forEach(({ startFreq, endFreq, time, dur, vol }) => {
      if (!this.ctx) return;
      const startTime = now + time;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(startFreq, startTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + dur);

      // Lowpass filter creates warm, cartoonish "womp" character
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, startTime);
      filter.frequency.exponentialRampToValueAtTime(350, startTime + dur);
      filter.Q.value = 4;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(vol, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(startTime);
      osc.stop(startTime + dur);
    });
  }

  /**
   * BIG JACKPOT / LUCKY 7 CELEBRATION
   */
  public playJackpot() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.0],
      [659.25, 830.61, 987.77],
      [783.99, 987.77, 1174.66, 1567.98],
    ];

    chords.forEach((chord, i) => {
      const time = this.ctx!.currentTime + i * 0.14;
      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(0.14, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(time);
        osc.stop(time + 0.6);
      });
    });
  }

  /**
   * POKER CHIP CLICK
   */
  public playChip() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400 + Math.random() * 300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  /**
   * REALISTIC DICE RATTLE AND TUMBLE
   */
  public playDiceRoll() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const now = this.ctx.currentTime;
    const bounces = [0.0, 0.12, 0.25, 0.42, 0.65, 0.9, 1.15, 1.45, 1.75, 2.05];

    bounces.forEach((t, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      const baseFreq = 480 + (i % 2 === 0 ? 160 : -80) + Math.random() * 100;
      osc.frequency.setValueAtTime(baseFreq, now + t);
      osc.frequency.exponentialRampToValueAtTime(120, now + t + 0.07);

      filter.type = 'lowpass';
      filter.frequency.value = 1200 - i * 50;

      const vol = Math.max(0.05, 0.3 - (i / bounces.length) * 0.2);
      gain.gain.setValueAtTime(vol, now + t);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.07);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now + t);
      osc.stop(now + t + 0.07);
    });
  }

  /**
   * DICE LANDING IMPACT
   */
  public playDiceImpact() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * COUNTDOWN TIMER TICK
   */
  public playTick() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  /**
   * COIN / CASH COLLECT
   */
  public playCoin() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  /**
   * POP SOUND (UI / EMOJI)
   */
  public playPop() {
    if (this.muted) return;
    const dest = this.getDestination();
    if (!this.ctx || !dest) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(dest);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }
}

export const sound = new SoundEngine();
