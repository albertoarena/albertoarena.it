---
title: "Il bug comparso solo quando degli sconosciuti hanno potuto incollare uno schema"
date: "2026-08-24T10:00:00.000Z"
template: "post"
draft: false
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "Un visualizzatore di schema che leggeva sempre una connessione live al database si affidava, silenziosamente, al fatto che quella connessione fosse affidabile. Ecco cosa si è rotto, in silenzio, nel momento in cui l'input è diventato un file incollato da uno sconosciuto, e i tre controlli che lo intercettano."
socialImage: "/images/posts/the-bug-that-only-showed-up-with-pasted-schemas/cover.jpg"
coverAlt: "Un vetro di finestra frantumato da un singolo impatto, con crepe che si irradiano verso l'esterno contro un cielo blu e degli alberi"
lang: it
translationOf: the-bug-that-only-showed-up-with-pasted-schemas
series:
  slug: "truss"
  order: 5
discussion: "albertoarena/laravel-truss"
---

Mi veniva posta sempre la stessa domanda sul visualizzatore di schema che mantengo: "che aspetto ha sul *mio* schema?" La demo offriva solo un database di esempio da guardare, quindi la risposta onesta era "installa il package e puntalo al tuo". È un bel po' di attrito per chi vuole solo capire se lo strumento vale il suo tempo.

Così ho aggiunto una pagina che analizza un `mysqldump` incollato direttamente nel browser e lo disegna con la stessa dashboard che il package fornisce. Nessuna installazione, nessun upload, niente lascia la scheda del browser. Questa parte è stata facile da vendere. La parte che vale la pena raccontare è tutto quello che il codice aveva sempre dato per scontato senza controllarlo davvero, perché finché quella pagina non è esistita, ogni schema che avesse mai disegnato proveniva da una connessione al database configurata dalla stessa persona che lo eseguiva.

Una connection string è una piccola decisione di fiducia facile da dimenticare di aver preso. L'hai digitata tu, o l'ha fatto una variabile d'ambiente, e in entrambi i casi qualcosa che controllavi l'ha messa lì. Un file incollato non ha questa storia. Potrebbe essere l'export di un collega, i dati di esempio di un tutorial, o novecento righe di DDL MySQL di qualcuno che non hai mai incontrato. Stesso parser, stesso renderer, stesso percorso di codice, ma un insieme di cose che ora gli è permesso dare per scontate completamente diverso.

## Prima assunzione: i nomi sono solo stringhe

La dashboard costruisce una definizione di diagramma scrivendoci dentro direttamente i nomi di tabelle e colonne. Va bene quando un nome proviene da `information_schema`, perché un database applica le proprie regole sugli identificatori prima che un nome possa esistere. Smette di andare bene nel momento in cui un nome può arrivare da qualsiasi posto: niente impedisce a un file incollato di chiamare una colonna con qualcosa che non è affatto un identificatore di database, ma un frammento di markup per qualunque cosa stia renderizzando il diagramma.

Letta da una connessione live, quella stringa era già stata validata da qualcos'altro prima di raggiungere questo codice. Letta da un incollato, la validazione non era mai avvenuta, e il codice di rendering non aveva modo di accorgersi della differenza perché non l'aveva mai controllata. La correzione non è stata ingegnosa: ogni identificatore viene ora ridotto a ciò che il formato del diagramma accetta realmente prima di essere scritto da qualche parte, in modo coerente, su ogni riferimento a quel nome. Ma vale la pena soffermarsi su cosa ha reso possibile il bug fin dall'inizio: codice corretto, assunzione sbagliata. Scrivere quella stringa non è mai stato l'errore. L'errore era credere che ogni stringa che arrivava lì fosse già passata attraverso un controllo che in realtà non aveva mai attraversato.

## Seconda assunzione: un caso non gestito può restare silenzioso

Un dump di schema non è un'unica grammatica, è qualunque cosa lo strumento che l'ha prodotto abbia deciso di scrivere, e questo varia più di quanto ci si aspetterebbe: identificatori tra backtick oppure no, un `CREATE INDEX` come istruzione a sé o ripiegato dentro la definizione della tabella, chiavi esterne aggiunte dopo con `ALTER TABLE` invece che dichiarate inline. Un parser che gestisce solo le forme comuni prima o poi incontrerà una riga che non riconosce, e la domanda è cosa succede dopo.

