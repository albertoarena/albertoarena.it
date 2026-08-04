---
title: "Non esiste un artisan schema:show, quindi l'ho costruito io"
date: "2026-07-23T10:00:00.000Z"
template: "post"
draft: false
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "Un diagramma ER live e zoomabile dello schema reale del database della tua app Laravel, sicuro da eseguire in produzione perché legge solo la struttura, mai le righe."
socialImage: "/images/posts/introducing-truss/cover.jpg"
pinned: true
lang: it
translationOf: introducing-truss
---

![Un reticolo di travi in acciaio ripreso dal basso contro un cielo luminoso, con giunti imbullonati che formano una griglia](/images/posts/introducing-truss/cover.jpg)

> **Aggiornamento**: Truss ha ora un sito di documentazione dedicato e una roadmap pubblica. Vedi le note in fondo a questo post per cosa è cambiato dalla pubblicazione.

> **Aggiornamento**: Truss 1.5 aggiunge `truss:doctor`, una revisione deterministica e basata solo sulla struttura del tuo schema, su tredici regole, eseguibile da terminale, CI o dashboard. Leggi di più in [Il dottore dello schema è in ambulatorio](/posts/the-schema-doctor-is-in/it/).

Entri in un progetto. Quaranta tabelle, metà non documentate, e una tabella `posts` che in qualche modo è collegata ad altre tre tabelle che non hai mai visto. Da dove parti?

`php artisan db` ti apre una shell interattiva, e da lì sei di nuovo in balìa del dialetto del tuo database: `.schema` su SQLite, `DESCRIBE` su MySQL, `\d` su Postgres. I comandi `db:show` e `db:table` di Laravel sono un passo avanti, una panoramica delle tue tabelle o delle colonne, indici e chiavi esterne di una singola tabella, stampata direttamente nel terminale. Ma restano comunque una tabella alla volta, in testo. Niente ti mostra la forma dell'insieme: quali tabelle sono davvero collegate, e come, nell'intero schema. Finisci quindi per aprire un client per database attraverso un tunnel SSH, oppure per disegnarti il diagramma a memoria su una lavagna, il che è affidabile quanto sembra.

E questo è il caso facile, quando hai accesso shell. Su staging o produzione, dove ne hai più bisogno perché è lì che lo schema reale si è discostato dalle migration, spesso una shell non ce l'hai. Alcune organizzazioni bloccano SSH del tutto per motivi di compliance, esattamente la situazione di cui ho [scritto sostituendolo con AWS Systems Manager](/posts/beyond-the-bastion-aws-ssm-laravel-artisan/) per eseguire comandi Artisan. Anche con una sessione Run Command in mano, ottieni di nuovo una shell, non un diagramma.

