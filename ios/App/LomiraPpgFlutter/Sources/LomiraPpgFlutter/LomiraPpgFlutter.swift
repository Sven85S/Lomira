/// Marker — this target has no logic of its own. It only exists to carry
/// Package.swift's configuration-conditional dependencies on the Flutter/
/// App/FlutterPluginRegistrant/camera_avfoundation binary targets. Consuming
/// Swift code should import `Flutter` and `FlutterPluginRegistrant` directly
/// (module names come from the xcframeworks themselves), not this module.
public let lomiraPpgFlutterLinked = true
