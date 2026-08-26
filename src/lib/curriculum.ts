export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type CefrSubLevel = '1' | '2';
export type CurriculumLanguage = 'English' | 'German';
export type CurriculumSkill =
  | 'vocabulary'
  | 'listening'
  | 'pronunciation'
  | 'sentence_building'
  | 'grammar'
  | 'dictation'
  | 'reading'
  | 'speaking'
  | 'writing'
  | 'conversation'
  | 'test';

export type ExerciseType =
  | 'vocabulary_match'
  | 'audio_choice'
  | 'listen_and_select'
  | 'listen_for_detail'
  | 'dictation_word'
  | 'dictation_sentence'
  | 'dictation_gap'
  | 'gap_fill'
  | 'sentence_order'
  | 'grammar_choice'
  | 'reading_main_idea'
  | 'reading_detail'
  | 'reading_true_false'
  | 'reading_heading_match'
  | 'pronunciation_repeat'
  | 'minimal_pairs'
  | 'shadowing'
  | 'guided_speaking'
  | 'free_speaking'
  | 'guided_writing'
  | 'free_writing'
  | 'roleplay'
  | 'lesson_test';

export type LessonStatus = 'locked' | 'available' | 'in_progress' | 'passed' | 'needs_review';

export type CurriculumVocabularyItem = {
  word: string;
  translation: string;
  example: string;
  audioText: string;
};

export type CurriculumChunk = {
  phrase: string;
  meaning: string;
  example: string;
};

export type ScoringRubric = {
  taskCompletion?: number;
  grammar?: number;
  vocabulary?: number;
  coherence?: number;
  spelling?: number;
  cefrAppropriateness?: number;
  pronunciation?: number;
  fluency?: number;
  accuracy?: number;
  comprehension?: number;
};

export type CurriculumExercise = {
  id: string;
  type: ExerciseType;
  skill: CurriculumSkill;
  title: string;
  instruction: string;
  content: Record<string, unknown>;
  correctAnswer?: string | string[] | Record<string, unknown>;
  acceptableAnswers?: string[];
  scoringRubric: ScoringRubric;
  minScoreToPass: number;
};

export type CurriculumLesson = {
  id: string;
  levelNumber: number;
  cefrLevel: CefrBand;
  cefrSubLevel: CefrSubLevel;
  language: CurriculumLanguage;
  title: string;
  theme: string;
  objective: string;
  canDo: string;
  grammarFocus: string;
  vocabulary: CurriculumVocabularyItem[];
  chunks: CurriculumChunk[];
  exercises: CurriculumExercise[];
  mastery: {
    minOverallScore: 75;
    minSkillScore: 60;
    vocabularyRequired: 80;
  };
};

export type CurriculumLevel = {
  levelNumber: number;
  cefrLevel: CefrBand;
  cefrSubLevel: CefrSubLevel;
  language: CurriculumLanguage;
  title: string;
  lessons: CurriculumLesson[];
  levelExam: CurriculumExercise;
};

export type SkillScores = Partial<Record<CurriculumSkill, number>>;

export const CURRICULUM_LEVELS: Array<{ levelNumber: number; cefrLevel: CefrBand; cefrSubLevel: CefrSubLevel; label: string }> = [
  { levelNumber: 1, cefrLevel: 'A1', cefrSubLevel: '1', label: 'A1.1' },
  { levelNumber: 2, cefrLevel: 'A1', cefrSubLevel: '2', label: 'A1.2' },
  { levelNumber: 3, cefrLevel: 'A2', cefrSubLevel: '1', label: 'A2.1' },
  { levelNumber: 4, cefrLevel: 'A2', cefrSubLevel: '2', label: 'A2.2' },
  { levelNumber: 5, cefrLevel: 'B1', cefrSubLevel: '1', label: 'B1.1' },
  { levelNumber: 6, cefrLevel: 'B1', cefrSubLevel: '2', label: 'B1.2' },
  { levelNumber: 7, cefrLevel: 'B2', cefrSubLevel: '1', label: 'B2.1' },
  { levelNumber: 8, cefrLevel: 'B2', cefrSubLevel: '2', label: 'B2.2' },
  { levelNumber: 9, cefrLevel: 'C1', cefrSubLevel: '1', label: 'C1.1' },
  { levelNumber: 10, cefrLevel: 'C1', cefrSubLevel: '2', label: 'C1.2' },
  { levelNumber: 11, cefrLevel: 'C2', cefrSubLevel: '1', label: 'C2.1' },
  { levelNumber: 12, cefrLevel: 'C2', cefrSubLevel: '2', label: 'C2.2' },
];

export const LESSON_JOURNEY: Array<{ order: number; skill: CurriculumSkill; title: string; defaultType: ExerciseType }> = [
  { order: 1, skill: 'vocabulary', title: 'Vocabulary & Chunks', defaultType: 'vocabulary_match' },
  { order: 2, skill: 'listening', title: 'Listening Comprehension', defaultType: 'listen_for_detail' },
  { order: 3, skill: 'pronunciation', title: 'Pronunciation', defaultType: 'pronunciation_repeat' },
  { order: 4, skill: 'sentence_building', title: 'Sentence Building', defaultType: 'sentence_order' },
  { order: 5, skill: 'grammar', title: 'Grammar in Context', defaultType: 'grammar_choice' },
  { order: 6, skill: 'dictation', title: 'Dictation', defaultType: 'dictation_sentence' },
  { order: 7, skill: 'reading', title: 'Reading Comprehension', defaultType: 'reading_detail' },
  { order: 8, skill: 'speaking', title: 'Speaking', defaultType: 'guided_speaking' },
  { order: 9, skill: 'writing', title: 'Writing', defaultType: 'guided_writing' },
  { order: 10, skill: 'conversation', title: 'Roleplay / Conversation', defaultType: 'roleplay' },
  { order: 11, skill: 'test', title: 'Lesson Test', defaultType: 'lesson_test' },
];

