# WebDAV File Sharing UI — Task List

> Last updated: 2026-04-30

---

## Phase 1: Project Setup

- [x] **1. Init npm project + install dependencies**
  - Description: `npm init`, install vite, tailwindcss, postcss, autoprefixer, webdav
  - Dependencies: none
  - Complexity: small
  - Status: done

- [x] **2. Configure Vite**
  - Description: Create `vite.config.js` with dual build support (local + extension targets). Set up separate entry points and output dirs.
  - Dependencies: 1
  - Complexity: medium
  - Status: done

- [x] **3. Tailwind CSS setup**
  - Description: Create `tailwind.config.js`, `postcss.config.js`, base CSS file with Tailwind directives.
  - Dependencies: 1
  - Complexity: small
  - Status: done

- [x] **4. Project structure**
  - Description: Create directory layout: `src/` (components, utils, styles), `public/`, extension-specific folders.
  - Dependencies: none
  - Complexity: small
  - Status: done

---

## Phase 2: Core WebDAV Client

- [x] **5. WebDAV client wrapper**
  - Description: Create module wrapping `webdav` npm package's `createClient()`. Accept server URL + auth config. Export singleton or factory.
  - Dependencies: 4
  - Complexity: medium
  - Status: done

- [x] **6. Auth module**
  - Description: Handle Basic auth credentials. Store in `sessionStorage`. Provide login/logout/restore-session functions.
  - Dependencies: 5
  - Complexity: small
  - Status: done

- [x] **7. File operations**
  - Description: Implement `listDirectory(path)`, `getFileStats(path)`, `deleteItem(path)` using WebDAV client wrapper.
  - Dependencies: 5
  - Complexity: medium
  - Status: done

- [x] **8. Download**
  - Description: Implement single file download via WebDAV GET. Trigger browser download via blob URL.
  - Dependencies: 7
  - Complexity: small
  - Status: done

---

## Phase 3: File Browser UI

- [ ] **9. Login form**
  - Description: Server URL input + username/password fields. Validate inputs. Connect via auth module. Show errors.
  - Dependencies: 6
  - Complexity: medium
  - Status: pending

- [ ] **10. File list view**
  - Description: Table layout with columns: name, size (human-readable), modified date, type icon. Render from `listDirectory()` results.
  - Dependencies: 7
  - Complexity: medium
  - Status: pending

- [ ] **11. Folder navigation**
  - Description: Breadcrumb trail showing current path. Click folder to enter, click breadcrumb segment to jump. Back button.
  - Dependencies: 10
  - Complexity: medium
  - Status: pending

- [ ] **12. Grid view toggle**
  - Description: Card/grid layout with thumbnail previews for images. Toggle between list and grid views.
  - Dependencies: 10
  - Complexity: small
  - Status: pending

- [ ] **13. Download button per file**
  - Description: Add download action to each file row/card. Triggers download from task 8.
  - Dependencies: 8, 10
  - Complexity: small
  - Status: pending

---

## Phase 4: Upload

- [ ] **14. Basic upload**
  - Description: File picker button, drag-and-drop zone. Upload via WebDAV PUT. Show progress bar per file.
  - Dependencies: 7
  - Complexity: medium
  - Status: pending

- [ ] **15. Chunked upload**
  - Description: For files >50MB: split into chunks, sequential PUT per chunk. Track overall progress. Configurable chunk size.
  - Dependencies: 14
  - Complexity: large
  - Status: pending

---

## Phase 5: Dual Build Targets

- [ ] **16. Local build config**
  - Description: Vite build entry: `index.html`. Output: `dist/`. Standard web app served by any HTTP server. Document CORS requirement.
  - Dependencies: 2
  - Complexity: small
  - Status: pending

- [ ] **17. Extension build config**
  - Description: Separate Vite build entry for Chrome MV3 extension. `manifest.json`, `popup.html` → opens new tab. Output: `dist-extension/`.
  - Dependencies: 2
  - Complexity: medium
  - Status: pending

- [ ] **18. Extension host_permissions**
  - Description: Configure `host_permissions: ["<all_urls>"]` in manifest to bypass CORS. Validate it works.
  - Dependencies: 17
  - Complexity: small
  - Status: pending

- [ ] **19. Shared core extraction**
  - Description: Ensure `src/` core code is imported identically by both local and extension entry points. No duplication.
  - Dependencies: 2
  - Complexity: medium
  - Status: pending

---

## Phase 6: Polish

- [ ] **20. Error handling**
  - Description: Catch network errors, 401/403 auth failures, timeouts. Show user-friendly toast/alert messages. Retry option.
  - Dependencies: 9
  - Complexity: medium
  - Status: pending

- [ ] **21. Loading states**
  - Description: Spinner/skeleton while directory loads. Disable buttons during operations. Progress indicators for uploads.
  - Dependencies: 10
  - Complexity: small
  - Status: pending

- [ ] **22. Responsive design**
  - Description: Mobile-friendly layout. Stack columns on small screens. Touch-friendly tap targets. Test on phone viewport.
  - Dependencies: 10
  - Complexity: small
  - Status: pending

---

**Total tasks: 22** | Small: 12 | Medium: 8 | Large: 2
