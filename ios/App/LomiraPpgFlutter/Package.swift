// swift-tools-version: 5.9
import PackageDescription

// Wraps the embedded lomira_ppg_bridge Flutter module's iOS xcframeworks
// (built via `flutter build ios-framework`, see ../../../flutter/lomira_ppg_bridge/)
// as a local Swift package, so the App target links Debug-mode Flutter
// frameworks in Debug builds and Release-mode frameworks in Release builds —
// unlike the earlier spike's manual "Add Files" step, which always pointed
// at one hardcoded mode regardless of the app's own active configuration.
// That mismatch is exactly what the spike's own finding warned about: a
// Debug-mode (JIT) Flutter engine needs an attached debugger/LLDB Init File
// or it crashes on launch — shipping that inside a Release build would
// crash for every real user, not just in dev testing.
//
// SwiftPM's dependency `.when(configuration:)` condition only distinguishes
// .debug/.release, which matches this project exactly: App.xcodeproj has
// only "Debug" and "Release" build configurations (verified — no "Profile").
// Flutter's third build mode (used for its own performance-profiling
// tooling) has no corresponding Xcode configuration here and is
// intentionally not wired up.
//
// Expected directory layout (NOT checked into git — see .gitignore in this
// folder; produced locally by `flutter build ios-framework --output=Frameworks
// --no-profile`, run from flutter/lomira_ppg_bridge/, then copied here):
//   Frameworks/Debug/{Flutter,App,FlutterPluginRegistrant,camera_avfoundation}.xcframework
//   Frameworks/Release/{Flutter,App,FlutterPluginRegistrant,camera_avfoundation}.xcframework
//
// Do NOT try to `.when(configuration:)`-gate CameraAvfoundation's own
// underlying plugin dependencies here — flutter_ppg has no native iOS code
// (pure Dart), so camera_avfoundation.xcframework is the only plugin
// xcframework besides the four already listed.
let package = Package(
    name: "LomiraPpgFlutter",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "LomiraPpgFlutter", targets: ["LomiraPpgFlutter"]),
    ],
    targets: [
        .binaryTarget(name: "FlutterEngineDebug", path: "Frameworks/Debug/Flutter.xcframework"),
        .binaryTarget(name: "FlutterAppDebug", path: "Frameworks/Debug/App.xcframework"),
        .binaryTarget(name: "FlutterPluginRegistrantDebug", path: "Frameworks/Debug/FlutterPluginRegistrant.xcframework"),
        .binaryTarget(name: "CameraAvfoundationDebug", path: "Frameworks/Debug/camera_avfoundation.xcframework"),

        .binaryTarget(name: "FlutterEngineRelease", path: "Frameworks/Release/Flutter.xcframework"),
        .binaryTarget(name: "FlutterAppRelease", path: "Frameworks/Release/App.xcframework"),
        .binaryTarget(name: "FlutterPluginRegistrantRelease", path: "Frameworks/Release/FlutterPluginRegistrant.xcframework"),
        .binaryTarget(name: "CameraAvfoundationRelease", path: "Frameworks/Release/camera_avfoundation.xcframework"),

        // Pure marker target — carries no code of its own, only the
        // configuration-conditional dependency edges onto the binary
        // targets above. Consuming Swift code keeps importing `Flutter` /
        // `FlutterPluginRegistrant` directly (those module names come from
        // the xcframeworks themselves), not `LomiraPpgFlutter`.
        .target(
            name: "LomiraPpgFlutter",
            dependencies: [
                .target(name: "FlutterEngineDebug", condition: .when(configuration: [.debug])),
                .target(name: "FlutterAppDebug", condition: .when(configuration: [.debug])),
                .target(name: "FlutterPluginRegistrantDebug", condition: .when(configuration: [.debug])),
                .target(name: "CameraAvfoundationDebug", condition: .when(configuration: [.debug])),

                .target(name: "FlutterEngineRelease", condition: .when(configuration: [.release])),
                .target(name: "FlutterAppRelease", condition: .when(configuration: [.release])),
                .target(name: "FlutterPluginRegistrantRelease", condition: .when(configuration: [.release])),
                .target(name: "CameraAvfoundationRelease", condition: .when(configuration: [.release])),
            ],
            path: "Sources/LomiraPpgFlutter"
        ),
    ]
)
