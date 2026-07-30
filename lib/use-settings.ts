// ============================================================
// Settings Provider — ใช้แทน hardcode site name/logo/meta
// ============================================================
// 
// วิธีใช้ (Server Component):
//   import { getSettings } from "@/lib/site-settings";
//   const settings = getSettings();
//   <title>{settings.metaTitle}</title>
//
// วิธีใช้ (Client Component):
//   import { useSettings } from "@/components/admin/settings-context";
//   const settings = useSettings();
//   <h1>{settings.siteName}</h1>
//
// ============================================================
// TODO: 
//   - layout.tsx → เรียก getSettings() แทน hardcode
//   - header.tsx  → เรียก getSettings() แทน hardcode logo/name
//   - footer.tsx  → เรียก getSettings() แทน hardcode copyright
//   - sidebar.tsx → เรียก getSettings() แทน hardcode logo
//   - login page → เรียก getSettings() แทน hardcode logo
//   - contact page → เรียก getSettings() แทน hardcode email
//   - schema-article.tsx → ใช้ settings.url แทน SITE_URL
//   - constants.ts → merge หรือเอา settings แทน
// ============================================================