type LessonSeed = {
  theme: string;
  objective: string;
  canDo: string;
  grammarFocus: string;
  words: string[];
  chunks: string[];
  pronunciation: string;
  targetSentence: string;
  readingText: string;
};

const ENGLISH_TARGET_SENTENCES: Record<string, string> = {
  Introductions: 'Hello, my name is Sam and I am from Canada.',
  Numbers: 'My phone number is three one two seven eight zero.',
  Family: 'This is my sister and she lives with my father.',
  'Daily routine': 'Every morning I wake up early and study English.',
  Food: 'I would like coffee, bread, and a glass of water.',
  City: 'The station is near the bank on this street.',
  Home: 'The table is next to the window in my room.',
  Shopping: 'This jacket is cheaper than that expensive one.',
  Weather: 'Today is cold and windy, but it is not rainy.',
  Transport: 'I need a ticket for the early train.',
  Health: 'I feel tired and my head hurts today.',
  Review: 'Can you repeat the question slowly, please?',
  Plans: 'Tomorrow I want to visit my friend after work.',
  Appointments: 'Are you free on Monday at three o clock?',
  Travel: 'Last weekend I visited a hotel near the station.',
  Work: 'She works in an office and sends emails every morning.',
  'Digital life': 'Click here and send the message from your phone.',
  Services: 'Could you help me complete this address form?',
  Comparisons: 'This route is faster, but that ticket is cheaper.',
  Stories: 'First I lost my map, then I found the hotel.',
  Rules: 'You must be quiet and you cannot open that door.',
  Opinions: 'I think this lesson is useful because it is practical.',
  Emails: 'Thank you for your reply and best regards.',
};

const GERMAN_TARGET_SENTENCES: Record<string, string> = {
  Vorstellungen: 'Hallo, ich heisse Sam und ich komme aus Kanada.',
  Zahlen: 'Meine Telefonnummer ist drei eins zwei sieben acht null.',
  Familie: 'Das ist meine Schwester und sie wohnt bei meinem Vater.',
  Tagesroutine: 'Jeden Morgen stehe ich frueh auf und lerne Deutsch.',
  Essen: 'Ich moechte Kaffee, Brot und ein Glas Wasser.',
  Stadt: 'Der Bahnhof ist in der Naehe von der Bank.',
  Zuhause: 'Der Tisch steht neben dem Fenster in meinem Zimmer.',
  Einkaufen: 'Diese Jacke ist guenstiger als die teure Jacke.',
  Wetter: 'Heute ist es kalt und windig, aber nicht regnerisch.',
  Transport: 'Ich brauche eine Fahrkarte fuer den fruehen Zug.',
  Gesundheit: 'Ich bin muede und mein Kopf tut heute weh.',
  Wiederholung: 'Koennen Sie die Frage bitte langsam wiederholen?',
  Plaene: 'Morgen moechte ich nach der Arbeit einen Freund treffen.',
  Termine: 'Haben Sie am Montag um drei Uhr Zeit?',
  Reisen: 'Am Wochenende bin ich zu einem Hotel am Bahnhof gefahren.',
  Arbeit: 'Sie arbeitet im Buero und schreibt jeden Morgen E-Mails.',
  'Digitales Leben': 'Klicken Sie hier und schicken Sie die Nachricht vom Handy.',
  Aemter: 'Koennen Sie mir mit diesem Formular helfen?',
  Vergleiche: 'Diese Verbindung ist schneller, aber die Fahrkarte ist guenstiger.',
  Geschichten: 'Zuerst habe ich meine Karte verloren, danach habe ich das Hotel gefunden.',
  Regeln: 'Man muss leise sein und darf diese Tuer nicht oeffnen.',
  Meinungen: 'Ich finde diese Lektion nuetzlich, weil sie praktisch ist.',
  'E-Mails': 'Vielen Dank fuer Ihre Antwort und freundliche Gruesse.',
};

const ENGLISH_READING_TEXTS: Record<string, string> = {
  Introductions: 'Sam is new in class. He says his name, his country, and the language he wants to practise.',
  Numbers: 'The teacher reads phone numbers slowly. Students listen, repeat, and write each number in order.',
  Family: 'Mina shows a photo of her family. She names each person and says one simple detail.',
  'Daily routine': 'A short routine helps learners speak clearly about mornings, work, study, and sleep.',
  Food: 'At a small cafe, the learner orders food politely and checks the menu before paying.',
  City: 'The learner asks for the station and follows short directions through the city.',
  Home: 'The room has a bed, a table, and a chair. The learner describes where each thing is.',
  Shopping: 'Two jackets have different prices and sizes. The learner asks how much each one costs.',
  Weather: 'The weather report is simple: cold in the morning, windy later, and sunny in the afternoon.',
  Transport: 'The learner buys a ticket, checks the stop, and asks what time the bus leaves.',
  Health: 'At the clinic, the learner explains one symptom clearly and asks for simple advice.',
  Review: 'The review brings together questions, answers, listening, speaking, and short writing.',
  Plans: 'A friend suggests a plan for tomorrow. The learner says what they want to do and when.',
  Appointments: 'The learner calls an office, asks for a time, and confirms the appointment politely.',
  Travel: 'A short travel story explains where the learner went, what they saw, and when they came back.',
  Work: 'The work day includes emails, a meeting, a task, and a short break.',
  'Digital life': 'The learner follows simple screen instructions and sends a message from a phone.',
  Services: 'At a public office, the learner asks for a form and checks the address and signature.',
  Comparisons: 'Two options are useful in different ways. The learner compares price, size, and speed.',
  Stories: 'A simple story has a beginning, a problem, and a clear ending.',
  Rules: 'The notice explains what people must do and what they cannot do in the room.',
  Opinions: 'The learner gives a simple opinion and adds one clear reason with because.',
  Emails: 'A polite email has a greeting, a short request, a thank you, and a closing line.',
};

