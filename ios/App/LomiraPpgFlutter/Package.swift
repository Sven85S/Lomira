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
// IMPORTANT — this used to be done with per-configuration binaryTargets
// (FlutterEngineDebug/FlutterEngineRelease/…) selected via SwiftPM's
// `.when(configuration:)` dependency condition. That was empirically proven
// unreliable: a device build showed "Configuration Release" in Xcode's own
// build log yet still embedded the 41.4MB Debug Flutter.framework (vs. the
// 9.4MB Release xcframework), crashing on cold launch with the exact
// Debug-JIT-without-debugger error. This matches a documented limitation in
// Xcode's native SPM integration — `.when(configuration:)` is not reliably
// honored for which binaryTarget actually gets embedded (distinct from
// ordinary conditional source dependencies).
//
// The fix: this package now declares only ONE fixed set of binaryTargets,
// always pointing at Frameworks/Active/*.xcframework — no configuration
// branching in Package.swift at all, so there is nothing for SPM to get
// wrong. Instead, a Run Script Build Phase on the App target (added first
// in the target's build phase list — see project.pbxproj) copies
// Frameworks/$CONFIGURATION/ over Frameworks/Active/ before anything else
// builds, so the correct variant is already on disk by the time SPM/the
// linker touch it. This mirrors Flutter's own official CocoaPods
// add-to-app integration, which solves the identical problem with an early
// Run Script phase rather than relying on SwiftPM conditionals.
//
// Expected directory layout (NOT checked into git — see .gitignore in this
// folder; Debug/Release produced locally by `flutter build ios-framework
// --output=Frameworks --no-profile`, run from flutter/lomira_ppg_bridge/,
// then copied here; Active/ is populated automatically by the Run Script
// Build Phase on every Xcode build, not by hand):
//   Frameworks/Debug/{Flutter,App,FlutterPluginRegistrant,camera_avfoundation}.xcframework
//   Frameworks/Release/{Flutter,App,FlutterPluginRegistrant,camera_avfoundation}.xcframework
//   Frameworks/Active/{Flutter,App,FlutterPluginRegistrant,camera_avfoundation}.xcframework  (generated)
//
// Do NOT try to gate CameraAvfoundation's own underlying plugin
// dependencies here — flutter_ppg has no native iOS code (pure Dart), so
// camera_avfoundation.xcframework is the only plugin xcframework besides
// the three already listed.
let package = Package(
    name: "LomiraPpgFlutter",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "LomiraPpgFlutter", targets: ["LomiraPpgFlutter"]),
    ],
    targets: [
        .binaryTarget(name: "FlutterEngine", path: "Frameworks/Active/Flutter.xcframework"),
        .binaryTarget(name: "FlutterApp", path: "Frameworks/Active/App.xcframework"),
        .binaryTarget(name: "FlutterPluginRegistrant", path: "Frameworks/Active/FlutterPluginRegistrant.xcframework"),
        .binaryTarget(name: "CameraAvfoundation", path: "Frameworks/Active/camera_avfoundation.xcframework"),

        // Pure marker target — carries no code of its own, only the
        // dependency edges onto the binary targets above. Consuming Swift
        // code keeps importing `Flutter` / `FlutterPluginRegistrant`
        // directly (those module names come from the xcframeworks
        // themselves), not `LomiraPpgFlutter`.
        .target(
            name: "LomiraPpgFlutter",
            dependencies: [
                "FlutterEngine",
                "FlutterApp",
                "FlutterPluginRegistrant",
                "CameraAvfoundation",
            ],
            path: "Sources/LomiraPpgFlutter"
        ),
    ]
)
