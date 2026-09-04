---
title: "Lo schema Laravel che nessuno ha scelto"
date: "2026-08-28T10:00:00.000Z"
template: "post"
draft: false
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Database"
  - "Open Source"
description: "Un censimento strutturale di quindici codebase Laravel reali: che aspetto hanno i loro schemi, quanto sono connessi, e quanto di tutto questo non è mai stato davvero una scelta."
socialImage: "/images/posts/the-laravel-schema-nobody-chose/cover.jpg"
coverAlt: "File di cassetti di legno etichettati in un vecchio schedario di biblioteca, visti da un'angolazione"
lang: it
translationOf: the-laravel-schema-nobody-chose
series:
  slug: "truss"
  order: 6
discussion: "albertoarena/laravel-truss"
---

Quindici applicazioni Laravel reali, ognuna delle quali una codebase che puoi andare a leggere. 811 tabelle. Un unico database MySQL 8.0 fissato, solo migrazioni, nessun seed. Ogni applicazione installata da un clone pulito e migrata prima che una sola tabella venisse letta.

Questa non è una recensione di quei quindici progetti. È un censimento: uno sguardo a come appare davvero uno schema Laravel una volta che un'applicazione è stata rilasciata ed è cresciuta oltre lo stadio da tutorial. Durante la lettura sono emersi alcuni problemi reali, e ciascuno di essi verrà comunicato privatamente al progetto che lo possiede prima che se ne scriva qui qualcosa. Quello che resta, una volta messi da parte, è comunque più interessante. Questi progetti condividono convenzioni che non hanno mai discusso, perché il framework o l'ecosistema attorno ad esso ha scelto per primo.

Dietro questo articolo ci sono due letture distinte, che coprono insiemi diversi, e le tengo separate per tutto il testo. I conteggi delle relazioni coprono tutte e quindici le applicazioni. I controlli strutturali sono più lenti, e alcune di queste applicazioni non riuscivano a eseguire lo strumento al momento della lettura, quindi coprono un insieme più piccolo: dodici database e 482 tabelle, di cui sette sono applicazioni reali e cinque sono installazioni Laravel di base tenute come controllo. Ovunque compaia un numero qui sotto, viene indicato da quale delle due letture proviene.

## Una tabella che nessuno ha scritto di proposito

Sei tabelle in quattro di questi progetti non hanno alcuna chiave primaria. In Bagisto ce ne sono tre, `password_resets`, `admin_password_resets` e `customer_password_resets`. Firefly III e Koel ne hanno una ciascuno con il primo di questi nomi. Twill ne ha una con il proprio prefisso. Tutte e sei condividono la stessa forma:

```sql
email        varchar(255) NOT NULL,
token        varchar(255) NOT NULL,
created_at   timestamp NULL,
KEY (email)  -- and nothing declared PRIMARY
```

Questa forma non è un errore commesso da nessuno di questi quattro progetti. È il vecchio scaffold di Laravel stesso, quello che ogni progetto generava di default per anni. Laravel nel frattempo l'ha sostituito: un'installazione Laravel 13 attuale include una tabella chiamata `password_reset_tokens`, con la colonna email come vera chiave primaria.

Twill è la prova più chiara di cosa sia successo qui. A un certo punto ha rinominato la propria copia in `twill_password_resets`, un nome proprio nella propria migrazione, ma ha comunque mantenuto il vecchio design senza chiave. Nessuno si è seduto a decidere che una tabella di reset password non dovesse avere una chiave primaria. Un generatore del framework ha preso quella decisione anni fa, e da allora è stata trasportata avanti da progetti che non avevano motivo di rivederla.

Leggetela con attenzione: dice qualcosa su come si propaga lo scaffolding di Laravel, non sulla trascuratezza di nessuno dei quattro progetti che la portano ancora.

## Quanto è connesso davvero uno schema reale

Il risultato più forte di questo censimento non è arrivato affatto dalle regole strutturali. È arrivato da una domanda molto più semplice, posta a tutte e quindici le applicazioni: di tutte le tabelle in uno schema, quante si trovano effettivamente in almeno una relazione di chiave esterna con un'altra tabella?

