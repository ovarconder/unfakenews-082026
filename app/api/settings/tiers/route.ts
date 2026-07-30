// ============================================================


// GET /api/settings/tiers
// ============================================================
// Returns current locale tier configuration
// Used by frontend to know which locales to auto-translate
// ============================================================

import { NextResponse } from "next/server";
import { getActiveLocales, getTier1Locales, getTier2Locales, getLocaleTiers } from "@/lib/locales";
import { getSettings } from "@/lib/site-settings";

export async function GET() {
  try {
    // Force reload from DB to get latest tiers
    const settings = await getSettings();

    return NextResponse.json({
      tiers: getLocaleTiers(),
      activeLocales: getActiveLocales(),
      tier1Locales: getTier1Locales(),
      tier2Locales: getTier2Locales(),
    });
  } catch (err) {
    console.error("[Settings/Tiers] Error:", err);
    return NextResponse.json(
      { error: "Failed to load tier configuration" },
      { status: 500 }
    );
  }
}
