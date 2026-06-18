

## How to start a webdav server

- clone the github repo "loganmarchione/docker-webdav-nginx"
- run the docker compose
- optionnally update the webdav.conf definition to allow for CORS requests.
if so you can then run the docker-compose-dev file instead

## Build and run

### locally
```sh
npm run build:local
npm run dev
```
In your terminal Vite will mention the host url. Typically "http://localhost:5173/"

### for Chrome MV3 extensions
```sh
npm run build:extension
```
Then head to the extension page (chrome://extensions/, brave://extensions/ etc.)
Toggle "Developper mode"
Click on "Load unpacked"
Load this repo's "dist-extension/" directory 