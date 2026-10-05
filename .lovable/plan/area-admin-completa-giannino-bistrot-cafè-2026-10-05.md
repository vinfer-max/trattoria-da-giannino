# Area Admin completa – Giannino Bistrot Cafè

## Cosa potrai fare
Accesso alla pagina **/admin** con email e password (resta il login attuale; il primo registrato è amministratore).

### 1. Pagine del sito
- Elenco pagine (Menù, Caffetteria, Drink, Vini + nuove pagine create da te)
- Aggiungi, rinomina, elimina, mostra/nascondi, cambia ordine (frecce su/giù o trascinamento)
- Le pagine visibili compaiono automaticamente nel menu di navigazione

### 2. Categorie e sottocategorie
- Per ogni pagina: categorie con orario e coperto
- Ogni categoria può avere sottocategorie (es. Vini > Rossi > Toscana)
- Aggiungi, modifica, elimina, mostra/nascondi, riordina

### 3. Prodotti
- Nome, descrizione, prezzo, in evidenza, foto opzionale
- Aggiungi, modifica, elimina, mostra/nascondi, riordina, sposta in altra categoria

### 4. Home page
- **Immagini**: carica, elimina, riordina le foto della testata
- **Carosello**: interruttore acceso/spento, velocità di scorrimento
- **Testi**: titolo, sottotitolo e sezioni con editor completo (grassetto, corsivo, sottolineato, elenchi, allineamento, link, colore testo, colore evidenziazione, dimensione, tipo di carattere da una lista di font)
- **Sezioni**: aggiungi/rimuovi/riordina blocchi di testo della home
- **Eventi**: titolo, data, descrizione (con editor), immagine, visibile sì/no; mostrati in una sezione "Eventi" in home, quelli passati nascosti automaticamente

## Dettagli tecnici
- Nuove tabelle: `site_pages` (slug, titolo, visibile, ordine), `menu_categories` + `parent_id` e `is_visible`, `menu_items` + `is_visible`, `image_url`; `home_slides`, `home_sections` (HTML ricco), `events`; impostazioni carosello in `site_settings`.
- Lettura pubblica solo degli elementi visibili; scrittura solo per admin (ruolo verificato lato database).
- Archivio immagini pubblico per foto home, prodotti ed eventi.
- Editor di testo: TipTap con estensioni colore, font, dimensione, allineamento, link; HTML salvato e mostrato sanificato.
- Riordino con dnd-kit; pagina pubblica dinamica `/p/$slug` per le nuove pagine; pagine esistenti lette dal database.
- Admin diviso in schede: Pagine, Categorie & Prodotti, Home, Eventi.
