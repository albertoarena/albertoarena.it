---
title: "Deployare Laravel su Netsons con GitHub Actions"
date: "2026-05-13T12:00:00.000Z"
template: "post"
draft: false
category: "Laravel"
tags:
  - "Laravel"
  - "Deploy"
  - "Netsons"
  - "GitHub Actions"
  - "Open Source"
  - "PHP"
description: "Ho creato un package Laravel per fare il deploy su Netsons shared hosting via GitHub Actions, con supporto per strategie FTP e git clone."
lang: it
translationOf: laravel-netsons-deploy
---

Se lavori con clienti italiani, prima o poi ti imbatti in [Netsons](https://www.netsons.com). È uno dei provider hosting più diffusi qui, economico e molto usato per progetti piccoli e medi. Il problema è che fare il deploy di un'applicazione Laravel su shared hosting non è esattamente semplice.

Non c'è Forge, non c'è Envoyer, nessuna soluzione pronta all'uso. O scrivi tutto da zero oppure copi quello script di deploy vecchio di tre progetti fa e speri che funzioni ancora.

Io mi sono stancato di farlo.

## Cosa ho costruito

[laravel-netsons-deploy](https://github.com/albertoarena/laravel-netsons-deploy) è un package Laravel che ti mette a disposizione un workflow di deploy completo per Netsons shared hosting, basato su GitHub Actions. Installalo, esegui un comando artisan, rispondi ad alcune domande e ottieni un file `.github/workflows/deploy.yml` già configurato per il tuo progetto.

Supporta due strategie, in base al piano Netsons che hai:

**FTP** compila l'app sul runner di GitHub Actions e carica il risultato via FTP. È l'opzione più lenta, ma i deploy successivi sono incrementali: vengono trasferiti solo i file modificati.

**Git clone** clona il repository direttamente sul server via SSH, esegue Composer lì, e usa SCP solo per trasferire gli asset compilati. È significativamente più veloce.

Entrambe le strategie richiedono accesso SSH per eseguire i comandi artisan post-deploy (migrazioni, rebuild della cache e così via), quindi entrambe necessitano di un piano Netsons SSD 30 o superiore. La differenza è cosa viene trasferito: con FTP carichi l'app già compilata, con git clone è il server a scaricare i sorgenti e compilarli in locale.

Entrambe le strategie condividono lo stesso comportamento base: deploy basati su release con directory timestampate, cambio di versione senza downtime tramite un proxy `index.php`, `.env` e `storage/` condivisi tra le release, pulizia automatica della cache e migrazioni del database ad ogni deploy.

## I comandi artisan

Tre comandi fanno la maggior parte del lavoro:

- `php artisan netsons:install` esegue il wizard interattivo di configurazione, pubblica il config e genera il workflow file.
- `php artisan netsons:env` gestisce le variabili d'ambiente personalizzate, inclusi valori da GitHub Secrets, valori statici e variabili di build per Vite.
- `php artisan netsons:check` mostra la configurazione attuale e lista i GitHub Secrets che devi aggiungere.

Una volta che hai il workflow file nel repository e i secret configurati, i deploy avvengono tramite GitHub Actions con un solo click. Niente sessioni SSH, niente passaggi manuali.

## Come è stato costruito

Ho usato il TDD per tutto il progetto e ho avuto Claude Code come assistente per le parti più ripetitive. La documentazione è completa, con guide separate per la configurazione FTP, la strategia git, la configurazione di Netsons e il troubleshooting.

Il package è stabile e gira su un progetto reale in produzione in questo momento.

## Lezioni imparate

Arrivare qui ha richiesto 35 release. Il numero sembra eccessivo, ma lo shared hosting è pieno di casi limite: path dei binari PHP diversi, quirk dell'FTP, SSH su una porta non standard (65100 su Netsons), ambienti in cui Composer è disponibile lato server e altri in cui non lo è. Ogni versione ha risolto qualcosa di reale.

Alcune riflessioni che porto con me da questo progetto.

**Costruisci quello che non esiste ancora.** Non c'era nulla per fare il deploy di Laravel su Netsons in modo specifico. Avrei potuto continuare ad aggiustare i miei script, ma impacchettare la soluzione in modo corretto l'ha resa riutilizzabile e molto più semplice da mantenere.

**La pazienza fa parte del processo.** Trentacinque versioni non sono un fallimento, sono un raffinamento. Lo spazio tra "funziona sul mio progetto" e "funziona in modo affidabile in contesti diversi" è dove avviene la vera ingegneria.

**Condividere ha valore.** Rendere il package open source significa che qualcun altro con lo stesso problema su Netsons può saltare la parte più dolorosa. E se trova un caso limite che mi sono perso, può contribuire con una fix.

## Provalo

```bash
composer require albertoarena/laravel-netsons-deploy --dev
php artisan netsons:install
```

La documentazione completa è su [albertoarena.github.io/laravel-netsons-deploy](https://albertoarena.github.io/laravel-netsons-deploy). Issue e pull request sono benvenute.
