# UnFakeNews

โค้ดชุดเดียวสำหรับเครือข่ายเว็บ fact-check 5 เว็บ: unfakenews.asia (หลัก), unmask.asia, factbase.asia, contextasia.org, debunk.asia
แต่ละเว็บแยก Vercel project และ Supabase project กัน

Next.js 14 · TypeScript · Tailwind CSS · Supabase · Gemini (แปลภาษา)

```bash
npm install
npm run dev
```

ต้องตั้ง env อย่างน้อย `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

- เอกสารทั้งหมด: [docs/README.md](docs/README.md) (เริ่มที่ [overview](docs/2026-11-01-overview.md))
- ข้อกำหนดสำหรับ AI agent: [AGENTS.md](AGENTS.md)
