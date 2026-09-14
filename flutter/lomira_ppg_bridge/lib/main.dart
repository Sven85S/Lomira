// Flutter add-to-app entrypoint. Never shows app-like UI (no navigation, no
// other screens) — the only visible surface this engine can ever produce is
// a bare CameraPreview, and that's only shown at all once the native host
// attaches a FlutterViewController for it (PpgFlutterSpike.attachPreview(),
// step 2 of the migration). Capture itself (MethodChannel-driven
// start/stop, forwarding raw red-channel samples) stays headless — see
// _CaptureController below, unchanged in spirit from the step-1 spike aside
// from exposing its CameraController to the preview widget.
import 'dart:async';
import 'dart:io' show Platform;

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_ppg/flutter_ppg.dart';

const MethodChannel _channel = MethodChannel('com.lomira/ppgSpike');

// Set by _CaptureController whenever it creates/disposes its CameraController
// — the one and only camera session this module ever opens. The preview
// widget below listens to this instead of owning a second CameraController
// of its own; two independent camera sessions is exactly the
// "videoDeviceInUseByAnotherClient" conflict class the native-Swift
// implementation ran into before this migration.
final ValueNotifier<CameraController?> activeController = ValueNotifier(null);

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  _CaptureController();
  runApp(const _PreviewRoot());
}

/// Same lens-selection logic as ppg_test_app's _selectMainWideBackCamera(),
/// carried over verbatim: iOS's camera plugin enumerates every physical back
/// lens (Ultra Wide/Wide/Tele on multi-lens iPhones) and does NOT guarantee
/// the main 1x wide lens comes first, so this must select it explicitly
/// rather than just taking the first back-facing entry.
CameraDescription _selectMainWideBackCamera(List<CameraDescription> cameras) {
  final backCameras = cameras.where((c) => c.lensDirection == CameraLensDirection.back).toList();
  if (backCameras.isEmpty) return cameras.first;

  for (final c in backCameras) {
    if (c.name == 'Back Camera') return c;
  }
  for (final c in backCameras) {
    final n = c.name.toLowerCase();
    if (n.contains('wide') && !n.contains('ultra') && !n.contains('tele')) {
      return c;
    }
  }
  return backCameras.first;
}

class _CaptureController {
  CameraController? _cameraController;
  StreamController<CameraImage>? _imageStreamController;
  StreamSubscription<PPGSignal>? _ppgSubscription;
  final FlutterPPGService _ppgService = FlutterPPGService();
  int _sampleCount = 0;

  _CaptureController() {
    _channel.setMethodCallHandler(_handleMethodCall);
  }

