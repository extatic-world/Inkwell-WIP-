# Inkwell (beginner version)

Three files do everything:

- `index.html`  the page structure (what is on the page)
- `style.css`   the looks (colours, layout, notebook dots, dark mode)
- `app.js`      the behaviour (writing, saving, tools, dictionary)

## Run it
1. Open this folder in Visual Studio Code.
2. Install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server".
   (Double-clicking `index.html` also works.)

## What works straight away
Writing, fonts and colours, paper presets, photos and videos, dark mode, collapsible sidebar,
drafts saved in your browser, and the Dictionary/Thesaurus tab (free online services, internet needed).

## What you need to fill in (search app.js for ">>> YOUR INPUT <<<")
1. Section 1: backend address and key (when you choose Supabase, Firebase etc.)
2. Section 8: `publishPost`, `unpublishPost`, `loadPublishedPosts` - connect these to your database.
   Until then, Publish and Browse show a "not connected yet" message.

## Good next steps
- Change a colour at the top of style.css and refresh, to see how it works.
- Add a login system before connecting Publish, so each post has an author.
- Upload photos and videos to file storage instead of saving them inside the post (see Section 5).
