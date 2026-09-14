# SPM-Integration des lomira_ppg_bridge-Moduls

Ersetzt die manuelle "Add Files"-Einbindung aus dem Spike durch ein lokales
Swift-Package (`ios/App/LomiraPpgFlutter/`), das App-Debug-Builds automatisch
die Debug-Flutter-Frameworks und App-Release-Builds die Release-Frameworks
linkt — via SwiftPMs `.when(configuration:)`, siehe Kommentar in
`ios/App/LomiraPpgFlutter/Package.swift`.

## 1. Beide Modi bauen

```bash
cd flutter/lomira_ppg_bridge
flutter build ios-framework --output=build/ios-frameworks --no-profile
```

(Kein `--no-release` mehr wie im Spike — diesmal wird Release tatsächlich
gebraucht. `--no-profile` bleibt, weil das Projekt keine dritte
Xcode-Konfiguration für Profile hat, siehe Package.swift-Kommentar.)

## 2. Frameworks an die vom Package erwartete Stelle kopieren

```bash
mkdir -p ../../ios/App/LomiraPpgFlutter/Frameworks
cp -R build/ios-frameworks/Debug ../../ios/App/LomiraPpgFlutter/Frameworks/Debug
cp -R build/ios-frameworks/Release ../../ios/App/LomiraPpgFlutter/Frameworks/Release
```

Beide Ordner sind über `.gitignore` im Package ausgeschlossen (Build-Artefakte,
nicht Quellcode) — dieser Schritt muss nach jedem `flutter build
ios-framework`-Lauf wiederholt werden, nicht nur einmalig.

## 3. Manuelle Spike-Einbindung aus Xcode entfernen

Falls noch vorhanden: Target **App** → *General* → *Frameworks, Libraries and
Embedded Content* → die im Spike per Drag&Drop hinzugefügten
`Flutter.xcframework`, `App.xcframework`, `FlutterPluginRegistrant.xcframework`,
`camera_avfoundation.xcframework` entfernen. Sonst werden dieselben Symbole
doppelt gelinkt (einmal roh, einmal über das neue Package).

## 4. Lokales Package hinzufügen

Xcode: **File → Add Package Dependencies… → Add Local…** → Ordner
`ios/App/LomiraPpgFlutter` auswählen. Danach im Target **App** →
*Frameworks, Libraries and Embedded Content* das Produkt `LomiraPpgFlutter`
hinzufügen (falls nicht automatisch geschehen).

Anders als bei der manuellen Spike-Einbindung gibt es hier **keine**
Embed & Sign / Do Not Embed-Entscheidung mehr von Hand zu treffen — SwiftPM
liest den `LibraryType` (Dynamic/Static) aus jedem xcframework selbst und
embedded automatisch nur die dynamischen (Flutter, App, camera_avfoundation),
nicht die statische FlutterPluginRegistrant. Das ist genau die im Spike
manuell gesetzte Konfiguration, nur diesmal strukturell erzwungen statt von
Hand gepflegt.

## 5. Der eine Punkt, der noch nicht verifiziert ist

Die Debug/Release-Weiche (`.when(configuration:)`) ist SwiftPMs dafür
vorgesehener, dokumentierter Mechanismus — aber ungetestet, weil diese
Sandbox kein Xcode hat.

**Verschoben auf Schritt 4 (End-to-End-Test):** Ein Release-Build lässt sich
aktuell nicht sinnvoll prüfen — der RevenueCat-Test-Key-Schutz schließt jeden
Release-Build sofort (bekanntes, ohnehin für später vorgesehenes Thema), und
bis Schritt 3 landet, gibt es im Release-Build noch keinen Code-Pfad, der die
Flutter-Engine überhaupt anfasst (der `#if DEBUG`-Spike-Button existiert dort
nicht, `PpgCameraCapture.swift` nutzt noch AVFoundation direkt). Der Test ist
erst aussagekräftig, sobald der reguläre HRV-Tab tatsächlich über die
Flutter-Bridge läuft — siehe Schritt 4:

1. **Debug-Build** wie gehabt auf dem Gerät laufen lassen — sollte weiter
   funktionieren wie zuvor.
2. **Release-Build** (nach Schritt 3, über den echten HRV-Tab, RevenueCat-
   Test-Key-Problem vorher lösen): App normal starten, in Xcode
   **Debug → Detach** (Debugger trennen), App direkt über das Icon auf dem
   Gerät neu öffnen (nicht über Xcodes Play-Button) — das ist der reale
   "kein Debugger angehängt"-Fall, der bei fälschlich eingebetteten
   Debug-Frameworks abstürzt.
   - **Kein Absturz** → Release-Frameworks korrekt eingebettet, Weiche
     funktioniert wie geplant.
   - **Absturz** (z. B. "Library not loaded"/Debug-Engine-bezogen) → die
     `.when(configuration:)`-Bedingung hat nicht gegriffen; genauen
     Fehlertext mitteilen.