const GERMAN_READING_TEXTS: Record<string, string> = {
  Vorstellungen: 'Sam ist neu im Kurs. Er sagt seinen Namen, seine Herkunft und welche Sprache er ueben moechte.',
  Zahlen: 'Die Lehrerin liest Telefonnummern langsam vor. Die Lernenden hoeren zu, wiederholen und schreiben die Zahlen in der richtigen Reihenfolge.',
  Familie: 'Mina zeigt ein Foto von ihrer Familie. Sie nennt jede Person und sagt ein einfaches Detail.',
  Tagesroutine: 'Eine kurze Routine hilft Lernenden, klar ueber Morgen, Arbeit, Lernen und Schlaf zu sprechen.',
  Essen: 'In einem kleinen Cafe bestellt der Lerner hoeflich Essen und schaut vor dem Bezahlen in die Speisekarte.',
  Stadt: 'Der Lerner fragt nach dem Bahnhof und folgt kurzen Wegbeschreibungen in der Stadt.',
  Zuhause: 'Im Zimmer gibt es ein Bett, einen Tisch und einen Stuhl. Der Lerner beschreibt, wo die Dinge stehen.',
  Einkaufen: 'Zwei Jacken haben verschiedene Preise und Groessen. Der Lerner fragt, wie viel sie kosten.',
  Wetter: 'Der Wetterbericht ist einfach: morgens kalt, spaeter windig und am Nachmittag sonnig.',
  Transport: 'Der Lerner kauft eine Fahrkarte, prueft die Haltestelle und fragt, wann der Bus faehrt.',
  Gesundheit: 'In der Praxis beschreibt der Lerner eine Beschwerde klar und bittet um einfachen Rat.',
  Wiederholung: 'Die Wiederholung verbindet Fragen, Antworten, Hoeren, Sprechen und kurzes Schreiben.',
  Plaene: 'Ein Freund schlaegt einen Plan fuer morgen vor. Der Lerner sagt, was er machen moechte und wann.',
  Termine: 'Der Lerner ruft in einem Buero an, fragt nach einer Uhrzeit und bestaetigt den Termin hoeflich.',
  Reisen: 'Eine kurze Reisegeschichte erklaert, wohin der Lerner gefahren ist, was er gesehen hat und wann er zurueckgekommen ist.',
  Arbeit: 'Der Arbeitstag enthaelt E-Mails, eine Besprechung, eine Aufgabe und eine kurze Pause.',
  'Digitales Leben': 'Der Lerner folgt einfachen Anweisungen auf dem Bildschirm und schickt eine Nachricht vom Handy.',
  Aemter: 'Auf dem Amt fragt der Lerner nach einem Formular und prueft Adresse und Unterschrift.',
  Vergleiche: 'Zwei Moeglichkeiten sind auf verschiedene Weise nuetzlich. Der Lerner vergleicht Preis, Groesse und Tempo.',
  Geschichten: 'Eine einfache Geschichte hat einen Anfang, ein Problem und ein klares Ende.',
  Regeln: 'Der Hinweis erklaert, was man tun muss und was man im Raum nicht tun darf.',
  Meinungen: 'Der Lerner sagt eine einfache Meinung und nennt mit weil einen klaren Grund.',
  'E-Mails': 'Eine hoefliche E-Mail hat eine Anrede, eine kurze Bitte, einen Dank und eine Schlusszeile.',
};

const GERMAN_GLOSSES: Record<string, string> = {
  hello: 'hallo', name: 'Name', from: 'aus/von', country: 'Land', language: 'Sprache', teacher: 'Lehrer/Lehrerin',
  one: 'eins', two: 'zwei', three: 'drei', age: 'Alter', phone: 'Telefon/Handy', number: 'Nummer',
  mother: 'Mutter', father: 'Vater', sister: 'Schwester', brother: 'Bruder', child: 'Kind', family: 'Familie',
  wake: 'aufstehen', eat: 'essen', go: 'gehen', study: 'lernen', work: 'arbeiten', sleep: 'schlafen',
  water: 'Wasser', coffee: 'Kaffee', bread: 'Brot', rice: 'Reis', apple: 'Apfel', menu: 'Speisekarte',
  street: 'Strasse', station: 'Bahnhof', bank: 'Bank', school: 'Schule', shop: 'Laden', park: 'Park',
  room: 'Zimmer', table: 'Tisch', chair: 'Stuhl', door: 'Tuer', window: 'Fenster', bed: 'Bett',
  price: 'Preis', cheap: 'guenstig', expensive: 'teuer', size: 'Groesse', cash: 'bar', card: 'Karte',
  sunny: 'sonnig', rainy: 'regnerisch', cold: 'kalt', hot: 'heiss', windy: 'windig', cloudy: 'bewoelkt',
  ticket: 'Fahrkarte', bus: 'Bus', train: 'Zug', late: 'spaet', early: 'frueh', stop: 'Haltestelle',
  head: 'Kopf', stomach: 'Bauch', pain: 'Schmerz', tired: 'muede', doctor: 'Arzt/Aerztin', medicine: 'Medizin',
  review: 'Wiederholung', question: 'Frage', answer: 'Antwort', listen: 'hoeren', speak: 'sprechen', write: 'schreiben',
  tomorrow: 'morgen', plan: 'Plan', visit: 'besuchen', meet: 'treffen', call: 'anrufen', later: 'spaeter',
  monday: 'Montag', tuesday: 'Dienstag', time: 'Uhrzeit', appointment: 'Termin', free: 'frei', busy: 'besetzt',
  travel: 'Reise', hotel: 'Hotel', map: 'Karte', arrive: 'ankommen', leave: 'abfahren',
  job: 'Beruf', office: 'Buero', meeting: 'Besprechung', email: 'E-Mail', task: 'Aufgabe', break: 'Pause',
  screen: 'Bildschirm', password: 'Passwort', message: 'Nachricht', online: 'online', app: 'App',
  form: 'Formular', address: 'Adresse', help: 'Hilfe', document: 'Unterlage', signature: 'Unterschrift',
  better: 'besser', cheaper: 'guenstiger', faster: 'schneller', slower: 'langsamer', bigger: 'groesser', smaller: 'kleiner',
  went: 'gegangen', saw: 'gesehen', bought: 'gekauft', found: 'gefunden', lost: 'verloren', came: 'gekommen',
  must: 'muessen', can: 'koennen', rule: 'Regel', allowed: 'erlaubt', quiet: 'leise', safe: 'sicher',
  think: 'denken', because: 'weil', favorite: 'Lieblings-', opinion: 'Meinung', reason: 'Grund', agree: 'zustimmen',
  dear: 'Sehr geehrte/lieber', thanks: 'danke', reply: 'Antwort', request: 'Bitte', regards: 'Gruesse', checkpoint: 'Kontrollpunkt', progress: 'Fortschritt', practice: 'Uebung', mistake: 'Fehler', ready: 'bereit',
};

