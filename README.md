# CivicConnect Mumbai

Civic issue reporting for Mumbai: geotagged reports, severity ranking, photo + AI classify (simulated), upvotes/comments, and ward RBAC on a live map.

![stack](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20Leaflet-0D7377)

## Run locally

```bash
npx serve .
# or: npm start
```

Open the printed URL (default port varies). No build step.

## Demo accounts

| User | Password | Role |
|------|----------|------|
| `admin` | `123` | Global admin — change any status |
| `officer1` | `123` | Ward officer — Colaba only |
| `citizen1` | `123` | Citizen — report & upvote |

## Features

- **Map workspace** — 37 Mumbai neighborhoods, color-coded status pins
- **Severity engine** — base category + upvotes + age decay + traffic/industrial multipliers
- **Top 10** — Mumbai-wide or local, ranked by severity + recency + comments
- **File report** — click map or form; optional photo runs client-side YOLOv8 simulation
- **Issue drawer** — upvote, comment, officer status controls
- **Geolocation** — snaps area dropdown to nearest neighborhood

## Project layout

```
index.html
css/styles.css
js/data.js        # areas, categories, demo users
js/severity.js    # scoring + AI sim
js/app.js         # UI + map + RBAC
ARCHITECTURE.md
```

## License

MIT
