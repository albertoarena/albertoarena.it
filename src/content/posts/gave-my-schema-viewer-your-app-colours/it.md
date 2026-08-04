---
title: "Ho dato al mio visualizzatore di schema i colori della tua app"
date: "2026-08-03T10:00:00.000Z"
template: "post"
draft: false
category: "Laravel"
tags:
  - "PHP"
  - "Laravel"
  - "Developer Tools"
  - "Database"
description: "Laravel Truss 1.6 aggiunge la personalizzazione del tema per adattarsi all'app in cui è incorporato, e truss:export per generare file di schema deterministici su cui la tua CI può basarsi."
socialImage: "/images/posts/gave-my-schema-viewer-your-app-colours/cover.jpg"
lang: it
translationOf: gave-my-schema-viewer-your-app-colours
---

![Campioni di colore Pantone disposti a ventaglio in cerchio su una superficie in cemento](/images/posts/gave-my-schema-viewer-your-app-colours/cover.jpg)

[Truss](https://github.com/albertoarena/laravel-truss) è un diagramma ER live e zoomabile dello schema reale del database della tua app Laravel, sicuro da eseguire in produzione perché legge solo la struttura. L'ho presentato [a luglio](/posts/introducing-truss/it/), ed è rimasto parte di ogni progetto per i clienti da allora, protetto dietro una policy `viewTruss`. Due cose continuavano a darmi fastidio. La dashboard era sempre blu Truss, qualunque fosse il brand reale del cliente, e sembrava incollata sopra la loro app invece che parte di essa. E il pulsante di export, un click per un dizionario dati in Markdown o un file DBML, veniva premuto solo quando me ne ricordavo, così il file di schema committato nel repo si allontanava piano piano da quello reale finché qualcuno non se ne accorgeva, di solito nel modo peggiore.

Truss 1.6 risolve entrambi i problemi: una dashboard personalizzabile che si adatta a qualunque cosa la ospiti, e un comando `truss:export` che porta lo stesso output nel tuo terminale e nella tua pipeline CI, senza bisogno del browser.

## Adattala alla tua app

Colori e font vivono ora sotto `truss.theme` nella configurazione, e Truss si ridisegna sia in modalità chiara che scura:

```php
// config/truss.php
'theme' => [
    'colors' => [
        'light' => [
            'accent' => '#b45309',
            'accent-secondary' => '#0f766e',
            'background' => '#faf6f0',
            'surface' => '#fffdf8',
            'text' => '#3a2a1c',
            'border' => '#c8873f',
        ],
        'dark' => [
            'accent' => '#fbbf24',
            'background' => '#1b130b',
            'surface' => '#26190d',
            'text' => '#f5e6d0',
            'border' => '#8a6428',
        ],
    ],
],
```

Solo le manopole che imposti vengono sovrascritte, tutto il resto resta sulla palette Blueprint di default, quindi tre o quattro valori bastano per farla sembrare di casa. Il ridisegno va in profondità: le linee di relazione del diagramma, gli sfondi delle etichette, la griglia di sfondo, le righe delle tabelle e gli input seguono tutti, non solo la toolbar. Viene servito come foglio di stile same-origin, senza build step, `style-src 'self'` continua a coprirlo, e un'installazione di default non aggiunge nessuna richiesta in più. Ogni valore viene validato prima di essere scritto, così un refuso torna al default invece di rompere il foglio di stile.

Scegliere i valori esadecimali a mano non è necessario. Il nuovo [theme builder](https://trussphp.com/theme-builder/) mostra in anteprima una palette contro la dashboard reale dal vivo, parte da preset (Blueprint, Ember, Contrast) se preferisci modificare invece che partire da zero, e genera lo snippet esatto di `config/truss.php` da incollare.

<img src="/images/posts/gave-my-schema-viewer-your-app-colours/theme-builder-light.webp" alt="Il theme builder di Truss in modalità chiara: le manopole dei colori a sinistra, il diagramma dello schema ridisegnato con una palette calda ambra e verde acqua a destra" class="block dark:hidden rounded-lg border border-white-cloud" />
<img src="/images/posts/gave-my-schema-viewer-your-app-colours/theme-builder-dark.webp" alt="Lo stesso theme builder di Truss in modalità scura, la stessa palette ambra e verde acqua riportata sullo sfondo scuro" class="hidden dark:block rounded-lg border border-dark-cloud" />

## Ottieni un file di schema senza aprire un browser

```bash
php artisan truss:export --format=dbml --output=docs/schema.dbml
php artisan truss:export --format=json --check
```

`truss:export` è la controparte da riga di comando del pulsante di export: gli stessi cinque formati (DBML, JSON, CSV, dizionario dati in Markdown, Mermaid), generati direttamente da PHP, senza coinvolgere il browser. L'output è deterministico, lo stesso schema produce sempre gli stessi byte, ed è proprio questo che rende utile `--check`: puntalo al file che hai committato, ed esce con `1` nel momento in cui quel file smette di corrispondere al database, `2` per un errore di utilizzo, `0` quando tutto torna. Collegalo a un commit hook o alla CI, e lo schema drift smette di essere qualcosa che un reviewer deve notare a occhio. Solo struttura, come sempre, nessuna chiamata di rete.

## Provalo

- Theme builder: [trussphp.com/theme-builder](https://trussphp.com/theme-builder/)
- Demo live: [trussphp.com/demo](https://trussphp.com/demo/)
- Guida al theming: [trussphp.com/guides/theming](https://trussphp.com/guides/theming/)
- Guida allo schema export: [trussphp.com/guides/schema-export](https://trussphp.com/guides/schema-export/)
- Note di rilascio: [v1.6.0 su GitHub](https://github.com/albertoarena/laravel-truss/releases/tag/v1.6.0)

Aggiorna con `composer update albertoarena/laravel-truss`.

## Cosa viene dopo

Lighthouse CI è il prossimo passo sulla [roadmap](https://trussphp.com/roadmap/): audit automatici di performance e accessibilità su entrambi i temi, chiaro e scuro. Dopo quello: altre regole per `truss:doctor`, lettura delle relazioni Eloquent per etichette semantiche invece delle sole chiavi esterne, e contesto dello schema formattato per agenti AI che lavorano nella stessa codebase. Se manca una manopola di tema o `truss:export` dovrebbe supportare un formato che non ha, la [discussione](https://github.com/albertoarena/laravel-truss/discussions) è aperta.
