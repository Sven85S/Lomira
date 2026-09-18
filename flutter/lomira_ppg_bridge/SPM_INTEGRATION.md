# SPM-Integration des lomira_ppg_bridge-Moduls

Ersetzt die manuelle "Add Files"-Einbindung aus dem Spike durch ein lokales
Swift-Package (`ios/App/LomiraPpgFlutter/`), das App-Debug-Builds automatisch
die Debug-Flutter-Frameworks und App-Release-Builds die Release-Frameworks
linkt.

**Wichtig:** Die Debug/Release-Auswahl läuft NICHT über SwiftPMs
`.when(configuration:)` auf den binaryTargets — das war der ursprüngliche
Ansatz, wurde aber empirisch als unzuverlässig entlarvt (ein Gerätebuild mit
Xcodes eigenem Build-Log "Configuration Release" hatte trotzdem das
41,4-MB-Debug-`Flutter.framework` eingebettet statt des 9,4-MB-Release-
xcframeworks und stürzte entsprechend beim Kaltstart ab — ein bekanntes,
dokumentiertes Limit von Xcodes nativer SPM-Integration für binaryTarget-
Auswahl). Stattdessen zeigt `Package.swift` immer auf einen festen Pfad
(`Frameworks/Active/…xcframework`), und eine Run-Script-Build-Phase namens
„Select Active Flutter Frameworks" auf Target **App** — die erste Phase im
Build, noch vor Sources/Frameworks/Resources — kopiert bei jedem Build
`Frameworks/$CONFIGURATION/` nach `Frameworks/Active/`. Siehe Kommentar in
`ios/App/LomiraPpgFlutter/Package.swift` für Details.

Die Kopierlogik nutzt `ditto`, nicht `cp -R`: `cp -R` verursachte auf dem
Gerät xattr-Fehler beim Kopieren der `.xcframework`-Bundles (Ressourcen-
Forks/Metadaten, die xcframeworks/.framework-Bundles enthalten). `ditto` ist
das von Apple für Bundle-Kopien empfohlene Werkzeug, kopiert dabei
standardmäßig vollständig rekursiv und erhält alle Metadaten korrekt.

**Bekannter Flutter-Tooling-Bug (NativeAssetsManifest.json):** Mit Flutter
3.47.4 erzeugt `flutter build ios-framework` `App.framework` ohne die Datei
`NativeAssetsManifest.json`, obwohl Xcode sie beim Einbetten erwartet
(„The file … couldn't be opened because there is no such file"). Bestätigt:
Die Datei fehlt bereits in `Frameworks/Release/App.xcframework/ios-arm64/
App.framework/` direkt nach dem `flutter build`-Lauf — das Problem liegt in
Flutters Tooling, nicht in unserer Kopierlogik. Passt zu
[flutter/flutter#181507](https://github.com/flutter/flutter/pull/181507)
("[native_assets] Fix `flutter build ios-framework`"), das genau diesen
Bereich umgebaut hat. Da dieses Projekt keine nativen Dart-/FFI-Pakete nutzt,
ist ein leeres JSON-Objekt inhaltlich korrekt — die Run-Script-Phase legt es
für jeden fehlenden Fall automatisch an (alle xcframework-Slices, nicht nur
`ios-arm64`). Sollte ein künftiges Flutter-Update das Problem beheben, ist
der Workaround ein No-op (Datei existiert dann bereits) und kann bei
Gelegenheit entfernt werden.

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

Ein dritter Ordner `Frameworks/Active/` wird NICHT von Hand angelegt — die
Run-Script-Build-Phase „Select Active Flutter Frameworks" erzeugt/überschreibt
ihn bei jedem Xcode-Build automatisch aus `Frameworks/$CONFIGURATION/`.

## 3. Manuelle Spike-Einbindung aus Xcode entfernen

Falls noch vorhanden: Target **App** → *General* → *Frameworks, Libraries and
Embedded Content* → die im Spike per Drag&Drop hinzugefügten
`Flutter.xcframework`, `App.xcframework`, `FlutterPluginRegistrant.xcframework`,
`camera_avfoundation.xcframework` entfernen. Sonst werden dieselben Symbole
doppelt gelinkt (einmal roh, einmal über das neue Package).

## 4. Lokales Package hinzufügen

**Bereits erledigt und committet** — `LomiraPpgFlutter` ist als lokale Package-
Referenz + Produkt-Abhängigkeit direkt in `App.xcodeproj/project.pbxproj`
verankert (Target **App** → *Frameworks, Libraries and Embedded Content*),
kein manueller **File → Add Package Dependencies…**-Schritt mehr nötig. Das
war zuvor die eigentliche Lücke: Diese Verknüpfung wurde ursprünglich nur
lokal in Xcode gesetzt und nie ins Repo committet — jeder Gerätebuild lief
also gegen einen Projektzustand, den git nie kannte. Falls du diesen Schritt
selbst schon einmal manuell in Xcode ausgeführt hattest, prüfe kurz, dass
`LomiraPpgFlutter` dort nicht doppelt auftaucht.

Anders als bei der manuellen Spike-Einbindung gibt es hier **keine**
Embed & Sign / Do Not Embed-Entscheidung mehr von Hand zu treffen — SwiftPM
liest den `LibraryType` (Dynamic/Static) aus jedem xcframework selbst und
embedded automatisch nur die dynamischen (Flutter, App, camera_avfoundation),
nicht die statische FlutterPluginRegistrant. Das ist genau die im Spike
manuell gesetzte Konfiguration, nur diesmal strukturell erzwungen statt von
Hand gepflegt.

## 5. Verifikation der Debug/Release-Weiche

Die neue Weiche (Run-Script-Build-Phase kopiert `Frameworks/$CONFIGURATION/`
nach `Frameworks/Active/`) lässt sich vorab am Build-Log prüfen, bevor
überhaupt ein Gerätetest nötig ist:

1. In Xcode einen Release-Build anstoßen (Scheme mit `buildConfiguration =
   Release`, siehe `App.xcscheme`), dann **Report Navigator** → den Build
   öffnen → die Phase „Select Active Flutter Frameworks" aufklappen. Der
   geloggte `CONFIGURATION`-Wert (durch `showEnvVarsInLog` sichtbar) muss
   `Release` sein, und das Script darf nicht mit dem `error: … fehlt`-Pfad
   abbrechen.
2. Direkt danach am Mac-Terminal prüfen, welche Variante tatsächlich in
   `Frameworks/Active/` liegt:
   ```bash
   ls -la ios/App/LomiraPpgFlutter/Frameworks/Active/Flutter.xcframework/ios-arm64/Flutter.framework/Flutter
   ```
   Dateigröße sollte der des Release-xcframeworks entsprechen (klein, nicht
   die ~41 MB der Debug-Variante).

**Der eigentliche End-to-End-Test bleibt wie zuvor auf Schritt 4 verschoben**
(RevenueCat-Test-Key-Problem, `#if DEBUG`-Spike-Button existiert nur dort;
erst aussagekräftig, sobald der reguläre HRV-Tab über die Flutter-Bridge
läuft):

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
   - **Absturz** (z. B. "Library not loaded"/Debug-Engine-bezogen o.ä.) →
     Build-Log der Run-Script-Phase (Schritt 1 oben) sowie
     `Frameworks/Active/`-Dateigröße (Schritt 2 oben) prüfen und genauen
     Fehlertext mitteilen.