La risposta allettante è: saltala e vai avanti, il diagramma comunque funziona per lo più. È la risposta sbagliata per una pagina il cui unico compito è mostrare a qualcuno la sua struttura reale. Un singolo vincolo scartato non fa sembrare il diagramma rotto. Lo fa sembrare *completo e sbagliato*, il che è peggio, perché niente nell'output dice al lettore di dubitarne. Quindi ogni istruzione ottiene ora uno di tre esiti, e tutti e tre sono visibili: analizzata e disegnata, deliberatamente saltata e conteggiata, oppure segnalata con il numero di riga che l'ha prodotta. Una riga di riepilogo riporta subito la seconda e la terza categoria, non sepolta in un pannello di dettagli che nessuno apre. Se dieci tabelle provenivano da un database reale e il diagramma ne mostra nove, il silenzio è il bug. Dirlo è la correzione.

## Terza assunzione: una relazione non dichiarata non è una relazione reale

Truss ha altrove una modalità di inferenza che indovina le relazioni dalle convenzioni di naming, `user_id` probabilmente punta a `users` anche senza una chiave esterna dichiarata. È una funzionalità genuinamente utile quando l'hai attivata di proposito e puoi controllare a occhio il risultato contro uno schema che conosci. È un cattivo default per una pagina il cui output è la prima e unica cosa che uno sconosciuto vede. Un collegamento indovinato ma sbagliato non si legge come un'ipotesi. Si legge come lo strumento che ti dice qualcosa di falso sul tuo stesso database, senza alcuna indicazione che fosse mai stato incerto.

Quindi il parser degli incollati disegna solo ciò che è esplicitamente dichiarato, un vincolo `FOREIGN KEY` oppure niente. Una colonna con un nome identico a una convenzione da chiave esterna, ma senza un vincolo dietro, non produce alcun collegamento. È una funzionalità più ristretta della modalità di inferenza altrove nello stesso package, di proposito: la precisione conta più della completezza quando il lettore non ha modo di verificare in autonomia il tuo lavoro.

## Il bug nascosto dietro un test che passava

Un ultimo caso, perché non riguarda affatto l'input non fidato e me lo sarei perso senza un tipo diverso di controllo. Rivedendo la pagina prima della pubblicazione, ogni click riportava al repo GitHub del progetto, indipendentemente da quale parte della pagina cliccassi. La causa era un tag di chiusura `</a>` mancante, diverse righe più sopra, che aveva annidato tutto il resto della shell dentro un unico link.

I test esistenti per quella pagina confrontavano stringhe con espressioni regolari. Una regex non ha alcun concetto di "questo tag è ancora aperto dieci righe dopo". Vedeva l'apertura `<a>`, vedeva un pezzo plausibile di markup subito dopo, e passava, allo stesso modo in cui sarebbe passata se quel tag fosse stato chiuso correttamente tre righe più sotto invece che mai. Ciò che alla fine ha scovato il bug è stato un controllo strutturale, uno che analizza davvero l'HTML e conferma che ogni tag che si apre si chiude anche, e il self-test di cui quel controllo aveva bisogno era lo stesso markup rotto rifornito apposta al controllo stesso.

La lezione va oltre l'HTML: un test che confronta pattern di testo verifica che certe sottostringhe esistano, non che la cosa che hai pubblicato abbia davvero la forma che credi. Non sono la stessa garanzia, e il divario tra le due è esattamente dove una suite di test resta verde mentre una pagina si rompe in silenzio.

## Solo struttura resta vero, di proposito

Niente di tutto questo ha cambiato ciò che lo strumento promette: solo struttura, mai i dati. Ogni istruzione `INSERT` in un dump incollato viene conteggiata e scartata, non letta, e quel conteggio viene riportato così la promessa è qualcosa che puoi osservare invece che qualcosa che devi prendere per fede. Il parsing stesso gira interamente nel codice della pagina, il risultato raggiunge la dashboard tramite un blob URL in memoria, e l'unica cosa scritta in `sessionStorage` serve a sopravvivere a un ricaricamento della pagina e viene eliminata nel momento stesso in cui viene letta. Niente viene caricato su un server, perché non c'è nessun posto su un server dove andrebbe a finire.

Quella promessa non è mai stata la parte difficile. La parte difficile è stata accorgersi di quante altre cose il codice si fidasse silenziosamente, nel momento in cui "la tua connessione al database" ha smesso di essere l'unico modo in cui i dati potevano arrivare.

---

[Truss](https://github.com/albertoarena/laravel-truss) è il visualizzatore di schema Laravel che mantengo. Puoi provarlo sul tuo schema, senza installare nulla, su [trussphp.com/demo/your-schema](https://trussphp.com/demo/your-schema/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=the-bug-that-only-showed-up-with-pasted-schemas). Solo struttura, mai i dati.
