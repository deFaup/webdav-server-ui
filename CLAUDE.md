Project: WebDAV File Sharing UI

Web frontend for WebDAV file sharing. No backend — pure frontend connecting to external WebDAV servers.

Tech stack: Vanilla JS, Tailwind CSS, Vite, `webdav` npm package.

Dual build targets from same codebase:
- Local hosting (index.html, needs CORS on WebDAV server)
- Browser extension (Chrome MV3, bypasses CORS via host_permissions)

Project uses task files to track the work to do and done.
When implementing, update both files @tasks.html and @tasks.md to reflect progress.
