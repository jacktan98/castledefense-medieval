# Retiring the old GitHub Pages site

The game used to be live at `jacktan98.github.io/Medieval-Castle-Defense/` (and before that `/Medieval-Town-Defense/`), and it
saved itself on every phone and browser that opened it, for offline play. Those copies are old builds: some still have the
`?open` shortcut that opened every stage. Nothing in this repo can reach them; only the old address can.

These three files, served at the old address, remove them the next time each phone opens the old app while online:

- `index.html`: a "moved" page linking to castledefense.app; its script removes the offline helper and everything it kept.
- `sw.js`: replaces the old offline helper; it deletes the kept copy, removes itself and reloads the page.
- `version.json`: a new build id, so an old copy that is open notices and reloads.

The old offline helper loads the page from the network first, so as soon as these files are live, any online visit gets the
"moved" page. A copy only ever opened offline keeps working until it is next opened online.

To put them live: a public repo with the old name (e.g. `Medieval-Castle-Defense`), these files at its root, Pages on from `main`.
Creating a repo with an old name ends GitHub's redirect from that name to `castledefense-medieval`, so any clone still using
the old name needs `git remote set-url origin https://github.com/jacktan98/castledefense-medieval.git`.