const ENGLISH_GLOSSES: Record<string, string> = {
  hallo: 'hello', name: 'name', kommen: 'come', land: 'country', sprache: 'language', kurs: 'course',
  eins: 'one', zwei: 'two', drei: 'three', alter: 'age', telefon: 'telephone', nummer: 'number',
  mutter: 'mother', vater: 'father', schwester: 'sister', bruder: 'brother', kind: 'child', familie: 'family',
  aufstehen: 'get up', essen: 'eat', gehen: 'go', lernen: 'study/learn', arbeiten: 'work', schlafen: 'sleep',
  wasser: 'water', kaffee: 'coffee', brot: 'bread', reis: 'rice', apfel: 'apple', speisekarte: 'menu',
  strasse: 'street', bahnhof: 'station', bank: 'bank', schule: 'school', laden: 'shop', park: 'park',
  zimmer: 'room', tisch: 'table', stuhl: 'chair', tuer: 'door', fenster: 'window', bett: 'bed',
  preis: 'price', billig: 'cheap', teuer: 'expensive', groesse: 'size', bar: 'cash', karte: 'card/map',
  sonnig: 'sunny', regnerisch: 'rainy', kalt: 'cold', warm: 'warm', windig: 'windy', bewoelkt: 'cloudy',
  fahrkarte: 'ticket', bus: 'bus', zug: 'train', spaet: 'late', frueh: 'early', haltestelle: 'stop',
  kopf: 'head', bauch: 'stomach', schmerz: 'pain', muede: 'tired', arzt: 'doctor', medizin: 'medicine',
  wiederholung: 'review', frage: 'question', antwort: 'answer', hoeren: 'listen', sprechen: 'speak', schreiben: 'write',
  morgen: 'tomorrow/morning', plan: 'plan', besuchen: 'visit', treffen: 'meet', anrufen: 'call', spaeter: 'later',
  montag: 'Monday', dienstag: 'Tuesday', uhrzeit: 'time', termin: 'appointment', frei: 'free', besetzt: 'busy',
  reise: 'trip', hotel: 'hotel', ankommen: 'arrive', abfahren: 'depart', beruf: 'job', buero: 'office',
  besprechung: 'meeting', 'e-mail': 'email', aufgabe: 'task', pause: 'break', handy: 'mobile phone', bildschirm: 'screen', passwort: 'password', nachricht: 'message', online: 'online', app: 'app',
  formular: 'form', adresse: 'address', amt: 'public office', hilfe: 'help', unterlage: 'document', unterschrift: 'signature',
  besser: 'better', guenstiger: 'cheaper', schneller: 'faster', langsamer: 'slower', groesser: 'bigger', kleiner: 'smaller',
  gegangen: 'went', gesehen: 'saw', gekauft: 'bought', gefunden: 'found', verloren: 'lost', gekommen: 'came',
  muessen: 'must', duerfen: 'may/be allowed to', regel: 'rule', erlaubt: 'allowed', leise: 'quiet', sicher: 'safe',
  denken: 'think', weil: 'because', lieblings: 'favorite', meinung: 'opinion', grund: 'reason', zustimmen: 'agree',
  danke: 'thanks', bitte: 'please/request', pruefung: 'test', fortschritt: 'progress', uebung: 'practice', fehler: 'mistake', bereit: 'ready', grueße: 'regards', gruesse: 'regards',
};

