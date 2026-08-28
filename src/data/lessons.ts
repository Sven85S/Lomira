export interface Lesson {
  title: string;
  paragraphs: string[];
  question: string;
}

export const LESSON_BLOCKS: { title: string; lessonIds: number[] }[] = [
  { title: 'Block 1 — Grundlagen: wie dein Nervensystem funktioniert', lessonIds: [1, 2, 3, 4] },
  { title: 'Block 2 — Stress & Dysregulation erkennen', lessonIds: [5, 6, 7, 8, 9] },
  { title: 'Block 3 — Selbstregulation: die Werkzeuge', lessonIds: [10, 11, 12, 13] },
  { title: 'Block 4 — Ko-Regulation', lessonIds: [14, 15] },
  { title: 'Block 5 — Alltag & Resilienz', lessonIds: [16, 17, 18] },
];

export const LESSON_CONTENT: Record<number, Lesson> = {
    1: {
      title: 'Sympathikus & Parasympathikus einfach erklärt',
      paragraphs: [
        'Dein Nervensystem hat zwei Betriebsmodi: Sympathikus und Parasympathikus. Der Sympathikus mobilisiert dich – Puls hoch, Muskeln angespannt, Aufmerksamkeit nach außen. Der Parasympathikus fährt zurück: Verdauung, Erholung, innere Ruhe. Beide sind fast immer gleichzeitig aktiv, nur mit unterschiedlichem Gewicht. Kein Schalter, eher ein Mischpult.',
        'Entscheidend ist nicht, ob du gerade aktiviert bist. Entscheidend ist, ob dein System wieder runterfahren kann, sobald der Anlass vorbei ist. Diese Fähigkeit nennt man autonome Flexibilität – der Wechsel zwischen Aktivierung und Erholung, je nachdem, was gerade gebraucht wird. Ein gut reguliertes System stellt Energie bereit, wenn Handlung nötig ist, und fährt sie wieder runter, sobald die Anforderung vorbei ist.',
        'Genau das fällt schwer, wenn du oft angespannt bist, auch ohne klaren Grund. Der Sympathikus bleibt dann im Hintergrund an, selbst wenn äußerlich längst Ruhe ist. Ein Meeting, das seit Stunden vorbei ist, wirkt im Körper nach, obwohl es im Kopf längst abgehakt wurde. Nicht, weil du zu wenig entspannst, sondern weil das System den Wechsel verlernt hat.',
        'Stress zeigt sich deshalb oft nicht nur als Anspannung, sondern als Verlust dieser Flexibilität – als ein System, das schwerer zwischen den Modi hin- und herfindet.',
      ],
      question: 'Frag dich heute Abend: War ich zwischendurch wirklich entspannt – oder nur äußerlich ruhig?',
    },
    2: {
      title: 'Die drei Grundzustände: sicher, mobilisiert, erstarrt',
      paragraphs: [
        'Dein Nervensystem kennt im Kern drei Zustände. Sicher: du bist wach, aber entspannt, kannst zuhören, sprechen, Blickkontakt halten, die Stimme trägt normal. Mobilisiert: der Sympathikus übernimmt, Puls und Muskeltonus steigen, der Blick wird fester, der Atem flacher – du bist bereit zu handeln, ob durch Angehen oder Weggehen. Nützlich bei echter Anforderung, anstrengend als Dauerzustand.',
        'Erstarrt: das System dämpft sich aktiv, wenn Mobilisierung nicht mehr reicht. Kein Ausruhen, eher ein Rückzug unter Volllast – Körperschwere, Taubheit, das Gefühl, hinter einer Glasscheibe zu stehen. Manchmal fehlt sogar der Zugang zu Hunger oder Müdigkeit, selbst Entscheidungen fühlen sich plötzlich unmöglich an. Die Welt wirkt dann eher gedämpft als bedrohlich.',
        'Erstarren ist keine Schwäche und keine Entspannung. Es ist eine eigene Schutzreaktion mit eigener Funktion. Der Körper hat die Notbremse gezogen, weil er die Situation als zu viel eingestuft hat – nicht, weil du versagt hast.',
        'Die drei Zustände sind keine Charaktereigenschaften. Sie wechseln, je nachdem, was dein Nervensystem gerade als sicher oder unsicher bewertet, oft ohne dass du bewusst etwas dazu entschieden hast. Am ehesten merkst du den Wechsel rückblickend, am Zustand deines Körpers.',
        'Keiner der drei Zustände ist falsch. Jeder hatte irgendwann eine gute Funktion.',
      ],
      question: 'Wo stehst du gerade – sicher, mobilisiert oder eher erstarrt?',
    },
    3: {
      title: 'Der Vagusnerv – deine innere Bremse',
      paragraphs: [
        'Der Vagusnerv verbindet Gehirn und Körper – Herz, Lunge, Verdauung, fast alle inneren Organe. Der größte Teil seiner Fasern läuft dabei nicht vom Kopf zum Körper, sondern umgekehrt: vom Körper zum Gehirn. Er meldet also mehr, als er befiehlt.',
        'Ein Beispiel: die respiratorische Sinusarrhythmie. Beim Einatmen steigt der Puls leicht, beim Ausatmen sinkt er wieder. Deshalb wirken langsame Atemzüge mit langem Ausatmen beruhigend – nicht durch Zufall, sondern über diese direkte Kopplung von Atmung, Herz und Vagusnerv.',
        'In der Polyvagal-Perspektive unterscheidet man zwei Anteile: den ventralen, der mit sozialer Orientierung und Ruhe verbunden ist, und den dorsalen, der bei Überforderung eher zu Rückzug und Dämpfung führt. Beide gehören zum selben Nerv, nur mit unterschiedlicher Funktion.',
        'Der Vagusnerv ist kein Entspannungsknopf, den du drückst. Er ist ein Informationsweg, in beide Richtungen: Er meldet dem Gehirn, wie sicher sich der Körper fühlt, und wird gleichzeitig von dem beeinflusst, was du tust – Atmung, Haltung, Tempo.',
      ],
      question: 'Was würde sich ändern, wenn du deinen Atem als Werkzeug siehst statt als Nebensache?',
    },
    4: {
      title: 'Warum reines „Kopf beruhigen" oft nicht reicht',
      paragraphs: [
        'Es gibt zwei Wege, wie dein Gehirn mit Stress umgeht. Top-down: präfrontale Bereiche ordnen ein, bewerten, bremsen Impulse – das ist die bewusste, sprachliche Seite. Bottom-up: Signale aus Körper, Amygdala und Hirnstamm melden sich, oft bevor du überhaupt nachdenkst.',
        'Unter Stress gewinnen Bottom-up-Signale an Gewicht. Der Körper ist schneller als die Analyse. Das erklärt, warum eine neutrale Bemerkung wie Kritik wirken kann, eine kurze Pause wie Ablehnung, eine Unsicherheit wie echte Gefahr – nicht weil die Wahrnehmung falsch ist, sondern weil sie gerade zustandsabhängig ist.',
        'Genau deshalb reicht „sich zusammenreißen" oder „einfach ruhig bleiben" oft nicht. Das sind Top-down-Strategien, sie setzen bei Gedanken an. Wenn der Körper aber längst in Alarmbereitschaft ist, kommt die Beruhigung von oben nicht mehr durch.',
        'Wirksamer ist dann der umgekehrte Weg: erst den Körper regulieren – Atem, Tempo, Haltung –, dann folgt der Kopf oft von allein nach.',
      ],
      question: 'Wann hast du zuletzt versucht, dich „nur mit Kopf" zu beruhigen – hat es funktioniert?',
    },
    5: {
      title: 'Frühe Körpersignale von Anspannung',
      paragraphs: [
        'Bevor du bewusst merkst, dass du gestresst bist, hat dein Körper es längst registriert. Diese automatische Einschätzung heißt Neurozeption: dein Nervensystem liest ständig Signale von außen und innen – Stimme, Tonfall, Körperhaltung, aber auch Herzschlag, Atemrhythmus, Enge oder Druck – und bewertet, ob gerade Sicherheit oder Gefahr vorliegt. Das passiert vorbewusst, lange bevor ein Gedanke dazu entsteht. Ein Kollege, der die Stimme hebt, kann diese Kette in Sekunden auslösen, bevor du bewusst registrierst, dass dich etwas gestört hat.',
        'Drei Quellen fließen dabei zusammen: Reize von außen wie Tonfall oder Gesichtsausdruck, innere Körpersignale wie Herzschlag oder Atmung (Interozeption), und die Wahrnehmung von Spannung in Muskeln und Gelenken. Aus allen dreien zusammen entsteht die Lageeinschätzung: Was ist hier los, und wie reagiere ich am besten?',
        'Frühe Anspannung zeigt sich oft zuerst im Körper, nicht im Kopf: ein enger Kiefer, hochgezogene Schultern, flacher Atem, ein Kloß im Hals. Der Kopf merkt es meist erst später, manchmal erst, wenn die Anspannung schon eine Weile da ist.',
        'Wer diese frühen Signale kennt, kann früher reagieren, statt erst beim Vollausschlag zu merken, dass etwas nicht stimmt.',
      ],
      question: 'Wo in deinem Körper merkst du Anspannung normalerweise zuerst?',
    },
    6: {
      title: 'Fight, Flight, Freeze, Fawn',
      paragraphs: [
        'Vier Schutzmuster beschreiben, wie dein Nervensystem auf Bedrohung reagiert – nicht als Charaktereigenschaften, sondern als Modelle für das, was gerade im Körper passiert.',
        'Kampf: Mobilisierung nach außen. Erhöhter Puls, Muskelspannung, fester Blick. Psychologisch oft Gereiztheit, Kontrollimpuls, das Bedürfnis, sich zu rechtfertigen.',
        'Flucht: Mobilisierung in Richtung Abstand. Bewegungsdrang, flache Atmung, innere Unruhe. Zeigt sich als Aufschieben, Themawechsel, inneres Aussteigen aus einem Gespräch.',
        'Erstarren: Hemmung bei gleichzeitiger Alarmbereitschaft. Starre Mimik, Kälteempfinden, Taubheit. Psychologisch Denkblockade, innere Leere, manchmal Sprachlosigkeit.',
        'Beschwichtigung: soziale Anpassung zur Spannungsreduktion. Nach außen ruhig, innen oft angespannt. Zustimmung, Selbstzurücknahme, ein Lächeln, das nicht ganz stimmt.',
        'Diese Muster können sich abwechseln oder mischen, auch innerhalb einer einzigen Situation: erst Kampf, dann, wenn das nicht hilft, Erstarren. Genau deshalb werden Stressreaktionen im Alltag oft falsch gelesen – als Faulheit, Gleichgültigkeit oder fehlende Kooperation, wo eigentlich Schutz am Werk ist.',
        'Alle vier Muster galten irgendwann als sinnvolle Antwort auf eine reale Bedrohung. Problematisch werden sie erst, wenn sie auch dann noch aktiv bleiben, wenn die Situation längst mehr Spielraum erlauben würde.',
      ],
      question: 'Welches Muster erkennst du bei dir am häufigsten wieder?',
    },
    7: {
      title: 'Warum du manchmal wie eingefroren bist',
      paragraphs: [
        'Erstarren fühlt sich oft wie Versagen an: Du willst reagieren, sagen, handeln – und nichts passiert. Kein Wort kommt, kein Impuls trägt. Das wirkt wie Schwäche. Ist es aber nicht.',
        'Am unteren Rand deines Toleranzfensters greift dein Nervensystem zu einer anderen Strategie als Kampf oder Flucht: aktive Dämpfung. Energie wird reduziert, Reaktivität nimmt ab, innerer Abstand entsteht. Erfahrungsmäßig äußert sich das als Taubheit, innere Leere, Körperschwere, oder das Gefühl, die Welt hinter einer Glasscheibe zu erleben.',
        'In der Polyvagal-Perspektive wird das mit dem dorsalen Vagusanteil verbunden: eine defensive Immobilität. Nicht Entspannung, sondern Schutzreaktion unter Überlastung. Von außen wirkt jemand, der erstarrt, oft nur ruhig oder abwesend. Was innerlich passiert, bleibt unsichtbar.',
        'Anhaltende Überforderung, chronischer Schmerz oder frühere Erfahrungen mit Kontrollverlust können das Toleranzfenster verengen, sodass Erstarren schneller eintritt als bei einem System mit breiterem Spielraum.',
        'Der Unterschied zu echter Erholung ist spürbar: Erholung fühlt sich regenerativ an. Erstarren fühlt sich leer an, manchmal sogar bedrohlich.',
      ],
      question: 'Wenn du das nächste Mal erstarrst, probier eine Frage statt einer Bewertung: Was würde mein Körper gerade als sicherer empfinden?',
    },
    8: {
      title: 'Akuter Stress vs. chronische Übererregung',
      paragraphs: [
        'Akuter Stress ist eine zeitlich begrenzte Reaktion auf eine konkrete Anforderung. Aufmerksamkeit, Muskelspannung, Herzfrequenz steigen kurzfristig – und wenn die Situation vorbei ist, kehrt das System meist wieder in Richtung Ruhe zurück. Ein stressiges Bewerbungsgespräch gehört hierher. Das ist normal und für sich genommen nicht schädlich.',
        'Chronischer Stress entsteht, wenn Anforderungen über längere Zeit bestehen bleiben oder das Nervensystem wiederholt aktiviert wird, ohne genug Erholung dazwischen. Ein Job, der dich seit Monaten überfordert, ohne dass sich etwas ändert, gehört hierher. Die Auslöser müssen dabei nicht dramatisch sein: wiederkehrende Unsicherheit, Schlafmangel, Konflikte oder fehlende Vorhersagbarkeit reichen aus.',
        'Biochemisch sind zwei Systeme beteiligt: das schnelle, das über Adrenalin sofort reagiert, und die langsamere Stressachse über Cortisol, die eher über Stunden wirkt und Energie, Blutzucker und Immunsystem beeinflusst.',
        'Der Unterschied liegt also nicht in der Intensität eines einzelnen Moments, sondern in der Erholung danach. Bei akutem Stress kommt sie. Bei chronischem bleibt sie aus. Über Zeit summiert sich das zu dem, was Forscher allostatische Last nennen.',
      ],
      question: 'Wie oft hattest du diese Woche wirklich Erholung zwischen zwei belastenden Momenten?',
    },
    9: {
      title: 'Trigger erkennen, ohne von ihnen gesteuert zu werden',
      paragraphs: [
        'Ein bestimmter Tonfall macht dich sofort angespannt. Ein Geruch verändert deinen Körperzustand, bevor du weißt, warum. Das ist kein Zufall und keine Überreaktion – dein Nervensystem hat gelernt, diesen Reiz als bedeutsam einzustufen, oft lange bevor eine bewusste Erinnerung dazu existiert.',
        'Diese Art des Lernens heißt implizites Gedächtnis. Anders als eine Jahreszahl oder ein Name zeigt es sich nicht im Erzählen, sondern im Tun, Spüren und Reagieren. Die Amygdala ist stark daran beteiligt, äußere Reize mit Gefahr zu verknüpfen – ein Lernprozess, der sich nicht einfach wegdenken lässt.',
        'Zwei Menschen können ein ähnliches Ereignis erleben und ganz unterschiedliche Spuren davontragen, abhängig von Vorerfahrung, Erschöpfungsgrad und davon, ob damals Unterstützung verfügbar war. Das ist kein Zeichen von Stärke oder Schwäche, sondern das Ergebnis unterschiedlicher Ausgangsbedingungen.',
        'Deshalb hilft reine Willenskraft gegen einen Auslöser wenig. Du reagierst nicht auf die aktuelle Situation, sondern auf ein gespeichertes Muster, das gerade aktiviert wurde. Was hilft, ist Erkennen statt Bekämpfen.',
      ],
      question: 'Welcher Auslöser bringt dich am zuverlässigsten aus der Ruhe?',
    },
    10: {
      title: 'Atmung als schnellster Hebel',
      paragraphs: [
        'Von allen Zugängen zum Nervensystem ist der Atem der schnellste – kein Werkzeug, das erst gekauft oder gelernt werden muss, nur ein System, das ohnehin schon läuft. Wie du gerade atmest, ist kein neutraler Vorgang: Atemfrequenz, -tiefe und -muster verändern sich mit deinem Nervensystemzustand, und umgekehrt beeinflusst der Atem das System zurück.',
        'Unter Stress atmen die meisten Menschen schneller, flacher, stärker über den Brustkorb statt übers Zwerchfell. Die Ausatmung wird kürzer, manchmal entsteht ein leichtes Anhalten zwischen den Zügen. Normale Ruheatmung liegt bei 10 bis 14 Atemzügen pro Minute – ab etwa 15 gilt sie in der Forschung als möglicher Hinweis auf erhöhte Aktivierung.',
        'Diese Verbindung geht in beide Richtungen. Du kannst nicht willentlich deinen Puls senken, aber du kannst bewusst langsamer atmen – und der Rest folgt oft von selbst.',
      ],
      question: 'Wie atmest du gerade, in diesem Moment – schnell und hoch, oder ruhig und tief?',
    },
    11: {
      title: 'Warum Ausatmen länger als Einatmen sein sollte',
      paragraphs: [
        'Viele Atemtechniken setzen auf Kontrolle: tief einatmen, Bauch maximal ausweiten, Luft anhalten. Klingt plausibel, wirkt aber oft gegenteilig. Wer unter Anspannung beginnt, maximal tief zu atmen, kann eine paradoxe Reaktion auslösen – der Körper registriert die ungewohnte Atemanstrengung als zusätzliches Alarmsignal.',
        'Der wirksamere Weg ist meist der umgekehrte: nicht kontrolliert einatmen, sondern die Ausatmung locker passieren lassen, etwas länger als die Einatmung. Der Grund ist rein physiologisch: Beim Einatmen steigt die Herzfrequenz leicht, der Sympathikus bekommt kurz mehr Gewicht. Beim Ausatmen sinkt sie wieder, der Parasympathikus übernimmt mehr Raum.',
        'Eine einfache Grundstruktur zum Einstieg: 4 Sekunden einatmen, 6 Sekunden ausatmen, für mehr Erfahrung auch 4 zu 8. Wichtiger als die exakten Zahlen ist das Prinzip – Ausatmung länger als Einatmung, gleichmäßiger Rhythmus, keine Zwangsanstrengung.',
      ],
      question: 'Merkst du einen Unterschied, wenn du beim nächsten Ausatmen bewusst noch zwei, drei Sekunden dranhängst?',
    },
    12: {
      title: 'Kälte, Bewegung, Berührung – körperliche Hebel',
      paragraphs: [
        'Nicht jeder Zugang zur Regulation läuft über den Atem. Kälte, Bewegung und Berührung sind eigene, körperbasierte Hebel – unterschiedlich in der Wirkung, aber alle darauf ausgelegt, den Körper direkt anzusprechen statt über Gedanken.',
        'Kälte wirkt zunächst aktivierend, nicht beruhigend: Gefäße verengen sich, Puls und Atmung schnellen kurz hoch. Der eigentliche Regulationseffekt entsteht erst danach, in der Erholung – wiederholte, gut dosierte Kälteexposition trainiert genau diesen Übergang von Aktivierung zurück zur Ruhe.',
        'Bewegung wirkt direkter: Muskelaktivität baut die Stresshormone ab, die der Körper für genau diesen Zweck bereitgestellt hat. Selbst kurze Bewegung kann angestaute Aktivierung merklich lösen.',
        'Berührung, ob durch rhythmisches Klopfen oder einfachen Druck, ist eines der ältesten Sicherheitssignale, die dein Nervensystem kennt.',
      ],
      question: 'Welcher dieser drei Hebel fühlt sich für dich am zugänglichsten an, gerade jetzt?',
    },
    13: {
      title: 'Orientierung im Raum als Grounding-Trick',
      paragraphs: [
        'Erdung klingt nach einem großen Konzept, ist im Kern aber simpel: das bewusste Wahrnehmen des Bodenkontakts, des eigenen Gewichts, der Verbindung zwischen Füßen und Untergrund. Kein mystisches Ritual, sondern ein einfaches sensorisches Prinzip.',
        'Deine Füße liefern ständig Informationen – Härte, Temperatur, Unebenheit des Untergrunds. Diese Signale geben deinem Nervensystem Orientierung im gegenwärtigen Moment und können Aufmerksamkeit aus einem Gedankenkreisel zurück in den Körper holen.',
        'Barfußgehen auf unterschiedlichem Untergrund versorgt das Nervensystem mit reicher sensorischer Information und zählt zu den direktesten Körperankern, die im Alltag verfügbar sind, ganz ohne Vorbereitung.',
        'Der Trick funktioniert, weil er den Fokus verschiebt: von dem, was im Kopf passiert, zu dem, was der Körper gerade tatsächlich spürt.',
      ],
      question: 'Wann hast du zuletzt bewusst gespürt, worauf du gerade stehst?',
    },
    14: {
      title: 'Warum Nähe zu anderen dein Nervensystem beruhigt',
      paragraphs: [
        'Dein Nervensystem lernt Regulation nicht allein, sondern über Beziehung. Früh in der Entwicklung übernehmen Bezugspersonen mit: durch Stimme, Berührung, Rhythmus, bloße Präsenz. Dieser Mechanismus – Ko-Regulation genannt – bleibt ein Leben lang wirksam.',
        'In Gegenwart eines ruhigen, verlässlichen Menschen kann sich dein eigenes Nervensystem stabilisieren, oft ohne ein einziges Wort. Menschen mit engen, verlässlichen Beziehungen zeigen im Durchschnitt niedrigere Stresshormonspiegel und ein breiteres Toleranzfenster.',
        'Was dabei zählt, ist nicht die Anzahl der Kontakte, sondern ihre Qualität: Verbundenheit ohne Bewertungsdruck. Eine einzige verlässliche Beziehung kann dafür bereits genügen. Chronische Isolation wirkt dagegen messbar belastend.',
      ],
      question: 'Wer in deinem Umfeld hilft deinem Nervensystem am zuverlässigsten, zur Ruhe zu kommen?',
    },
    15: {
      title: 'Co-Regulation erkennen, auch ohne Worte',
      paragraphs: [
        'Co-Regulation braucht keine Sprache. Sie läuft über Kanäle, die dein Nervensystem längst kennt, bevor du überhaupt sprechen konntest: Tonfall, Tempo, Mimik, Körperhaltung, die schlichte Präsenz eines anderen Menschen.',
        'Ein ruhiger Tonfall, langsame Bewegungen, ein entspannter Gesichtsausdruck signalisieren deinem System auf einer sehr grundlegenden Ebene: Hier ist gerade keine Gefahr. Das ist automatische Signalverarbeitung – dieselbe Neurozeption, die auch Bedrohung erkennt.',
        'Genau deshalb kann das bloße Dasitzen neben jemand Vertrautem regulierend wirken. Und genau deshalb kann Anspannung in einem Raum ansteckend wirken, bevor irgendjemand etwas sagt.',
        'Co-Regulation zu erkennen heißt, diesen nonverbalen Austausch bewusst wahrzunehmen, statt ihn nur unbewusst mitzumachen.',
      ],
      question: 'Wessen Anwesenheit macht dich ruhiger, allein durch die Art, wie die Person da ist?',
    },
    16: {
      title: 'Nervensystem täglich trainieren statt nur im Akutfall reagieren',
      paragraphs: [
        'Resilienz ist kein Programm, das man einmal absolviert und dann besitzt. Sie ist eher eine Richtung, in die sich der Alltag über Zeit entwickeln kann – getragen von wiederkehrenden, eher kleinen Faktoren statt einer einzelnen großen Veränderung.',
        'Dosierte Herausforderung gehört dazu: kleine, regelmäßige Belastungen aushalten und verarbeiten, mit ausreichend Erholung danach. Genau dieses Prinzip trainiert dein Nervensystem darin, flexibler zwischen Aktivierung und Ruhe zu wechseln.',
        'Bewegung, Schlaf und soziale Verbundenheit zählen zu den am besten belegten Bausteinen. Keiner dieser Faktoren wirkt allein besonders stark – zusammen ergeben sie einen deutlichen Unterschied.',
        'Wer sein Nervensystem nur im Akutfall reguliert, trainiert nichts. Regulation, die zur Gewohnheit wird, verändert die Ausgangslage selbst.',
      ],
      question: 'Welcher kleine, wiederkehrende Baustein fehlt bei dir gerade am meisten?',
    },
    17: {
      title: 'Schlaf und Nervensystem',
      paragraphs: [
        'Dein Körper hat eine innere Uhr – ein biologisches Zeitprogramm von etwa 24 Stunden, gesteuert von einem winzigen Kerngebiet im Hypothalamus. Diese Uhr bestimmt Körpertemperatur, Hormonspiegel, Verdauung und wie leicht dein Nervensystem reguliert.',
        'Licht ist dabei das stärkste Signal. Es steuert die Ausschüttung von Melatonin, das weniger ein Einschlafhormon ist als ein Dunkelheitssignal. Abendliches Bildschirmlicht kann dieses Signal verzögern und den Einschlafzeitpunkt nach hinten schieben.',
        'Cortisol folgt einem eigenen Tagesprofil: ein starker Anstieg nach dem Aufwachen, danach ein allmähliches Absinken. Chronischer Stress und unregelmäßiger Schlaf können dieses Profil verflachen – mit Folgen für die Erholungsfähigkeit am nächsten Tag.',
        'Schlaf ist damit keine Nebensache der Regulation, sondern eine ihrer biologischen Grundlagen.',
      ],
      question: 'Wie regelmäßig ist dein Schlaf-Wach-Rhythmus in einer typischen Woche wirklich?',
    },
    18: {
      title: 'Rückfälle sind normal – wieder reinfinden nach einer dysregulierten Phase',
      paragraphs: [
        'Alte Muster sind nie wirklich gelöscht, nur überlagert. Unter Stress können sie sich reaktivieren – ein scheinbarer Rückschritt, nachdem du gerade dachtest, ein Stück weitergekommen zu sein. Das ist erwartbar, kein Anzeichen dafür, dass sich nichts verändert hat.',
        'Entscheidend ist, wie du diesen Moment deutest. Wer einen Rückfall als persönliches Versagen liest, verstärkt genau die Aktivierung, die reguliert werden sollte. Was dein Nervensystem stattdessen braucht, ist Einordnung: Das war ein Rückfall ins alte Muster, mein System war überlastet.',
        'Studien zu Selbstmitgefühl zeigen: Sich selbst mit derselben Freundlichkeit zu begegnen, die du einem guten Freund entgegenbringen würdest, hängt mit besserer emotionaler Regulation zusammen – Selbstkritik wirkt höchstens kurzfristig.',
        'Ein Rückfall zeigt, dass dein System unter Belastung auf Vertrautes zurückgreift. Das ist das Erwartbare, nicht das Scheitern.',
      ],
      question: 'Wie sprichst du normalerweise mit dir selbst, wenn du merkst, dass du in ein altes Muster zurückgefallen bist?',
    },
};
