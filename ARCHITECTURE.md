# CivicConnect Mumbai — Architecture Synopsis

See the product vision in this repo's README. This demo SPA implements the UX and scoring layer client-side; the MERN + YOLOv8 backend is the production target.

## Implemented in this SPA

| Capability | Status |
|------------|--------|
| Mumbai area map (Leaflet + OSM) | ✅ |
| Area selector + geolocation snap | ✅ |
| File report (coords, category, photo) | ✅ |
| YOLOv8 classification simulation | ✅ client-side |
| Severity formula | ✅ `js/severity.js` |
| Top-10 ranking (severity + recency + comments) | ✅ |
| Upvotes + comments | ✅ |
| RBAC status mutation (Citizen / Officer / Admin) | ✅ |
| Ward officer area lock | ✅ |

## Severity (locked)

```
SEVERITY = (BASE[category] + min(upvotes × 3, 25) + ageDecay) × locationMultiplier
```

Top-10 score: `severity + recencyBoost × 0.3 + commentCount × 0.1`

## Roadmap (MERN)

- MongoDB GeoJSON areas + complaints
- Express JWT auth, Cloudinary uploads
- Real YOLOv8 microservice + Redis queue
- Vercel frontend + Render API

## Demo accounts

- `admin` / `123` — Admin
- `officer1` / `123` — Ward Officer (Colaba)
- `citizen1` / `123` — Citizen
