---
title: "Il dottore dello schema è in ambulatorio"
date: "2026-07-31T10:00:00.000Z"
template: "post"
draft: false
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "Laravel Truss 1.5 aggiunge truss:doctor: una revisione deterministica, basata solo sulla struttura, del tuo schema di database, tredici regole in profondità, che può far fallire la tua build CI."
socialImage: "/images/posts/the-schema-doctor-is-in/cover.jpg"
coverAlt: "Uno stetoscopio appoggiato su un quaderno scritto a mano accanto a una tastiera di laptop, in bianco e nero"
lang: it
translationOf: the-schema-doctor-is-in
series:
  slug: "truss"
  order: 2
discussion: "albertoarena/laravel-truss"
---

Una migration che aggiunge una colonna `user_id` senza un indice a supporto passa la review ogni volta. Sembra tutto a posto. Laravel non si lamenta, la migration gira pulita, la CI è verde. Poi, qualche mese dopo, qualcuno fissa una JOIN che tocca duecento righe e impiega otto secondi, e nessuno ricorda più il perché.

Questa è la classe di problemi che [Truss](https://github.com/albertoarena/laravel-truss) 1.5 è pensato per intercettare prima che finisca in produzione: il dottore dello schema.

Ho scritto di [Truss](/posts/introducing-truss/it/) qui a luglio, un diagramma ER live e zoomabile dello schema reale del database della tua app Laravel. Da allora ha avuto più trazione di quanto mi aspettassi: si avvicina a 300 installazioni su Packagist e ha superato 70 stelle su GitHub, quasi interamente per passaparola nella community Laravel. Ed è proprio quella trazione ad aver spinto la funzionalità successiva: un diagramma è ottimo per vedere il tuo schema, ma non ti dice quando qualcosa al suo interno non va. `truss:doctor` lo fa.

## Cosa intercetta

Eseguilo e segnala problemi visibili dalla sola struttura:

- Tabelle senza chiave primaria
- Chiavi esterne senza indice a supporto
- Indici duplicati o ridondanti
- Chiavi esterne il cui tipo non corrisponde alla chiave a cui fanno riferimento
- Colonne che sembrano importi monetari salvate come `float`
- Pivot senza chiave univoca, `deleted_at` non indicizzato, e altro

Tredici regole in totale, tra le categorie integrità, indici e tipi, ciascuna con un codice stabile (come `TRUSS-IDX-001`) così puoi cercarla, silenziarla o cambiarne la severità.

Le regole tengono conto del motore di database dove conta: una chiave esterna non indicizzata è un **errore** su PostgreSQL e SQLite, ma solo **info** su MySQL e MariaDB, perché questi indicizzano automaticamente le chiavi esterne.

## Nel terminale e in CI

```bash
php artisan truss:doctor
php artisan truss:doctor --preset=strict --fail-on=warning
php artisan truss:doctor --format=json
```

Esce con codice diverso da zero non appena un rilievo raggiunge il tuo livello di fallimento, così una migration che introduce un problema fa fallire la build. Nessuna AI, nessuna query, nessun dato di riga: deterministico e basato solo sulla struttura, sicuro da eseguire in un commit hook o in una pipeline CI contro un database di cui non ti fidi del tutto.

## Nella dashboard

Gli stessi rilievi emergono nella dashboard come un nuovo pannello Health, l'icona a cuore nella toolbar. Le tabelle con un problema sono segnalate direttamente sul diagramma, la colonna incriminata è marcata inline, e i rilievi a confidenza più bassa (euristici) sono etichettati come tali. Stesso motore, stessi rilievi, due front-end a seconda che tu sia al terminale o nel browser.

## Provalo

La [demo live](https://trussphp.com/demo/) lo ha già attivo contro uno schema fittizio. Apri il pannello Health e vedrai alcune chiavi esterne segnalate per un indice mancante.

- Demo live: [trussphp.com/demo](https://trussphp.com/demo/)
- Guida, con ogni codice regola: [trussphp.com/guides/schema-doctor](https://trussphp.com/guides/schema-doctor/)
- Note di rilascio: [v1.5.0 su GitHub](https://github.com/albertoarena/laravel-truss/releases/tag/v1.5.0)

Aggiorna con `composer update albertoarena/laravel-truss`, poi esegui `php artisan truss:doctor` e guarda cosa c'è già lì dentro.

## Cosa viene dopo

Questa è la fase uno: il motore e le tredici regole. File di soppressione, altre regole e formatter per la CI sono sulla [roadmap](https://trussphp.com/roadmap/). Se una regola ti sembra troppo rumorosa, troppo silenziosa, o manca un controllo che vorresti, la [discussione](https://github.com/albertoarena/laravel-truss/discussions/18) è aperta. Mi piacerebbe sapere contro cosa lo eseguite.
