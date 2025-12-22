# Boulder - LLM Context

> Version: 1.2.0
> Last Updated: 2025-12-22

## Purpose

Climbing Group Voting App (PWA) - ermoeglicht Klettergruppen, gemeinsam ueber Hallen/Spots abzustimmen.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare Tunnel                       │
└─────────────────┬─────────────────────────┬─────────────────┘
                  │                         │
    boulder.varga.media          boulder-api.varga.media
                  │                         │
┌─────────────────┴─────────────────────────┴─────────────────┐
│                         Traefik                              │
└─────────────────┬─────────────────────────┬─────────────────┘
                  │                         │
     ┌────────────┴────────────┐ ┌──────────┴──────────┐
     │   boulder-frontend      │ │    boulder-api      │
     │   (nginx:alpine)        │ │    (node:20-alpine) │
     │   Port 80               │ │    Port 3001        │
     └─────────────────────────┘ └──────────┬──────────┘
                                            │
                                   ┌────────┴────────┐
                                   │  boulder-data   │
                                   │  (SQLite Vol)   │
                                   └─────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Vanilla JS PWA |
| Backend | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Deployment | Docker + Traefik |

## Key Files

- `index.html` - Main PWA entry
- `sw.js` - Service Worker
- `manifest.json` - PWA Manifest
- `js/` - Frontend JavaScript
- `backend/server.js` - API Server
- `docker-compose.yml` - Container orchestration
- `deploy.sh` - Deployment script

## Deployment

- **Registry**: `apps-registry.json` in infra repo
- **Hostnames**: `boulder.varga.media`, `boulder-api.varga.media`
- **Trigger**: Push to main -> repository_dispatch -> edge-deploy

## Current State

- [x] Basic PWA structure
- [x] Backend API with SQLite
- [x] Docker setup
- [x] Traefik labels configured
- [x] Registered in apps-registry.json
- [x] Cloudflared routing configured
- [x] CI/CD workflow (deploy.yml)
- [x] Environment-basierte API-URL Konfiguration (Build-Time Injection)

## Aktueller Stand (20251222)

### Abgeschlossen

- [x] Build-Time Config Injection: API-URL wird zur Build-Zeit in `js/config.js` injiziert
  - `js/config.js`: Default API-URL (Railway)
  - `js/api.js`: Liest `window.BOULDER_CONFIG.apiUrl`
  - `Dockerfile`: Ueberschreibt config.js mit Build-Arg `API_URL`
  - `docker-compose.yml`: Uebergibt `BOULDER_API_URL` als Build-Argument
  - `deploy.sh`: Setzt URL basierend auf Environment (pre/main)
- [x] CDN Cache Headers: Environment-basiertes Caching (`pre` = no-cache, `main` = differenziert)
- [x] Railway Branch: Eigene config.js mit Railway-API-URL

### Deployment Status

| Target | URL | Status |
|--------|-----|--------|
| Railway | `boulder.varga.media` | ✅ Live |
| Edge main | `boulder-edge.varga.media` | ✅ Live |
| Edge pre | `boulder-pre.varga.media` | ⏸️ HOLD-001 |

### API URLs (nach Branch)

| Branch | API-URL |
|--------|---------|
| railway | `https://boulder-api.varga.media` |
| main | `https://boulder-edge-api.varga.media` |
| pre | `https://boulder-pre-api.varga.media` |

## Open Questions

Siehe `00_infos/meta/open-questions.md` - HOLD-001 aktiv (GitHub Actions Minutes).