const ENGLISH_A1_1: LessonSeed[] = [
  englishSeed('Introductions', 'give basic personal information', 'I can say my name, country, and language.', 'be, subject pronouns, simple questions', ['hello', 'name', 'from', 'country', 'language', 'teacher'], ['My name is', 'I am from'], 'word stress'),
  englishSeed('Numbers', 'understand numbers and short forms', 'I can give phone numbers and ages.', 'numbers, plural nouns', ['one', 'two', 'three', 'age', 'phone', 'number'], ['How old are you?', 'My number is'], 'th'),
  englishSeed('Family', 'name close family members', 'I can describe my family simply.', 'possessive adjectives', ['mother', 'father', 'sister', 'brother', 'child', 'family'], ['This is my', 'I have one'], 'v/w distinction'),
  englishSeed('Daily routine', 'talk about simple daily actions', 'I can describe a normal morning.', 'present simple I/you/we', ['wake', 'eat', 'go', 'study', 'work', 'sleep'], ['every day', 'in the morning'], 'schwa'),
  englishSeed('Food', 'order simple food and drink', 'I can ask for food politely.', 'a/an, countable nouns', ['water', 'coffee', 'bread', 'rice', 'apple', 'menu'], ['I would like', 'Can I have'], 'sentence stress'),
  englishSeed('City', 'ask for places in town', 'I can ask where a place is.', 'there is, where questions', ['street', 'station', 'bank', 'school', 'shop', 'park'], ['Where is', 'near here'], 'connected speech'),
  englishSeed('Home', 'describe rooms and objects', 'I can say what is in my home.', 'prepositions of place', ['room', 'table', 'chair', 'door', 'window', 'bed'], ['next to', 'on the left'], 'contractions'),
  englishSeed('Shopping', 'buy simple items', 'I can ask prices and sizes.', 'this/that, demonstratives', ['price', 'cheap', 'expensive', 'size', 'cash', 'card'], ['How much is', 'I need'], 'word stress'),
  englishSeed('Weather', 'describe basic weather', "I can talk about today's weather.", 'it is, adjectives', ['sunny', 'rainy', 'cold', 'hot', 'windy', 'cloudy'], ['It is sunny', 'Today is'], 'schwa'),
  englishSeed('Transport', 'buy a ticket and ask times', 'I can ask for basic travel information.', 'time expressions', ['ticket', 'bus', 'train', 'late', 'early', 'stop'], ['What time', 'a ticket to'], 'th'),
  englishSeed('Health', 'describe simple symptoms', 'I can say what hurts.', 'have got, body words', ['head', 'stomach', 'pain', 'tired', 'doctor', 'medicine'], ['I have a', 'I feel'], 'v/w distinction'),
  englishSeed('Review', 'combine A1.1 survival language', 'I can complete short everyday exchanges.', 'A1.1 review', ['review', 'question', 'answer', 'listen', 'speak', 'write'], ['Can you repeat?', 'I understand'], 'sentence stress'),
];

const ENGLISH_A1_2: LessonSeed[] = [
  englishSeed('Plans', 'make simple plans', 'I can say what I want to do tomorrow.', 'want to, future time', ['tomorrow', 'plan', 'visit', 'meet', 'call', 'later'], ['I want to', 'see you later'], 'connected speech'),
  englishSeed('Appointments', 'arrange times and days', 'I can make a simple appointment.', 'days, at/on', ['Monday', 'Tuesday', 'time', 'appointment', 'free', 'busy'], ['Are you free?', 'at three'], 'word stress'),
  englishSeed('Travel', 'describe simple trips', 'I can explain where I went.', 'past simple regular verbs', ['travel', 'hotel', 'map', 'ticket', 'arrive', 'leave'], ['last weekend', 'I visited'], 'contractions'),
  englishSeed('Work', 'talk about jobs and tasks', 'I can describe my work day.', 'present simple he/she', ['job', 'office', 'meeting', 'email', 'task', 'break'], ['I work as', 'She works in'], 'schwa'),
  englishSeed('Digital life', 'use common online language', 'I can ask for help with a device.', 'imperatives', ['phone', 'screen', 'password', 'message', 'online', 'app'], ['click here', 'send a message'], 'connected speech'),
  englishSeed('Services', 'handle simple public services', 'I can ask for forms and help.', 'polite questions', ['form', 'address', 'office', 'help', 'document', 'signature'], ['Could you help?', 'I need a form'], 'th'),
  englishSeed('Comparisons', 'compare everyday options', 'I can compare two simple things.', 'comparatives', ['better', 'cheaper', 'faster', 'slower', 'bigger', 'smaller'], ['better than', 'not as'], 'v/w distinction'),
  englishSeed('Stories', 'tell a short past event', 'I can tell a simple story in order.', 'past simple irregular verbs', ['went', 'saw', 'bought', 'found', 'lost', 'came'], ['first then', 'after that'], 'sentence stress'),
  englishSeed('Rules', 'explain simple rules', 'I can say what is allowed.', 'must, can, cannot', ['must', 'can', 'rule', 'allowed', 'quiet', 'safe'], ['You must', 'You cannot'], 'contractions'),
  englishSeed('Opinions', 'give simple opinions and reasons', 'I can say what I like and why.', 'because, like + noun', ['think', 'because', 'favorite', 'opinion', 'reason', 'agree'], ['I think', 'because it is'], 'word stress'),
  englishSeed('Emails', 'write short practical emails', 'I can write a polite short message.', 'email openings and closings', ['dear', 'thanks', 'reply', 'request', 'question', 'regards'], ['Thank you for', 'Best regards'], 'connected speech'),
  englishSeed('Review', 'pass the A1.2 checkpoint', 'I can handle predictable everyday tasks.', 'A1 review', ['checkpoint', 'progress', 'practice', 'mistake', 'review', 'ready'], ['I can explain', 'I need more practice'], 'sentence stress'),
];

