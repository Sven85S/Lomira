# PPG Flutter Spike — Setup & Testablauf

Diese Sandbox hat kein Flutter SDK und kein Xcode — die Schritte hier müssen
auf einem echten Mac mit Xcode und Flutter ausgeführt werden.

## 1. Modul korrekt scaffolden

Die Dateien `pubspec.yaml` und `lib/main.dart` in diesem Ordner sind bereits
fertig geschrieben. Was hier fehlt (generierte Boilerplate, die vom
installierten Flutter-SDK abhängt), muss lokal erzeugt werden:

```bash
cd flutter
flutter create -t module lomira_ppg_bridge_scaffold
# pubspec.yaml und lib/main.dart aus lomira_ppg_bridge/ in den Scaffold kopieren
# (überschreibt die generierten Platzhalter), dann den Scaffold-Ordner in
# lomira_ppg_bridge/ umbenennen bzw. dessen Inhalt dorthin verschieben.
cd lomira_ppg_bridge
flutter pub get
```

## 2. iOS-Frameworks bauen

```bash
flutter build ios-framework --output=build/ios-frameworks --no-profile --no-release
```

Das erzeugt (im Debug-Modus, reicht für den Spike):
- `Flutter.xcframework`
- `App.xcframework`
- `FlutterPluginRegistrant.xcframework`
- `camera_avfoundation.xcframework` (natives iOS-Backend von `camera`)
- ggf. ein xcframework für `flutter_ppg`, falls das Paket eigenen nativen
  iOS-Code mitbringt (unwahrscheinlich, aber prüfen)

## 3. In Xcode einbinden (nur für den Spike — noch kein SPM-Wrapping)

`ios/App/App.xcodeproj` in Xcode öffnen, Target **App** → *General* →
*Frameworks, Libraries and Embedded Content* → alle oben genannten
`.xcframework`-Dateien per Drag&Drop hinzufügen, mit diesen Embed-Settings:

| Framework | Embed |
|---|---|
| `Flutter.xcframework` | Embed & Sign |
| `App.xcframework` | Embed & Sign |
| `FlutterPluginRegistrant.xcframework` | **Do Not Embed** (nur linken) |
| `camera_avfoundation.xcframework` | **Do Not Embed** (nur linken) |

(Das ist genau der in Frage 5 des Plans benannte Punkt — falsch eingebettete
statische Frameworks führen später bei der App-Store-Validierung zu
"Invalid Bundle"-Fehlern; für den Spike selbst reicht ein Debug-Build auf
einem Gerät, das ist noch nicht sicherheitsrelevant, aber der Reihenfolge
halber gleich richtig einstellen.)

Falls Xcode den Namen der generierten Registrant-Klasse anders benennt als
`GeneratedPluginRegistrant` (variiert leicht je nach Flutter-Version), in
`ios/App/App/FlutterSpike/PpgFlutterSpike.swift` den Import/Aufruf
entsprechend anpassen.

## 4. Testablauf auf echtem Gerät

1. App im **Debug**-Build auf ein echtes iPhone deployen (Simulator hat keine
   echte Kamera/Blitz).
2. Der schwarze Button "PPG Flutter Spike" oben links (nur im Debug-Build,
   `#if DEBUG` in `MainViewController.swift`) startet/stoppt den Spike.
3. Finger auf Kamera+Blitz legen, Button antippen → Xcode-Konsole beobachten:
   - `[lomira_ppg_bridge] Blitz aktiviert.`
   - danach alle 30 Samples eine Zeile mit `rawIntensity`
   - `[PpgFlutterSpike] samples=... letzter redMean=...` (native Seite, 1×/s)
4. Button erneut antippen zum Stoppen, kurz warten, direkt erneut starten —
   **mehrmals hintereinander wiederholen** (das ist der eigentliche Test).

## Was ein Erfolg ist

- Blitz bleibt über die gesamte Dauer jedes Laufs durchgehend an (kein
  kurzes Aufflackern/Ausgehen kurz nach dem Start).
- `redMean`-Samples kommen durchgehend mit stabiler Rate, nicht nur die
  ersten paar Sekunden.
- Kein `MissingPluginException` und keine Abstürze in der Konsole.
- Das hält über mehrere Start/Stop-Zyklen hintereinander, ohne App-Neustart.

Wenn das über mehrere Durchläufe zuverlässig hält: weiter mit Schritt 2–4
der ursprünglichen Migrationsreihenfolge (SPM-Packaging, Preview-Integration,
volle Verkabelung in `PpgCameraCapture.swift`). Wenn nicht: das ist die
frühe, günstige Widerlegung, bevor der große Umbau darauf aufgebaut wird.
