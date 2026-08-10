---
title: "Il mio agente di coding inventava le colonne"
date: "2026-08-10T16:00:00.000Z"
template: "post"
draft: false
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
  - "AI"
description: "Laravel Truss 1.8 trasforma l'export dello schema in contesto per un agente di coding: annotazioni, export mirati e compatti, e un server MCP opzionale e di sola lettura."
socialImage: "/images/posts/my-coding-agent-kept-inventing-columns/cover.jpg"
coverAlt: "Un ricetrasmettitore portatile centrato su uno sfondo sfumato dal blu al viola, con un riflesso tenue sotto di esso"
lang: it
translationOf: my-coding-agent-kept-inventing-columns
series:
  slug: "truss"
  order: 4
discussion: "albertoarena/laravel-truss"
---

Chiedi a un agente di coding di scrivere una query su una tabella che non ha ancora visto in questa sessione, e indovinerà. In modo sicuro, plausibile e sbagliato: una chiave esterna chiamata `author_id` quando la colonna in realtà è `created_by`, uno `status` trattato come stringa libera quando in realtà è un enum `tinyint`, una tabella che è certo esista perché di solito una tabella simile c'è. Non sta mentendo, semplicemente non lo sa, e niente lo obbliga a dirlo.

La soluzione abituale è incollare un dump dello schema in chat all'inizio della sessione. Funziona finché non arriva la migration successiva, a quel punto è solo un tipo diverso di errore: sbagliato con sicurezza perché obsoleto, invece che sbagliato con sicurezza perché inventato.

C'è una terza opzione ovvia: lasciare che sia l'agente stesso a eseguire le query, la maggior parte degli agenti di coding può già eseguire SQL. Ma questo significa consegnare credenziali reali del database, e una connessione che può interrogare può anche vedere le righe, non solo la struttura. È un permesso più ampio di quanto il problema richieda.

[Truss](https://github.com/albertoarena/laravel-truss) è sempre stato un diagramma ER live e zoomabile dello schema reale del database della tua app Laravel, solo struttura, mai una riga di dati. La versione 1.8 punta quella stessa struttura live verso un agente di coding invece che verso una scheda del browser.

## Dagli il significato che un tipo non può portare

Una colonna dice a un agente il suo nome e il suo tipo, non cosa significa. `status = 1` da solo non dice "pagato". Annotalo una volta e ogni export lo porterà con sé:

```php
// config/truss.php
'annotations' => [
    'source' => ['config', 'database'],
    'tables' => [
        'orders' => [
            'note' => 'One row per checkout attempt, not per completed order.',
            'columns' => [
                'status' => 'tinyint: 0 pending, 1 paid, 2 refunded',
            ],
        ],
    ],
],
```

Se il tuo database ha già stringhe `COMMENT` sulle tabelle e sulle colonne, lascia `'database'` in `annotations.source` e Truss le legge direttamente, senza una config duplicata da tenere sincronizzata. In entrambi i casi, un commento fa parte della definizione `CREATE TABLE`, non di una riga: resta solo struttura. Rimuovili da un singolo export con `--no-annotations` quando vuoi solo la forma nuda.

## Riducilo a ciò che serve alla domanda

Uno schema di quaranta tabelle sono un sacco di token da spendere per una domanda su una sola tabella. `--compact` elimina i default delle colonne e gli indici non univoci senza perdere nessuna tabella, colonna o chiave esterna. `--focus=orders --depth=1` riduce l'export a una tabella e al suo vicinato di chiavi esterne, la stessa idea della modalità focus della dashboard, ora disponibile anche da riga di comando. E c'è un nuovo formato `llm` accanto ai cinque già esistenti (DBML, JSON, CSV, Markdown, Mermaid), un export in testo semplice e denso, pensato per un budget di token invece che per un umano che legge un dizionario dati:

```bash
php artisan truss:export --format=llm --focus=orders --depth=1 --compact
```

Questo è ciò che produce l'export. Richiamarlo è altrettanto diretto, in codice o via HTTP.

Costruire la stessa cosa in codice passa attraverso una nuova facade `Truss` fluente e immutabile al posto del comando:

```php
Truss::snapshot()->focus('orders', depth: 1)->compact()->toDbml();
```

E una route protetta `GET {prefix}/export/{format}` serve lo stesso identico output a qualsiasi client HTTP, dietro lo stesso gate `viewTruss` della dashboard. Comando, facade, route, download dalla dashboard: sotto tutti e quattro c'è un'unica pipeline, così non possono mai disallinearsi silenziosamente tra loro.

## Chiedilo dal vivo, invece di incollare uno snapshot

La parte che volevo davvero, però, non era un export migliore. Era non dover esportare proprio niente.

Truss 1.8 aggiunge un server opzionale per MCP, il Model Context Protocol che Claude Code, Claude Desktop e Cursor usano per raggiungere strumenti esterni. Costruito su `laravel/mcp`, parla direttamente con un agente di coding via stdio locale:

```bash
composer require laravel/mcp
php artisan mcp:start truss
```

Puntane uno verso di esso e l'agente ottiene cinque tool, `list_tables`, `describe_table`, `get_schema`, `focus_table` e `get_structural_review`, più una risorsa `truss://schema`, tutti in lettura dello schema live su richiesta. Ogni tool dichiara il `readOnlyHint` di MCP, così un client può presentarli come di sola lettura invece di chiedere l'approvazione di scrittura per una chiamata che non avrebbe mai scritto nulla. Nessun dato di riga, mai, e valgono le stesse protezioni su esclusioni e connessioni gestite del resto di Truss, opt-in e disattivato di default dietro `truss.mcp.enabled`.

L'ho puntato su un progetto reale a cui lavoro da un po', in Claude Desktop, e la differenza è stata immediata: invece di incollare un dump dello schema all'inizio della conversazione, o dell'agente che mi chiedeva di eseguire una query per controllare il nome di una colonna, ha semplicemente chiamato `describe_table` prima di scrivere qualsiasi cosa, lo stesso controllo che avrebbe intercettato l'`author_id` indovinato all'inizio di questo post. Nessuna obsolescenza, perché non c'è nulla che possa diventare obsoleto: legge la stessa introspezione live che usa il diagramma.

## Provalo

- [Demo live](https://trussphp.com/demo/), in esecuzione contro uno schema fittizio
- Guida al contesto AI: [trussphp.com/guides/ai-context](https://trussphp.com/guides/ai-context/)
- Guida al server MCP: [trussphp.com/guides/mcp-server](https://trussphp.com/guides/mcp-server/)
- Changelog completo: [CHANGELOG.md su GitHub](https://github.com/albertoarena/laravel-truss/blob/main/CHANGELOG.md)

Aggiorna con `composer update albertoarena/laravel-truss`, e se vuoi anche il server MCP, `composer require laravel/mcp` in aggiunta.

## Cosa viene dopo

Altre regole per `truss:doctor` e formati di output nativi per la CI sono il prossimo passo sulla [roadmap](https://trussphp.com/roadmap/), seguiti dalla lettura delle relazioni Eloquent per etichette semantiche sugli edge invece delle sole chiavi esterne, e da strumenti di navigazione per schemi con cento tabelle o più. Se manca un tool di cui l'agente avrebbe bisogno, o una sorgente di annotazioni che vorresti non è supportata, [apri una discussione](https://github.com/albertoarena/laravel-truss/discussions).
