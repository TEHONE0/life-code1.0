# Life Code · 生命代码

AI-powered psychological analysis report. Users fill out a survey, pay, and receive a personalized deep analysis.

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Email OTP + Google OAuth)
- **AI**: DeepSeek API
- **Payment**: Shopify → PayPal → PingPong
- **Deploy**: Vercel

## Pages

| Route | Description |
|-------|-------------|
| `/[lang]` | Landing page |
| `/[lang]/survey` | 9-question survey |
| `/[lang]/payment` | Payment page (supports invite code) |
| `/[lang]/result` | AI-generated report |
| `/[lang]/account` | User account & reports |
| `/[lang]/admin` | Admin dashboard (invite codes + commissions) |
| `/[lang]/auth` | Login / signup |

## Languages

Supports `zh` (Chinese), `en` (English), `ko` (Korean).

## Invite Code System

- Admin generates invite codes at `/[lang]/admin`
- Users enter code at payment page for 12% discount ($7.83 instead of $8.90)
- Bloggers receive $2 fixed commission per sale, tracked automatically

## Local Development

```bash
npm install
npm run dev
```

Requires `.env.local` with Supabase, DeepSeek, and Shopify credentials.
