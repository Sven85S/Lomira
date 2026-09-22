export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export interface LegalDocument {
  title: string;
  sections: LegalSection[];
  footer: string;
}

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Datenschutzerklärung',
  sections: [
    {
      heading: '1. Verantwortlicher',
      paragraphs: ['Sven Schipper, Seestr. 122, 21514 Güster, E-Mail: info@sven-schipper.com'],
    },
    {
      heading: '2. Grundsatz: Datensparsamkeit',
      paragraphs: [
        'Lomira ist bewusst ohne Nutzerkonto und ohne Server-Backend gebaut. Die meisten deiner Daten — Atemübungs-Verlauf, Ritual-Einträge, Streak, HRV-Messwerte, Einstellungen sowie dein optional angegebener Vorname — werden ausschließlich lokal auf deinem Gerät gespeichert und nicht an uns oder Dritte übertragen. Wir haben zu diesen Daten keinen Zugriff.',
      ],
    },
    {
      heading: '3. Kamera-Zugriff für die HRV-Messung',
      paragraphs: [
        'Für die Messung der Herzratenvariabilität benötigt die App Zugriff auf die Kamera deines Geräts. Dabei liest die App über die Kamera und den Blitz deinen Puls am Finger ab (photoplethysmographische Messung). Die Berechnung des Herzraten- und HRV-Werts (RMSSD) erfolgt vollständig lokal auf deinem Gerät. Es werden dabei keine Bilder oder Videoaufnahmen gespeichert oder übertragen — die Kameradaten werden ausschließlich zur Echtzeit-Berechnung genutzt und danach verworfen. Die Kameraberechtigung wird nur mit deiner ausdrücklichen Zustimmung aktiviert; du kannst sie jederzeit in den iOS-Einstellungen widerrufen.',
      ],
    },
    {
      heading: '4. Gesundheitsbezogene Daten',
      paragraphs: [
        'Die in der App angezeigten Werte (Herzratenvariabilität, Ruhepuls) sind gesundheitsnahe Informationen im Sinne des Art. 9 DSGVO. Da diese Werte ausschließlich lokal auf deinem Gerät berechnet und gespeichert werden und wir als Anbieter keinen Zugriff darauf haben, verarbeiten wir selbst keine besonderen Kategorien personenbezogener Daten. Bitte beachte: Die App dient der Selbstbeobachtung und Entspannung und ersetzt keine medizinische Diagnose, Beratung oder Behandlung.',
      ],
    },
    {
      heading: '5. Optionale Weitergabe an Apple Health',
      paragraphs: [
        'Wenn du die Funktion „In Health speichern" in den Einstellungen aktivierst, schreibt die App deine Puls- und HRV-Werte (SDNN) zusätzlich in die Health-App von Apple. Das geschieht ausschließlich, wenn du diese Funktion selbst aktivierst, und ausschließlich lokal auf deinem Gerät über Apples eigenes HealthKit-Framework — wir als Anbieter erhalten dabei keinen Zugriff auf diese Daten. Die Verarbeitung innerhalb der Health-App unterliegt Apples eigener Datenschutzerklärung.',
      ],
    },
    {
      heading: '6. Push-Benachrichtigungen / Erinnerungen',
      paragraphs: [
        'Wenn du die Erinnerungsfunktion aktivierst, plant die App lokale Benachrichtigungen auf deinem Gerät. Auch hierfür werden keine Daten an uns oder Dritte übertragen. Du kannst die Berechtigung jederzeit in den iOS-Einstellungen widerrufen.',
      ],
    },
    {
      heading: '7. Abonnement und Zahlungsabwicklung',
      paragraphs: [
        'Der Kauf eines Abonnements erfolgt über Apples In-App-Kauf-System (App Store). Zahlungsdaten verarbeiten wir zu keinem Zeitpunkt selbst — diese liegen ausschließlich bei Apple und unterliegen der Datenschutzerklärung von Apple. Zur Verwaltung von Abonnements nutzen wir den Dienst RevenueCat, Inc. (USA) als Auftragsverarbeiter. An RevenueCat übermittelt werden Kauftransaktionsdaten (z. B. eine anonyme App-User-ID, Produkt-ID, Kaufdatum, Abo-Status) — keine Zahlungs- oder Kontodaten. Da RevenueCat seinen Sitz außerhalb der EU hat, erfolgt die Übermittlung auf Grundlage von Standardvertragsklauseln gemäß Art. 46 DSGVO.',
      ],
    },
    {
      heading: '8. Keine Werbung, kein Tracking',
      paragraphs: ['Lomira zeigt keine Werbung an und setzt keine Tracking- oder Analysewerkzeuge Dritter ein.'],
    },
    {
      heading: '9. Deine Rechte',
      paragraphs: [
        'Du hast nach der DSGVO das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung deiner Daten sowie ein Beschwerderecht bei einer Datenschutz-Aufsichtsbehörde. Da nahezu alle App-Daten lokal auf deinem Gerät liegen, kannst du diese jederzeit selbst löschen, indem du die App deinstallierst oder die Daten in den Einstellungen zurücksetzt.',
      ],
    },
    {
      heading: '10. Kontakt',
      paragraphs: ['info@sven-schipper.com'],
    },
  ],
  footer: 'Stand: September 2026',
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Nutzungsbedingungen',
  sections: [
    {
      heading: '1. Geltungsbereich',
      paragraphs: [
        'Diese Nutzungsbedingungen gelten für die Nutzung der App „Lomira" (nachfolgend „App"), angeboten von Sven Schipper, Seestr. 122, 21514 Güster.',
      ],
    },
    {
      heading: '2. Leistungsbeschreibung',
      paragraphs: [
        'Lomira ist eine Wellness-App zur Unterstützung der Nervensystem-Regulation durch geführte Atemübungen, Körperübungen (Klopfen/Akupressur), psychoedukative Lektionen, ein Reflexions-Ritual sowie eine optionale, kamerabasierte Messung der Herzratenvariabilität.',
        'Wichtiger Hinweis: Lomira ist kein Medizinprodukt und ersetzt keine ärztliche, psychotherapeutische oder anderweitig professionelle Diagnose, Beratung oder Behandlung. Bei gesundheitlichen Beschwerden, insbesondere psychischen Krisen, wende dich bitte an eine Ärztin/einen Arzt, eine Therapeutin/einen Therapeuten oder eine entsprechende Beratungsstelle.',
      ],
    },
    {
      heading: '3. Nutzung ohne Registrierung',
      paragraphs: ['Die App erfordert kein Nutzerkonto. Alle App-Daten verbleiben lokal auf deinem Gerät.'],
    },
    {
      heading: '4. Abonnement, Testphase und Kündigung',
      paragraphs: [
        'Lomira bietet einen kostenlosen 7-tägigen Testzeitraum. Nach Ablauf der Testphase ist die vollständige Nutzung nur mit einem kostenpflichtigen Abonnement (monatlich 2,99 € oder jährlich 24,99 €, „Lomira Plus") möglich. Das Abonnement verlängert sich automatisch, sofern es nicht spätestens 24 Stunden vor Ablauf der aktuellen Periode gekündigt wird. Abschluss, Verwaltung und Kündigung erfolgen ausschließlich über dein Apple-ID-Konto in den iOS-Einstellungen. Rückerstattungen richten sich nach den Richtlinien von Apple.',
      ],
    },
    {
      heading: '5. Nutzungsrechte',
      paragraphs: [
        'Wir räumen dir ein einfaches, nicht übertragbares, persönliches Recht zur Nutzung der App im Rahmen deines Abonnements ein. Eine Weitergabe, Vervielfältigung oder kommerzielle Nutzung der App-Inhalte ist nicht gestattet.',
      ],
    },
    {
      heading: '6. Verfügbarkeit',
      paragraphs: ['Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit der App, können diese aber nicht garantieren.'],
    },
    {
      heading: '7. Haftung',
      paragraphs: [
        'Wir haften unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Im Übrigen haften wir nur bei Verletzung wesentlicher Vertragspflichten und beschränkt auf den vorhersehbaren, vertragstypischen Schaden.',
      ],
    },
    {
      heading: '8. Mindestalter',
      paragraphs: ['Die Nutzung der App richtet sich an Personen ab 18 Jahren.'],
    },
    {
      heading: '9. Änderungen',
      paragraphs: ['Wir behalten uns vor, diese Nutzungsbedingungen bei Bedarf anzupassen. Über wesentliche Änderungen informieren wir dich innerhalb der App.'],
    },
    {
      heading: '10. Anwendbares Recht',
      paragraphs: ['Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.'],
    },
    {
      heading: '11. Kontakt',
      paragraphs: ['info@sven-schipper.com'],
    },
  ],
  footer: 'Stand: September 2026',
};
