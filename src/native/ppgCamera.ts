import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/**
 * The PPG capture plugin is a local, app-only Swift class (no separate npm
 * package) — see ios/App/App/Plugins/. Android has no implementation yet
 * (deliberately deferred), so this is iOS-only for now.
 */
export const isPpgCameraSupported = Capacitor.getPlatform() === 'ios';

export type CameraPermissionState = 'granted' | 'denied' | 'prompt';

export interface PpgSample {
  /** Mean red-channel intensity over a centered window, 0–255. */
  redMean: number;
  /** Milliseconds since the capture session started (from the sensor's own presentation timestamp). */
  timestampMs: number;
}

export interface PpgSampleBatch {
  samples: PpgSample[];
}

export interface PpgCaptureError {
  code: 'sessionInterrupted' | 'deviceUnavailable' | 'torchUnavailable' | string;
  message: string;
}

export interface PpgCameraPlugin {
  checkPermissions(): Promise<{ camera: CameraPermissionState }>;
  requestPermissions(): Promise<{ camera: 'granted' | 'denied' }>;
  /** False on the simulator or if the required lens/torch isn't present. */
  isAvailable(): Promise<{ available: boolean }>;
  /** Opens the capture session and turns the torch on. Rejects if either fails. */
  startCapture(): Promise<void>;
  /** Idempotent — safe to call even if capture was never started. */
  stopCapture(): Promise<void>;
  addListener(eventName: 'ppgSample', listenerFunc: (batch: PpgSampleBatch) => void): Promise<PluginListenerHandle>;
  addListener(eventName: 'captureError', listenerFunc: (error: PpgCaptureError) => void): Promise<PluginListenerHandle>;
}

export const PpgCamera = registerPlugin<PpgCameraPlugin>('PpgCamera');
