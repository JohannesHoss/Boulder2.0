# Boulder Patterns

> Version: 1.0.0

---

## CDN Cache Headers (Environment-basiert)

### Problem
Cloudflare CDN cached Dateien basierend auf `Cache-Control` Header vom Origin (nginx). Falsche Header = User sehen alte Version trotz Deploy.

### Loesung: Environment-basiertes Caching

| Environment | Cache-Strategie | Grund |
|-------------|-----------------|-------|
| `pre` | Kein Cache (`no-cache, no-store`) | Sofortige Updates fuer Entwicklung |
| `main` | Differenziert (1 Tag JS/CSS, 1 Jahr Assets) | Performance fuer Produktion |

### Implementierung

**Dockerfile mit Build-Argument:**
```dockerfile
ARG ENVIRONMENT=main

RUN if [ "$ENVIRONMENT" = "pre" ]; then \
    # No-cache fuer alles
    echo 'server { \
        add_header Cache-Control "no-cache, no-store, must-revalidate" always; \
        ...
    }' > /etc/nginx/conf.d/default.conf; \
else \
    # Differenzierte Cache-Header fuer main
    echo 'server { \
        location ~* \.(js|css)$ { max-age=86400 } \
        location ~* \.(png|jpg|svg|woff2?)$ { max-age=31536000, immutable } \
        ...
    }' > /etc/nginx/conf.d/default.conf; \
fi
```

**docker-compose.yml:**
```yaml
services:
  frontend:
    build:
      args:
        ENVIRONMENT: ${BOULDER_ENV:-main}
```

### Diagnose

```bash
# Header pruefen
curl -sI https://boulder-pre.varga.media/css/style.css | grep -iE "(cache-control|cf-cache)"

# Erwartete Werte:
# PRE:  cache-control: no-cache, no-store  |  cf-cache-status: BYPASS
# MAIN: cache-control: max-age=86400       |  cf-cache-status: HIT
```

### Emergency Fix

1. Cloudflare Cache purgen: Dashboard → Caching → Purge Everything
2. Container neu bauen: `docker compose build --no-cache`
3. Container neu starten: `docker compose up -d --force-recreate`

---

## API URL Konfiguration

Backend-URL wird zur Build-Zeit nicht eingebettet, sondern zur Laufzeit aus dem Hostname abgeleitet:

```javascript
// js/api.js
getBaseUrl() {
    const host = window.location.hostname;
    if (host.includes('-pre')) {
        return 'https://boulder-pre-api.varga.media';
    }
    return 'https://boulder-api.varga.media';
}
```

---

## Service Worker Cache Versioning

Bei Aenderungen am Frontend: SW Cache Version bumpen in `sw.js`:

```javascript
const CACHE_NAME = 'boulder-v5';  // Increment bei Aenderungen
```
