export interface PpgConfig {
  /** Physiological RR-interval bounds in ms (300ms/2000ms ≈ 200/30 bpm). */
  minRRMs: number;
  maxRRMs: number;
  /** SNR thresholds in dB for quality classification. */
  minGoodSnrDb: number;
  minFairSnrDb: number;
  /** Raw red-channel intensity range (0–255-ish) a finger fully covering the lens sits in. */
  fingerPresenceMin: number;
  fingerPresenceMax: number;
  /** Frame-rate candidates the detector snaps its raw estimate to. */
  candidateFps: number[];
  /** Timestamp-sample count before frame-rate detection is considered stable. */
  fpsWarmupSamples: number;
  /** Physiological upper bound used to derive the peak-detector's minimum spacing. */
  maxBpm: number;
  /** Minimum number of clean (outlier-filtered) RR intervals required before
   * RMSSD is considered reliable enough to show — HRV is far more sensitive
   * to a handful of bad intervals than a plain BPM average is. */
  minRmssdCleanRRCount: number;
}

export const DEFAULT_PPG_CONFIG: PpgConfig = {
  minRRMs: 300,
  maxRRMs: 2000,
  minGoodSnrDb: 5.0,
  minFairSnrDb: 0.0,
  fingerPresenceMin: 30,
  fingerPresenceMax: 250,
  candidateFps: [24, 25, 30, 60],
  fpsWarmupSamples: 30,
  maxBpm: 200,
  minRmssdCleanRRCount: 20,
};

export type SignalQuality = 'good' | 'fair' | 'poor';

export interface PpgResult {
  bpm: number | null;
  quality: SignalQuality;
  snrDb: number | null;
  isFingerDetected: boolean;
  isFpsStable: boolean;
  fps: number | null;
}
