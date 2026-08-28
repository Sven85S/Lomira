# Lomira

Nervensystem-Regulations-App (React + Capacitor, iOS + Android). Portiert aus dem Claude-Design-Entwurf, mit echter lokaler Datenspeicherung und RevenueCat-Anbindung für Trial/Abo.

## Stack

- Vite + React + TypeScript
- Capacitor (iOS + Android)
- `@capacitor/preferences` für lokale Persistenz
- `@revenuecat/purchases-capacitor` für Trial/Abo

## Setup

```bash
npm install
cp .env.example .env.local   # RevenueCat-Keys eintragen, siehe unten
npm run dev                  # Browser-Vorschau (Käufe sind dort deaktiviert, s.u.)
```

Für die iOS-App (braucht macOS + Xcode, hier nicht ausführbar):

```bash
npx cap add ios
npm run build
npx cap sync ios
npx cap open ios
```

Die Android-App ist bereits im Repo unter `android/` gescaffoldet (Kotlin/Gradle-Projekt, `applicationId com.lomira.app`,
compileSdk/targetSdk 36, minSdk 24) — siehe **Android-Testgerät** unten für den kompletten Ablauf.

## Datenmodell / lokale Speicherung

Alles liegt unter `src/context/DataContext.tsx` + `src/store/*Selectors.ts`, persistiert via `@capacitor/preferences`
(auf iOS UserDefaults, im Browser automatisch localStorage — gleicher Code, kein Unterschied nötig).

- **Ritual-Einträge** (`RitualEntry`: Datum, Zustand, Notiz) sind die **einzige** Quelle für:
  - die Serie/Streak (aufeinanderfolgende Tage mit Eintrag),
  - den "Reguliert-Anteil" in Fortschritt (Anteil der Einträge mit Zustand `reguliert`/`entspannt`),
  - die Wochen-Strip- und Kalender-Punkte.
- **Anker/SOS-Atemübungen** erfassen bewusst keinen Zustand mehr — sie zählen nur `ankerSessionCount` hoch
  (eine Zahl in Fortschritt) und fließen nirgends in den Reguliert-Anteil ein.
- **Puls-Einträge** sind vorbereitet (`PulseEntry`, Store + Chart-Berechnung), aber der Entwurf enthält keine
  Eingabe-UI dafür — die Fortschritt-Seite zeigt entsprechend ehrlich "Noch keine Messungen" statt Beispieldaten.
  Eine Eingabemöglichkeit (z. B. direkt nach einer Anker-Übung) ist ein sinnvoller nächster Schritt, sobald das
  Design dafür steht.

Keine der drei alten Beispieldatensätze aus dem Entwurf (History, Pulskurve, Sessionzahl) ist mehr im Code — alles
startet leer und füllt sich ausschließlich durch echte Nutzung.

## RevenueCat

`src/revenuecat/purchases.ts` + `src/context/SubscriptionContext.tsx`.

1. In RevenueCat ein Projekt mit den App-Store-Produkten (jährlich + monatlich, jeweils mit 14-Tage-Trial) anlegen,
   ein Offering mit einem `annual`- und einem `monthly`-Package konfigurieren und ein Entitlement (z. B. `plus`)
   erstellen, das beide Packages freischaltet.
2. `.env.local`: `VITE_REVENUECAT_API_KEY` (Standard-Key, gilt für alle Plattformen) eintragen, optional
   `VITE_REVENUECAT_ENTITLEMENT_ID` (Default `plus`). Für echte Produktions-Keys später gibt es die Overrides
   `VITE_REVENUECAT_IOS_API_KEY` / `VITE_REVENUECAT_ANDROID_API_KEY` — siehe `.env.example`.
3. Lektionen 2–18 und der unbegrenzte Ritual-Verlauf sind hinter dem Entitlement gated (`useSubscription().isSubscribed`).
   Lektion 1 bleibt immer frei zugänglich.

RevenueCats natives SDK läuft nur in der iOS- oder Android-Hülle. Im Browser (`npm run dev`/`preview`) erkennt die App
das automatisch (`Capacitor.getPlatform()`) und zeigt im Paywall einen Hinweis statt einen Kaufversuch, der ohnehin
fehlschlagen würde.

### Test Store vs. echte Store-Keys

