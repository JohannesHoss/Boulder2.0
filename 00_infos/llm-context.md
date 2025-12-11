# Boulder - LLM Context

> Version: 1.0.0
> Last Updated: 2025-12-09

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
- [ ] CI/CD workflow (deploy.yml)

## Open Questions

None currently.
