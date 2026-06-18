Project: WebDAV File Sharing UI

Web frontend for WebDAV file sharing. No backend — pure frontend connecting to external WebDAV servers.

Tech stack: Vanilla JS, Tailwind CSS, Vite, `webdav` npm package.

Dual build targets from same codebase:
- Local hosting (index.html, needs CORS on WebDAV server)
- Browser extension (Chrome MV3, bypasses CORS via host_permissions)

Project uses task files to track the work to do and done.
When implementing, update both files @tasks.html and @tasks.md to reflect progress.

## Security Notes

- **XSS via sessionStorage**: Auth creds stored in sessionStorage. If XSS in this app, attacker can steal victim's creds. Low risk for personal use. Mitigate in Phase 3: use `textContent` not `innerHTML` for all WebDAV-sourced data (filenames, directory names).
- **Large file download**: `getFileContents()` loads entire file into memory as arraybuffer. Will OOM on large files. Add size limit or streaming in future.

## Known Limitations

- Download loads full file into memory — not suitable for files > ~500MB without streaming.

## Theme
Theme should match user's system theme
OS theme — add prefers-color-scheme media query to login component styles

Code review: All outputs will be reviewed by Cursor.