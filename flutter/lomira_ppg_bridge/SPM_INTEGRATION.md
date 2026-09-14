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
Sandbox kein Xcode hat. Bitte vor Schritt 2 (Preview-Integration) kurz
verifizieren:

1. **Debug-Build** wie gehabt auf dem Gerät laufen lassen (Scheme-Konfiguration
   Debug) — Spike-Button sollte weiter funktionieren wie zuvor.
2. **Release-Build**: Scheme bearbeiten → Run → Build Configuration →
   *Release* → auf dem Gerät starten, dann in Xcode **Debug → Detach**
   (Debugger trennen) und die App direkt über das Icon auf dem Gerät neu
   öffnen (nicht über Xcodes Play-Button) — das ist der reale "kein Debugger
   angehängt"-Fall, der laut Flutter-Doku bei fälschlich eingebetteten
   Debug-Frameworks abstürzt.
   - **Kein Absturz** → Release-Frameworks sind korrekt eingebettet, die
     Weiche funktioniert wie geplant.
   - **Absturz** (z. B. "Library not loaded"/Debug-Engine-bezogen) → die
     `.when(configuration:)`-Bedingung hat nicht gegriffen; dann bitte den
     genauen Fehlertext mitteilen, bevor mit Schritt 2 weitergemacht wird.

Erst nach dieser Bestätigung geht es mit Schritt 2 (Preview-Integration)
weiter.