Così ho costruito [Truss](https://github.com/albertoarena/laravel-truss).

## Cosa fa

Truss è un visualizzatore live della struttura del database per Laravel. Scansiona lo schema reale, non i file delle migration, e lo mostra come un diagramma ER scorrevole e zoomabile direttamente dentro la tua app.

- **Diagramma ER live**, renderizzato con Mermaid, di ogni tabella e di come è collegata.
- **Modalità focus**: clicca una tabella per isolarla insieme ai suoi vicini per chiave esterna, centrati ed evidenziati, così non stai a fissare quaranta tabelle per capirne una.
- **Filtro per nome tabella**, e possibilità di alternare i tipi di colonna nativi con etichette in stile Laravel.
- **Pan e zoom in stile mappa**, con auto-fit.
- **Solo struttura, sempre.** Truss legge tabelle, colonne, chiavi e indici. Non interroga mai una singola riga, il che è tutto il punto di poterlo eseguire in un posto che conta.
- **Autonomo**: Mermaid e i font sono inclusi nel package e serviti da esso, quindi funziona offline e sotto una CSP rigida. Nessun CDN, niente che telefoni a casa.
- **In cache e automatico**: lo snapshot si ricostruisce dopo le migration, quindi il diagramma non è mai obsoleto.
- **Esporta l'intero diagramma** come PNG o SVG, esattamente com'è filtrato e messo a fuoco al momento, così finisce dritto in un documento di design o in una PR invece che come screenshot. Sono disponibili anche export per singola tabella come JSON o CSV dal menu di ciascuna tabella, e l'intero schema può essere salvato come dizionario dati in Markdown o come file DBML.

Installalo, visita `/truss`, e ottieni il diagramma. Nessuna configurazione, nessun servizio separato da eseguire.

```bash
composer require albertoarena/laravel-truss
```

Di default è abilitato solo in locale. Per usarlo su staging o produzione lo abiliti esplicitamente e proteggi l'accesso dietro un gate di autorizzazione `viewTruss`, così "sicuro da eseguire in prod" non significa "spalancato in prod".

## Anche da riga di comando

`db:show` e `db:table` ci arrivano vicino, ma restano comunque una tabella alla volta, in testo. `php artisan truss:show` stampa lo stesso snapshot in cache e filtrato che usa il diagramma, come tabella: una riga per ogni tabella del database, con il conteggio delle colonne e delle chiavi esterne, l'intero schema in un colpo solo invece che un pezzo alla volta.

```bash
php artisan truss:show   # l'intero schema come tabella, nel tuo terminale
php artisan truss:open   # oppure vai dritto al diagramma
```

`php artisan truss:open` apre la dashboard nel tuo browser predefinito, rispettando il prefisso della rotta e l'URL dell'app. Stampa comunque l'URL, quindi funziona anche su una porta inoltrata su un host headless senza browser da aprire.

Entrambi i comandi vivono sotto un namespace `truss:` invece che `schema:`. Un package che occupa il namespace `schema:` di Laravel rischia una collisione se il framework dovesse mai spedire un suo `schema:show`, il che è la battuta nel titolo di questo post.

## Provarlo senza installare nulla

Se vuoi curiosarci prima di aggiungerlo a un progetto, c'è una [demo live](https://trussphp.com/demo/) che gira contro uno schema fittizio, direttamente nel browser. Pan, zoom, filtro, focus su una tabella, nessuna installazione richiesta.

## Come si è comportato finora

Ho inserito Truss in alcuni dei miei progetti Laravel da quando l'ho costruito, inclusi alcuni che non toccavo da un po', ed è il modo più rapido con cui mi sono ri-orientato in uno schema che ricordavo solo a metà. Cliccare tra le chiavi esterne in modalità focus batte ricostruire le relazioni dai nomi dei file di migration, ogni volta.

## Per iniziare

La [documentazione](https://trussphp.com) copre installazione, avvio rapido e autorizzazione per ambienti non locali in maggior dettaglio. Richiede PHP 8.3+ e Laravel 12+. C'è anche una [roadmap](https://trussphp.com/roadmap/) pubblica: il prossimo passo è lo schema diff, per vedere cosa è cambiato dall'ultima migration.

Feedback benvenuto, come sempre.

## Note

Il 29 luglio 2026, Truss ha raggiunto la v1.3.1: un dizionario dati e l'export DBML sono arrivati nella v1.3.0, e la v1.3.1 ha limitato l'introspezione dello schema al database della connessione, così un server condiviso non espone più le tabelle di altri database. La documentazione si è anche spostata su un sito dedicato, [trussphp.com](https://trussphp.com), con una [roadmap](https://trussphp.com/roadmap/) pubblica.

Il 31 luglio 2026, Truss ha raggiunto la v1.5.0, aggiungendo `truss:doctor`: una revisione deterministica e basata solo sulla struttura del tuo schema, su tredici regole tra integrità, indici e tipi, eseguibile da terminale, CI o dal nuovo pannello Health della dashboard. Vedi [Il dottore dello schema è in ambulatorio](/posts/the-schema-doctor-is-in/it/).
