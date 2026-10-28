# CV Sender

Browse live job listings and get a CV rewritten for each one.

## Run it

```bash
npm install
cp .env.example .env        # optional: override the backend URL
npx expo run:ios            # or run:android — a dev build is required (native tabs, document picker)
```

The backend is the CV Adapter API, documented in [docs/backend-api.md](docs/backend-api.md).

## Layout

| path | what |
|---|---|
| `api/` | axios client, bearer-token storage, error mapping (`ApiError` carries the backend's `detail`) |
| `services/` | one module per backend area — `JobService`, `CvService`, `AuthService` — plus local stores for the uploaded CV and tailored jobs |
| `hooks/` | React Query hooks over the services |
| `app/` | screens (expo-router) |

## Status

- Job list, filters, details and search use the live backend (`GET /jobs`, `GET /jobs/{id}`), which needs no account.
- **Tailoring is simulated.** "Tailor my resume" runs a local progress animation, then opens the posting in the in-app browser — no request is sent. `CvService.parse/tailor/adapt` and `AuthService` are implemented and ready to wire in; they need a signed-in account on the paid plan.
- The uploaded CV is kept on the device only.
