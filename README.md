# Lomira

Nervensystem-Regulations-App (React + Capacitor, iOS). Portiert aus dem Claude-Design-Entwurf, mit echter lokaler Datenspeicherung und RevenueCat-Anbindung für Trial/Abo.

## Stack

- Vite + React + TypeScript
- Capacitor (iOS)
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
npx cap sync
npx cap open ios
```

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
2. `.env.local`: `VITE_REVENUECAT_IOS_API_KEY` (der iOS-SDK-Key aus dem RevenueCat-Dashboard) und optional
   `VITE_REVENUECAT_ENTITLEMENT_ID` (Default `plus`) eintragen.
3. Lektionen 2–18 und der unbegrenzte Ritual-Verlauf sind hinter dem Entitlement gated (`useSubscription().isSubscribed`).
   Lektion 1 bleibt immer frei zugänglich.

RevenueCats iOS-SDK läuft nur in der nativen iOS-Hülle. Im Browser (`npm run dev`/`preview`) erkennt die App das
automatisch (`Capacitor.getPlatform() !== 'ios'`) und zeigt im Paywall einen Hinweis statt einen Kaufversuch, der
ohnehin fehlschlagen würde.

## Bekannte Lücken / bewusst offen gelassen

- Kein Xcode-Projekt (`ios/`) im Repo — `npx cap add ios` muss auf einem Mac laufen.
- Kein Eingabeformular für Puls-Werte (siehe oben).
- Der "Berühren"-Tab ist im Original-Entwurf nur ein Platzhalter-Tab ohne Inhalt; hier entsprechend ein
  "Bald verfügbar"-Screen statt erfundener Funktionalität.
- Preise/Trial-Länge im Paywall kommen live von RevenueCat (`offering.annual`/`offering.monthly`); ohne konfigurierte
  Keys zeigt die App "—" statt erfundener Preise.
