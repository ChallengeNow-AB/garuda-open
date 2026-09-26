# Komunitas Badminton Stockholm storefront

An independent, bilingual badminton storefront built on the Konyaspor storefront's API flow.
It reads the public organization storefront at `GET /api/storefronts/satuminton` and
public cup details at `GET /api/storefronts/satuminton/cups/{id}`.
The site presents the brand name **Komunitas Badminton Stockholm** even if the
underlying organization record has another name; this does not rename that record.

## Local preview

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev -- -p 3004
```

Open `http://localhost:3004/sv/satuminton`. The page always reads live API data;
it never displays sample competitions. Until the slug is published, it shows a
branded page with an explicit pending-publication message and no competitions.

## Publishing

The public `satuminton` slug currently resolves to organization ID 8. Confirm it
is the intended organization before deployment. Its current API name is
`Satuminton`; only this storefront's display name is overridden.
Deploy the API changes that expose public cups before deploying this storefront.
Set `NEXT_PUBLIC_SITE_URL` to the actual storefront origin. Detail pages for
unknown or unpublished competitions return 404; the main page has a branded
pending-publication state.