const GERMAN_A1_1: LessonSeed[] = [
  germanSeed('Vorstellungen', 'Namen, Herkunft und Sprache nennen', 'Ich kann mich kurz vorstellen.', 'sein, ich/du, einfache Fragen', ['hallo', 'Name', 'kommen', 'Land', 'Sprache', 'Kurs'], ['Ich heisse', 'Ich komme aus'], 'ich-Laut'),
  germanSeed('Zahlen', 'Zahlen und Telefonnummern verstehen', 'Ich kann Alter und Nummern sagen.', 'Zahlen, Pluralformen', ['eins', 'zwei', 'drei', 'Alter', 'Telefon', 'Nummer'], ['Wie alt bist du?', 'Meine Nummer ist'], 'z'),
  germanSeed('Familie', 'Familienmitglieder benennen', 'Ich kann meine Familie einfach beschreiben.', 'mein/meine, der/die/das', ['Mutter', 'Vater', 'Schwester', 'Bruder', 'Kind', 'Familie'], ['Das ist meine', 'Ich habe einen'], 'sch'),
  germanSeed('Tagesroutine', 'einfache Routinen beschreiben', 'Ich kann meinen Morgen beschreiben.', 'Verbposition 2, regelmaessige Verben', ['aufstehen', 'essen', 'gehen', 'lernen', 'arbeiten', 'schlafen'], ['jeden Morgen', 'ich gehe'], 'st'),
  germanSeed('Essen', 'einfach bestellen', 'Ich kann Essen und Trinken bestellen.', 'Akkusativ mit haben/moechte', ['Wasser', 'Kaffee', 'Brot', 'Reis', 'Apfel', 'Speisekarte'], ['Ich moechte', 'Ich nehme'], 'r'),
  germanSeed('Stadt', 'Orte in der Stadt finden', 'Ich kann nach einem Ort fragen.', 'wo, es gibt', ['Strasse', 'Bahnhof', 'Bank', 'Schule', 'Laden', 'Park'], ['Wo ist', 'in der Naehe'], 'sp'),
  germanSeed('Zuhause', 'Zimmer und Dinge beschreiben', 'Ich kann sagen, was in meiner Wohnung ist.', 'Dativ bei in/auf neben', ['Zimmer', 'Tisch', 'Stuhl', 'Tuer', 'Fenster', 'Bett'], ['neben dem', 'auf dem Tisch'], 'ue'),
  germanSeed('Einkaufen', 'Preise und Groessen erfragen', 'Ich kann einfache Einkaeufe machen.', 'dieser/diese/dieses', ['Preis', 'billig', 'teuer', 'Groesse', 'bar', 'Karte'], ['Wie viel kostet', 'Ich brauche'], 'oe'),
  germanSeed('Wetter', 'Wetter beschreiben', 'Ich kann ueber das Wetter sprechen.', 'es ist, Adjektive', ['sonnig', 'regnerisch', 'kalt', 'warm', 'windig', 'bewoelkt'], ['Es ist sonnig', 'Heute ist'], 'ae'),
  germanSeed('Transport', 'Fahrkarten und Zeiten erfragen', 'Ich kann einfache Reiseinfos erfragen.', 'Uhrzeiten, nach/zu', ['Fahrkarte', 'Bus', 'Zug', 'spaet', 'frueh', 'Haltestelle'], ['Wann faehrt', 'eine Fahrkarte nach'], 'ach-Laut'),
  germanSeed('Gesundheit', 'einfache Beschwerden nennen', 'Ich kann sagen, was weh tut.', 'haben, Koerperteile', ['Kopf', 'Bauch', 'Schmerz', 'muede', 'Arzt', 'Medizin'], ['Ich habe', 'Mir tut weh'], 'sentence stress'),
  germanSeed('Wiederholung', 'A1.1 Sprache kombinieren', 'Ich kann kurze Alltagssituationen loesen.', 'A1.1 Wiederholung', ['Wiederholung', 'Frage', 'Antwort', 'hoeren', 'sprechen', 'schreiben'], ['Bitte wiederholen', 'Ich verstehe'], 'sch'),
];

const GERMAN_A1_2: LessonSeed[] = [
  germanSeed('Plaene', 'einfache Plaene machen', 'Ich kann sagen, was ich morgen mache.', 'moechte, Zeitangaben', ['morgen', 'Plan', 'besuchen', 'treffen', 'anrufen', 'spaeter'], ['Ich moechte', 'bis spaeter'], 'ich-Laut'),
  germanSeed('Termine', 'Termine vereinbaren', 'Ich kann einen einfachen Termin machen.', 'am/um, Tage', ['Montag', 'Dienstag', 'Uhrzeit', 'Termin', 'frei', 'besetzt'], ['Haben Sie Zeit?', 'um drei Uhr'], 'r'),
  germanSeed('Reisen', 'kurze Reisen beschreiben', 'Ich kann sagen, wohin ich gefahren bin.', 'Perfekt mit sein/haben', ['Reise', 'Hotel', 'Karte', 'Fahrkarte', 'ankommen', 'abfahren'], ['am Wochenende', 'ich bin gefahren'], 'ach-Laut'),
  germanSeed('Arbeit', 'Berufe und Aufgaben nennen', 'Ich kann meinen Arbeitstag beschreiben.', 'trennbare Verben', ['Beruf', 'Buero', 'Besprechung', 'E-Mail', 'Aufgabe', 'Pause'], ['Ich arbeite als', 'Ich fange an'], 'sp'),
  germanSeed('Digitales Leben', 'ueber Handy und Internet sprechen', 'Ich kann um digitale Hilfe bitten.', 'Imperativ', ['Handy', 'Bildschirm', 'Passwort', 'Nachricht', 'online', 'App'], ['Klicken Sie hier', 'Schick mir'], 'st'),
  germanSeed('Aemter', 'Formulare und Unterlagen verstehen', 'Ich kann nach Unterlagen fragen.', 'hoefliche Fragen', ['Formular', 'Adresse', 'Amt', 'Hilfe', 'Unterlage', 'Unterschrift'], ['Koennen Sie helfen?', 'Ich brauche ein Formular'], 'ue'),
  germanSeed('Vergleiche', 'einfache Optionen vergleichen', 'Ich kann zwei Dinge vergleichen.', 'Komparativ', ['besser', 'guenstiger', 'schneller', 'langsamer', 'groesser', 'kleiner'], ['besser als', 'nicht so'], 'oe'),
  germanSeed('Geschichten', 'kurze Ereignisse erzaehlen', 'Ich kann eine einfache Geschichte ordnen.', 'Perfekt, Satzfolge', ['gegangen', 'gesehen', 'gekauft', 'gefunden', 'verloren', 'gekommen'], ['zuerst dann', 'danach'], 'ae'),
  germanSeed('Regeln', 'einfache Regeln erklaeren', 'Ich kann sagen, was erlaubt ist.', 'Modalverben muessen/duerfen', ['muessen', 'duerfen', 'Regel', 'erlaubt', 'leise', 'sicher'], ['Man muss', 'Man darf nicht'], 'sentence stress'),
  germanSeed('Meinungen', 'Meinungen und Gruende nennen', 'Ich kann sagen, was ich denke und warum.', 'weil-Saetze', ['denken', 'weil', 'Lieblings', 'Meinung', 'Grund', 'zustimmen'], ['Ich finde', 'weil es'], 'ich-Laut'),
  germanSeed('E-Mails', 'kurze praktische E-Mails schreiben', 'Ich kann eine kurze hoefliche Nachricht schreiben.', 'Anrede, Schlussformeln', ['Sehr geehrte', 'danke', 'Antwort', 'Bitte', 'Frage', 'Gruesse'], ['Vielen Dank fuer', 'Mit freundlichen Gruessen'], 'r'),
  germanSeed('Wiederholung', 'A1.2 pruefen und festigen', 'Ich kann vorhersehbare Alltagssituationen bewaeltigen.', 'A1 Wiederholung', ['Pruefung', 'Fortschritt', 'Uebung', 'Fehler', 'Wiederholung', 'bereit'], ['Ich kann erklaeren', 'Ich muss ueben'], 'sentence stress'),
];