| App | Tabelle | Chiavi esterne | Tabelle in una relazione |
|---|---:|---:|---:|
| [Bagisto](https://github.com/bagisto/bagisto) | 146 | 185 | 87% |
| [Monica](https://github.com/monicahq/monica) | 100 | 138 | 86% |
| [Lunar](https://github.com/lunarphp/lunar) | 75 | 82 | 85% |
| [Firefly III](https://github.com/firefly-iii/firefly-iii) | 81 | 114 | 79% |
| [Koel](https://github.com/koel/koel) | 40 | 42 | 75% |
| [Pterodactyl](https://github.com/pterodactyl/panel) | 35 | 35 | 74% |
| [InvoiceShelf](https://github.com/InvoiceShelf/InvoiceShelf) | 49 | 79 | 69% |
| [Lychee](https://github.com/LycheeOrg/Lychee) | 52 | 55 | 67% |
| [Azuriom](https://github.com/Azuriom/Azuriom) | 28 | 22 | 64% |
| [Twill](https://github.com/area17/twill) | 24 | 4 | 33% |
| [Cachet](https://github.com/cachethq/cachet) | 32 | 3 | 16% |
| [BookStack](https://github.com/BookStackApp/BookStack) | 41 | 4 | 12% |
| [Snipe-IT](https://github.com/snipe/snipe-it) | 58 | 1 | 3% |
| [October CMS](https://github.com/octobercms/october) | 41 | 0 | 0% |

[Statamic](https://github.com/statamic/cms) è la quindicesima ed è esclusa da questa tabella, per una ragione che ha una propria sezione più sotto.

Guardate in fondo a quella lista. Snipe-IT è un asset manager maturo con 58 tabelle tenute insieme da esattamente una chiave esterna. October CMS ha 41 tabelle e nessuna: i suoi moduli principali portano 35 dichiarazioni di relazione in puro PHP, `belongsTo`, `hasMany`, `morphTo`, il solito vocabolario di Eloquent, e nemmeno una riga fuori da `vendor/` chiama mai `->foreign()`. Le relazioni sono reali. Il database non ne applica nessuna.

Detto altrimenti: metà di questo corpus disegnerebbe un diagramma ER (ERD) con quasi nessuna linea, non perché le relazioni manchino, ma perché vivono in un posto che un diagramma non può vedere.

Non è un difetto di nessuno in questa lista. È una biforcazione reale in come vengono costruite le applicazioni Laravel, che sta lì in piena vista, e a cui nessuno aveva mai dato un numero prima. Metà di questo corpus si appoggia al database per tenere insieme le proprie relazioni. L'altra metà le mantiene tutte nel codice applicativo e non chiede nulla allo schema. Entrambi sono software funzionante. Sono solo costruiti su due assunzioni diverse su cosa serva un database.

## La portabilità ha un costo, ed è la chiave esterna

Parte di questa divisione ha una spiegazione semplice. Diversi di questi progetti distribuiscono migrazioni pensate per funzionare su più di un motore di database, MySQL, PostgreSQL e SQLite allo stesso modo. Questa scelta ha un costo diretto e visibile nello schema, e la chiave esterna è la principale vittima.

Cachet è l'esempio più chiaro: 32 tabelle, e 3 chiavi esterne tra loro. Il suo schema è pieno di colonne chiaramente pensate per fare riferimento a un'altra tabella, con naming `_id`, il tipo giusto, posizionate proprio accanto alla tabella a cui puntano, e nessun vincolo dichiarato. Una chiamata a `->foreign()` è legata alla sintassi dei vincoli di un motore specifico in un modo in cui una semplice colonna intera non lo è, quindi uno schema pensato per funzionare ovunque rinuncia al vincolo per mantenere quella promessa.

Vale la pena tenerlo a mente prima di leggere il fondo della tabella come un segnale di qualità. Un progetto self-hostable che deve funzionare su qualunque motore qualcuno abbia a disposizione è sotto un vincolo che un'applicazione privata, costruita per un solo motore fin dal primo giorno, non affronta mai.

## Cosa aggiunge uno starter kit, e cosa non fa un CMS a file piatti

Due risultati qui non sono sorprese, ed entrambi vale la pena affermarli chiaramente, perché escludono alcune possibilità.

Il primo riguarda gli starter kit. La lettura strutturale ha incluso uno scheletro Laravel nudo come controllo, migrato senza nient'altro installato, e tre dei modi comuni in cui un progetto viene avviato sopra di esso. Breeze e Filament sono entrambi atterrati esattamente su 9 tabelle, lo stesso numero del controllo nudo, senza nulla segnalato in nessuno dei due. Jetstream aggiunge altre cinque tabelle per il supporto ai team e torna comunque senza nulla segnalato con il profilo predefinito. Quindi lo schema con cui parte un progetto Laravel appena creato non dipende davvero da quale di questi venga scelto. Vale la pena saperlo prima di dare per scontato che un problema di schema in un progetto giovane derivi dalla scelta dello starter kit, perché quasi certamente non è così.

Il secondo è Statamic, ed è per questo che è esclusa dalla tabella sopra. Statamic ha ottenuto esattamente lo stesso risultato del controllo nudo: 9 tabelle, nulla segnalato. Questo è il risultato atteso piuttosto che sorprendente, ed è facile dimenticarlo mentre si legge una colonna di percentuali. Statamic è un CMS a file piatti. Il contenuto vive nei file, non nelle righe. Il suo database esiste solo per le parti di Laravel che ne hanno bisogno, sessioni, cache, il solito scaffolding. Classificarlo in base a quanto è connesso il suo schema non direbbe nulla, perché non ha tabelle applicative da connettere.

## Cosa mostra questo censimento, e cosa non mostra

Ogni codebase qui pubblica il proprio codice sorgente, ma non è la licenza a creare il bias, e vale la pena essere precisi su questo. Dodici di queste quindici sono MIT, AGPL o GPL. Tre sono prodotti commerciali che si trovano a distribuire codice sorgente leggibile: Cachet, October CMS e Statamic. Ciò che tutte e quindici condividono davvero è un modello di distribuzione. Vengono distribuite su infrastrutture che non controllano, quindi le loro migrazioni devono funzionare su qualunque motore abbia a disposizione chi le installa.

Questa è la pressione che sopprime le chiavi esterne, e grava allo stesso modo sulle tre commerciali come sulle altre dodici. Un'applicazione privata, costruita per un solo motore fin dal primo giorno e distribuita solo dal team che l'ha scritta, non ne è soggetta e di conseguenza apparirà molto più connessa. È una popolazione diversa, e questo censimento non può vederla.

Un'applicazione che avrebbe dovuto far parte di questo insieme non ha mai finito il processo. Le migrazioni di Coolify si fermano a metà su MySQL: il nome di un indice risolve a 72 caratteri, oltre il limite di 64 di MySQL. Non è un difetto di Coolify. È un'applicazione pensata prima di tutto per PostgreSQL che si comporta esattamente come tale, su un motore per cui non è mai stata progettata, e non poteva essere salvata cambiando motore, perché un unico MySQL fissato è la prima regola di questo setup.

## Lo strumento, in breve

Ogni schema qui è stato letto con [`truss:doctor`](https://trussphp.com/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=schema-census), un controllo strutturale che ho costruito dentro Laravel Truss. È la ragione per cui questo censimento è stato possibile: è ciò che ha trasformato centinaia di tabelle su quindici database in qualcosa che una sola persona potesse effettivamente leggere in un tempo ragionevole. Solo struttura, mai i dati.

Non è il soggetto di questo articolo, e qualunque problema reale emerso lungo il percorso viene comunicato al progetto che lo possiede prima di andare ovunque in pubblico. Non è una promessa fatta solo qui: la [lista delle applicazioni contro cui è stato eseguito](https://trussphp.com/reference/tested-applications/?utm_source=albertoarena.it&utm_medium=referral&utm_campaign=schema-census) dice la stessa cosa, e deliberatamente non pubblica alcun risultato.

Ciò che è pubblico è la parte che non è colpa di nessuno. Molto di ciò che sembra una decisione di schema in un'applicazione Laravel matura non è mai stato davvero deciso da quell'applicazione.