  Future<dynamic> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'startCapture':
        await _start();
        return null;
      case 'stopCapture':
        await _stop();
        return null;
      default:
        throw MissingPluginException('Unbekannte Methode: ${call.method}');
    }
  }

  Future<void> _start() async {
    debugPrint('[lomira_ppg_bridge] _start() aufgerufen.');
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        _channel.invokeMethod('onCaptureError', {
          'code': 'noCameraFound',
          'message': 'Keine Kamera gefunden.',
        });
        return;
      }
      final backCamera = _selectMainWideBackCamera(cameras);
      debugPrint('[lomira_ppg_bridge] Ausgewählte Kamera: name="${backCamera.name}"');

      // Same iOS/Android format split as ppg_test_app: iOS's camera plugin
      // delivers BGRA8888 (flutter_ppg's documented "iOS default"), Android
      // YUV420 (flutter_ppg's 3-plane Y/U/V assumption).
      final imageFormatGroup = Platform.isIOS ? ImageFormatGroup.bgra8888 : ImageFormatGroup.yuv420;

      final controller = CameraController(
        backCamera,
        ResolutionPreset.low,
        enableAudio: false,
        imageFormatGroup: imageFormatGroup,
      );
      await controller.initialize();
      _cameraController = controller;
      activeController.value = controller;

      try {
        await controller.setFlashMode(FlashMode.torch);
        debugPrint('[lomira_ppg_bridge] Blitz aktiviert.');
      } catch (e) {
        debugPrint('[lomira_ppg_bridge] Blitz konnte nicht aktiviert werden: $e');
      }

      _sampleCount = 0;
      _imageStreamController = StreamController<CameraImage>();
      await controller.startImageStream((image) {
        final sc = _imageStreamController;
        if (sc != null && !sc.isClosed) sc.add(image);
      });

      _ppgSubscription = _ppgService.processImageStream(_imageStreamController!.stream).listen(
        _onSignal,
        onError: (Object e, StackTrace st) {
          debugPrint('[lomira_ppg_bridge] ppgStream onError: $e');
        },
        cancelOnError: false,
      );
      debugPrint('[lomira_ppg_bridge] Capture gestartet.');
    } catch (e) {
      debugPrint('[lomira_ppg_bridge] _start() Fehler: $e');
      _channel.invokeMethod('onCaptureError', {
        'code': 'startFailed',
        'message': '$e',
      });
    }
  }

  // Only PPGSignal.rawIntensity + its timestamp are forwarded — this module
  // must not adopt flutter_ppg's own bpm/quality/RR-interval/SNR
  // computation, since that pipeline already exists, independently
  // validated, in the TypeScript src/ppg/ layer. Two parallel HRV pipelines
  // computing different numbers from the same frames would be worse than
  // either alone.
  void _onSignal(PPGSignal signal) {
    _sampleCount++;
    _channel.invokeMethod('onPpgSample', {
      'redMean': signal.rawIntensity,
      'timestampMs': signal.timestamp.millisecondsSinceEpoch,
    });
    if (_sampleCount % 30 == 0) {
      debugPrint('[lomira_ppg_bridge] $_sampleCount samples weitergeleitet, '
          'letzter rawIntensity=${signal.rawIntensity.toStringAsFixed(1)}');
    }
  }

  // Same defensive, timeout-boxed teardown order as ppg_test_app: cancel the
  // Dart-side stream first (pure Dart, always fast), THEN the two native
  // platform calls (stopImageStream, then setFlashMode(off)) — each
  // independently timed out so a stuck native call can't hang the module.
  Future<void> _stop() async {
    debugPrint('[lomira_ppg_bridge] _stop() aufgerufen. samples=$_sampleCount');
    final sub = _ppgSubscription;
    _ppgSubscription = null;
    if (sub != null) {
      try {
        await sub.cancel().timeout(const Duration(seconds: 3));
      } catch (e) {
        debugPrint('[lomira_ppg_bridge] ppgSubscription.cancel() Timeout/Fehler: $e');
      }
    }
    final sc = _imageStreamController;
    _imageStreamController = null;
    if (sc != null && !sc.isClosed) {
      try {
        await sc.close().timeout(const Duration(seconds: 2));
      } catch (e) {
        debugPrint('[lomira_ppg_bridge] imageStreamController.close() Timeout/Fehler: $e');
      }
    }

    // Cleared before dispose(), not after — the preview widget's
    // ValueListenableBuilder must stop referencing this controller before it
    // becomes invalid, not race it.
    activeController.value = null;
    final controller = _cameraController;
    _cameraController = null;
    if (controller != null && controller.value.isInitialized) {
      if (controller.value.isStreamingImages) {
        try {
          await controller.stopImageStream().timeout(const Duration(seconds: 5));
        } catch (e) {
          debugPrint('[lomira_ppg_bridge] stopImageStream() Timeout/Fehler: $e');
        }
      }
      try {
        await controller.setFlashMode(FlashMode.off).timeout(const Duration(seconds: 5));
      } catch (e) {
        debugPrint('[lomira_ppg_bridge] setFlashMode(off) Timeout/Fehler: $e');
      }
      await controller.dispose();
    }
    debugPrint('[lomira_ppg_bridge] _stop() abgeschlossen.');
  }
}

// The entire visible surface of this Flutter engine. No navigation, no other
// routes, nothing rendered until a capture session exists — deliberately as
// thin as possible since native only ever embeds this to show the bare
// camera feed while the user places their finger, never as an app screen in
// its own right.
class _PreviewRoot extends StatelessWidget {
  const _PreviewRoot();

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: _PreviewScreen(),
    );
  }
}

class _PreviewScreen extends StatelessWidget {
  const _PreviewScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: ValueListenableBuilder<CameraController?>(
        valueListenable: activeController,
        builder: (context, controller, _) {
          if (controller == null || !controller.value.isInitialized) {
            return const SizedBox.shrink();
          }
          return CameraPreview(controller);
        },
      ),
    );
  }
}
