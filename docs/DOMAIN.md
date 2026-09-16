# Domain Setup — kiku.is-a.dev (free, hot)

## Vercel first (instant)

```bash
vercel --prod
# → https://kiku.vercel.app
```

## is-a.dev (free subdomain)

1. Fork https://github.com/is-a-dev/register
2. Create file `domains/kiku.json` in your fork:

```json
{
  "owner": {
    "username": "YOUR_GITHUB_USERNAME",
    "email": "YOUR_EMAIL"
  },
  "record": {
    "CNAME": "cname.vercel-dns.com"
  },
  "proxied": true
}
```

3. PR to is-a-dev/register
4. After merge (few hours), Vercel → Settings → Domains → Add `kiku.is-a.dev` → auto SSL

If taken, try: `kiku-player.is-a.dev`, `kikuapp.is-a.dev`, or `kiku.is-a-good.dev` (same org).

## Cloudflare Pages alternative

```bash
npm run build
npx wrangler pages deploy dist --project-name=kiku
```

Add custom domain in Cloudflare dashboard.

## Verification

After deploy:
- GSC: https://search.google.com/search-console → add property → HTML tag method → paste code into index.html → redeploy → submit sitemap.xml
- OG test: https://www.opengraph.xyz/
- PageSpeed: https://pagespeed.web.dev/
