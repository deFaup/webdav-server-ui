## Next feature on the roadmap
- DONE: delete files or directories (recursively delete files)
- move files (use webdav moveFile)
- upload should be a popup bottom right showing each files that was transfered. with an arrow down to reduce the size for long running uploads
- in grid mode photos should be thumbnails
- text files (.md, .csv, .txt) should be rendered when double clicking on them
- try to implement a progress bar for uploads. webdav package does not support it in v5
- stream videos?

## Tech debt
DONE - right click should keep highlight
change data-file-path to fl-download-path
rename all 'grid-item' into 'card'
contextMenuState should it be a global var? param to the render menu function seems better

fix the dl action on grid view
     remove the icon
          might break the highlight thing
     right clik to download

breadcrumb
     fix the parent path not working on breadcrumb path. even though the ../.. parent does work
     move the grid and list view icons to the right of the breadcrumb

sidebar
     when navigating, if clicking on the name of the folder it will move its chevron to a down one even though the chevron was not click and thus the path is not loaded. when clicking on the chevron it will switch to a down one and show nothing. the current fix is to click twice on the chevron to force the load
     clicking the server entry does not change its chevron to a down one which is good.
explore pattern "event delegation" — one listener on the parent catches clicks from all children. It's very common and event.target is essential there.