export const CURRICULUM: CurriculumLevel[] = [
  buildLevel(1, 'English', ENGLISH_A1_1),
  buildLevel(2, 'English', ENGLISH_A1_2),
  buildLevel(1, 'German', GERMAN_A1_1),
  buildLevel(2, 'German', GERMAN_A1_2),
];

export function getCurriculumLevel(language: CurriculumLanguage, levelNumber: number) {
  return CURRICULUM.find((level) => level.language === language && level.levelNumber === levelNumber) ?? null;
}

export function getCurriculumLesson(language: CurriculumLanguage, lessonId: string) {
  return CURRICULUM.flatMap((level) => level.lessons).find((lesson) => lesson.language === language && lesson.id === lessonId) ?? null;
}

export function getLessonStatus(lesson: CurriculumLesson, previousLessonPassed: boolean, skillScores: SkillScores): LessonStatus {
  if (!previousLessonPassed && lesson.levelNumber > 1) {
    return 'locked';
  }

  const scores = Object.values(skillScores).filter((score): score is number => typeof score === 'number');
  if (scores.length === 0) {
    return 'available';
  }

  const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  const weakSkill = scores.some((score) => score < lesson.mastery.minSkillScore);
  if (average >= lesson.mastery.minOverallScore && !weakSkill) {
    return 'passed';
  }

  return weakSkill ? 'needs_review' : 'in_progress';
}

export function buildReviewQueueItems(lesson: CurriculumLesson, skillScores: SkillScores) {
  return Object.entries(skillScores)
    .filter(([, score]) => typeof score === 'number' && score < lesson.mastery.minSkillScore)
    .map(([skill, score]) => ({
      id: `${lesson.id}-${skill}-review`,
      lessonId: lesson.id,
      language: lesson.language,
      levelNumber: lesson.levelNumber,
      skill: skill as CurriculumSkill,
      score: score ?? 0,
      reason: `${skill.replace(/_/g, ' ')} is below the ${lesson.mastery.minSkillScore}% skill mastery floor.`,
    }));
}

function buildLevel(levelNumber: 1 | 2, language: CurriculumLanguage, seeds: LessonSeed[]): CurriculumLevel {
  const meta = CURRICULUM_LEVELS[levelNumber - 1];
  const lessons = seeds.map((seed, index) => buildLesson(language, meta.levelNumber, meta.cefrLevel, meta.cefrSubLevel, seed, index + 1));

  return {
    levelNumber,
    cefrLevel: meta.cefrLevel,
    cefrSubLevel: meta.cefrSubLevel,
    language,
    title: `${language} ${meta.label}`,
    lessons,
    levelExam: {
      id: `${language.toLowerCase()}-${meta.label.toLowerCase()}-level-exam`,
      type: 'lesson_test',
      skill: 'test',
      title: `${meta.label} Level Exam`,
      instruction: 'Complete mixed comprehension, speaking, writing, and dictation tasks before unlocking the next level.',
      content: { lessonIds: lessons.map((lesson) => lesson.id), sections: ['listening', 'reading', 'speaking', 'writing', 'dictation'] },
      scoringRubric: { taskCompletion: 25, grammar: 20, vocabulary: 20, comprehension: 20, accuracy: 15 },
      minScoreToPass: 75,
    },
  };
}

function buildLesson(
  language: CurriculumLanguage,
  levelNumber: number,
  cefrLevel: CefrBand,
  cefrSubLevel: CefrSubLevel,
  seed: LessonSeed,
  lessonNumber: number,
): CurriculumLesson {
  const baseId = `${language.toLowerCase()}-level-${levelNumber}-lesson-${lessonNumber}`;
  const vocabulary = seed.words.map((word, index) => ({
    word,
    translation: language === 'German' ? englishGloss(word) : germanGloss(word),
    example: language === 'German' ? `Ich uebe das Wort "${word}" in einem kurzen Satz.` : `I practise the word "${word}" in a short sentence.`,
    audioText: word,
  }));
  const chunks = seed.chunks.map((phrase) => ({
    phrase,
    meaning: language === 'German' ? 'useful classroom and everyday phrase' : 'useful everyday phrase',
    example: language === 'German' ? `${phrase} passt in eine kurze Alltagssituation.` : `${phrase} fits a short everyday situation.`,
  }));

  return {
    id: baseId,
    levelNumber,
    cefrLevel,
    cefrSubLevel,
    language,
    title: `${lessonNumber}. ${seed.theme}`,
    theme: seed.theme,
    objective: seed.objective,
    canDo: seed.canDo,
    grammarFocus: seed.grammarFocus,
    vocabulary,
    chunks,
    exercises: LESSON_JOURNEY.map((step) => buildExercise(baseId, seed, step, language)),
    mastery: {
      minOverallScore: 75,
      minSkillScore: 60,
      vocabularyRequired: 80,
    },
  };
}