Ein RevenueCat **Test Store**-Key (Präfix `test_`, wie der aktuell in `.env.local` hinterlegte) ist plattformunabhängig:
Käufe laufen komplett über RevenueCats eigenen simulierten Store statt über echte StoreKit-/Play-Billing-Dialoge — man
braucht dafür **kein** App Store Connect- oder Play-Console-Produkt, keine Lizenz-Tester, keine Signierung über einen
Store. Genau deshalb funktioniert derselbe Key unverändert auf iOS und Android. Für einen echten Produktions-Release
später: in RevenueCat pro Store (App Store, Play Store) eigene Produkte + einen `appl_...`/`goog_...`-Key anlegen und
über die Overrides oben eintragen.

## Android-Testgerät

Ziel: Paywall mit echten (Test-Store-)Preisen antippen → Kauf über den Test-Store-Dialog durchführen → Lektion danach
entsperrt sehen.

Das Android-Projekt liegt bereits fertig unter `android/` (per `npx cap add android` erzeugt, `@revenuecat/purchases-capacitor`
und `@capacitor/preferences` sind als native Plugins registriert). Was hier im Sandbox-Container **nicht** geht: ein
echtes Gerät ist nicht angeschlossen, und der Zugriff auf `dl.google.com` (Googles Maven-Repo, nötig für das Android
Gradle Plugin) ist von hier aus blockiert — der native Build muss deshalb auf deinem eigenen Rechner laufen.

**1. Einmalig installieren**

- [Android Studio](https://developer.android.com/studio) (bündelt Android SDK, Platform Tools/`adb`, Build Tools —
  einfachster Weg). Beim ersten Start den SDK-Installationsdialog durchlaufen lassen.
- Alternativ ohne volle IDE: nur die [Command-line tools](https://developer.android.com/studio#command-tools) + via
  `sdkmanager` `platform-tools`, `platforms;android-36`, `build-tools;36.0.0` installieren.
- Node.js (hast du schon, wenn du bis hierhin gekommen bist) und ein JDK 17+ (Android Studio bringt eins mit).

**2. Projekt auf deinem Rechner holen und synchronisieren**

```bash
git pull                     # oder: Branch claude/lomira-storage-revenucat-jg2eja auschecken
npm install
npm run build
npx cap sync android
```

**3. Gerät vorbereiten**

Auf dem Android-Gerät: Einstellungen → Über das Telefon → 7× auf "Build-Nummer" tippen (aktiviert Entwickleroptionen)
→ Einstellungen → System → Entwickleroptionen → "USB-Debugging" aktivieren. Gerät per USB anschließen, den
"USB-Debugging erlauben?"-Dialog auf dem Gerät bestätigen.

**4. App installieren und starten**

```bash
npx cap run android          # zeigt verbundene Geräte/Emulatoren zur Auswahl, baut + installiert + startet
```

oder in Android Studio: `npx cap open android`, dann oben rechts das angeschlossene Gerät auswählen und den grünen
Play-Button ("Run") drücken. Beim allerersten Build lädt Gradle einmalig das Android Gradle Plugin und die
androidx-Abhängigkeiten herunter (paar Minuten, braucht Internet).

**5. Ablauf testen**

1. Tab **Lektionen** öffnen, eine gesperrte Lektion (z. B. Nr. 2) antippen → Paywall öffnet sich mit den Preisen aus
   dem RevenueCat-Offering (aktuell der Test-Store-Key aus `.env.local`, Entitlement `lomira_pro`).
2. "14 Tage kostenlos testen" tippen → der Test-Store-Kaufdialog von RevenueCat erscheint (kein echter Play-Billing-Dialog,
   da Test-Store-Key) → Kauf bestätigen.
3. Zurück in Lektionen: die zuvor gesperrte Lektion zeigt jetzt das Häkchen-Icon statt Schloss und öffnet direkt.

Falls die Preise nicht erscheinen: prüfen, ob im RevenueCat-Dashboard unter dem Test-Store-Projekt ein Offering mit
`annual`- und `monthly`-Package sowie das Entitlement `lomira_pro` existieren — ohne die zeigt der Paywall `—` statt
erfundener Preise.

## Bekannte Lücken / bewusst offen gelassen

- Kein Xcode-Projekt (`ios/`) im Repo — `npx cap add ios` muss auf einem Mac laufen. Das Android-Projekt (`android/`)
  ist dagegen bereits im Repo.
- Kein Eingabeformular für Puls-Werte (siehe oben).
- Der "Berühren"-Tab ist im Original-Entwurf nur ein Platzhalter-Tab ohne Inhalt; hier entsprechend ein
  "Bald verfügbar"-Screen statt erfundener Funktionalität.
- Preise/Trial-Länge im Paywall kommen live von RevenueCat (`offering.annual`/`offering.monthly`); ohne konfigurierte
  Keys zeigt die App "—" statt erfundener Preise.
