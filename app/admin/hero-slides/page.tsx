// ============================================================
// Admin - Hero Slides Management
// ============================================================

import { createClient } from "@/lib/supabase-server";
import HeroSlidesClient from "./hero-slides-client";

export const dynamic = "force-dynamic";

export default async function HeroSlidesPage() {
  const supabase = await createClient();
  
  const { data: slides } = await supabase
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true });

  return <HeroSlidesClient slides={slides || []} />;
}