function buildExercise(baseId: string, seed: LessonSeed, step: (typeof LESSON_JOURNEY)[number], language: CurriculumLanguage): CurriculumExercise {
  const rubric = getRubric(step.skill);
  return {
    id: `${baseId}-${step.order}-${step.defaultType}`,
    type: step.defaultType,
    skill: step.skill,
    title: step.title,
    instruction: getInstruction(step.skill, seed, language),
    content: {
      language,
      theme: seed.theme,
      prompt: seed.canDo,
      targetSentence: seed.targetSentence,
      readingText: seed.readingText,
      vocabulary: seed.words,
      chunks: seed.chunks,
      pronunciation: seed.pronunciation,
      grammarFocus: seed.grammarFocus,
    },
    correctAnswer: getCorrectAnswer(step.defaultType, seed),
    acceptableAnswers: step.skill === 'writing' || step.skill === 'speaking' ? seed.words.slice(0, 4) : undefined,
    scoringRubric: rubric,
    minScoreToPass: step.skill === 'test' ? 75 : 60,
  };
}

function getRubric(skill: CurriculumSkill): ScoringRubric {
  if (skill === 'writing') {
    return { taskCompletion: 25, grammar: 20, vocabulary: 20, coherence: 15, spelling: 10, cefrAppropriateness: 10 };
  }

  if (skill === 'speaking' || skill === 'conversation' || skill === 'pronunciation') {
    return { pronunciation: 30, fluency: 20, grammar: 15, vocabulary: 15, taskCompletion: 20 };
  }

  if (skill === 'dictation') {
    return { accuracy: 100 };
  }

  if (skill === 'reading' || skill === 'listening') {
    return { comprehension: 60, vocabulary: 20, taskCompletion: 20 };
  }

  return { taskCompletion: 40, grammar: 20, vocabulary: 20, accuracy: 20 };
}

function getInstruction(skill: CurriculumSkill, seed: LessonSeed, language: CurriculumLanguage) {
  if (language === 'German') return getGermanInstruction(skill, seed);

  const shared = `Lesson goal: ${seed.canDo}`;
  if (skill === 'dictation') return `Listen, then type the target sentence exactly. ${shared}`;
  if (skill === 'writing') return `Write your own short response using the lesson vocabulary. ${shared}`;
  if (skill === 'speaking') return `Answer aloud with a complete sentence and the target vocabulary. ${shared}`;
  if (skill === 'pronunciation') return `Repeat the model sentence and focus on: ${seed.pronunciation}.`;
  if (skill === 'reading') return `Read the short text, then choose the answer that best matches its meaning. ${shared}`;
  if (skill === 'listening') return `Listen for the target sentence, key details, and speaker intention. ${shared}`;
  return shared;
}

function getGermanInstruction(skill: CurriculumSkill, seed: LessonSeed) {
  const shared = `Lernziel: ${seed.canDo}`;
  if (skill === 'dictation') return `Hoere zu und tippe den Zielsatz genau ab. ${shared}`;
  if (skill === 'writing') return `Schreibe eine kurze eigene Antwort mit dem Wortschatz der Lektion. ${shared}`;
  if (skill === 'speaking') return `Antworte laut mit einem ganzen Satz und dem Zielwortschatz. ${shared}`;
  if (skill === 'pronunciation') return `Sprich den Modellsatz nach und achte auf: ${seed.pronunciation}.`;
  if (skill === 'reading') return `Lies den kurzen Text und waehle die Antwort, die am besten passt. ${shared}`;
  if (skill === 'listening') return `Hoere auf den Zielsatz, wichtige Details und die Absicht der sprechenden Person. ${shared}`;
  return shared;
}

function getCorrectAnswer(type: ExerciseType, seed: LessonSeed) {
  if (type === 'sentence_order') return seed.targetSentence;
  if (type === 'vocabulary_match') return seed.words.slice(0, 4);
  if (type === 'dictation_sentence') return seed.targetSentence;
  if (type === 'grammar_choice') return seed.grammarFocus;
  return undefined;
}

function englishSeed(theme: string, objective: string, canDo: string, grammarFocus: string, words: string[], chunks: string[], pronunciation: string): LessonSeed {
  return {
    theme,
    objective,
    canDo,
    grammarFocus,
    words,
    chunks,
    pronunciation,
    targetSentence: getEnglishTargetSentence(theme),
    readingText: getEnglishReadingText(theme),
  };
}

function germanSeed(theme: string, objective: string, canDo: string, grammarFocus: string, words: string[], chunks: string[], pronunciation: string): LessonSeed {
  return {
    theme,
    objective,
    canDo,
    grammarFocus,
    words,
    chunks,
    pronunciation,
    targetSentence: getGermanTargetSentence(theme),
    readingText: getGermanReadingText(theme),
  };
}

function germanGloss(word: string) {
  return GERMAN_GLOSSES[word.toLowerCase()] ?? `German: ${word}`;
}

function englishGloss(word: string) {
  return ENGLISH_GLOSSES[word.toLowerCase()] ?? `English: ${word}`;
}

function getEnglishTargetSentence(theme: string) {
  return ENGLISH_TARGET_SENTENCES[theme] ?? 'I can practise this lesson with clear words and short sentences.';
}

function getGermanTargetSentence(theme: string) {
  return GERMAN_TARGET_SENTENCES[theme] ?? 'Ich kann diese Lektion mit klaren Woertern und kurzen Saetzen ueben.';
}

function getEnglishReadingText(theme: string) {
  return ENGLISH_READING_TEXTS[theme] ?? getEnglishTargetSentence(theme);
}

function getGermanReadingText(theme: string) {
  return GERMAN_READING_TEXTS[theme] ?? getGermanTargetSentence(theme);
}

