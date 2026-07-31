"use client";

import { useSettings } from "@/components/admin/settings-context";

interface ComingSoonPageProps {
  locale: "th" | "en";
}

export function ComingSoonPage({ locale }: ComingSoonPageProps) {
  const settings = useSettings();
  const siteName = settings?.name || process.env.NEXT_PUBLIC_SITE_NAME || "UnFake News";

  return (
    <div className="relative min-h-screen w-full bg-[#0d1b2a] overflow-hidden">
      {/* Background Image — ติดขอบบน กว้างเต็มจอ แสดงครบ */}
      <div className="absolute top-0 left-0 right-0 w-full" style={{ height: "100vh" }}>
        <img
          src="/siamheritage-soon.jpg"
          alt=""
          className="w-full h-full"
          style={{ objectFit: "contain", objectPosition: "top center" }}
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.style.background = "linear-gradient(180deg, #0a1628 0%, #1a2a4a 100%)";
            }
          }}
        />
      </div>

        {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-white/40 text-[clamp(0.65rem,1.2vw,0.875rem)]">
          Powered by Thai Defend , The group of Thai Culture Lover.
          &copy; {new Date().getFullYear()} {siteName}.{" "}
          "All rights reserved."
        </p>
      </div>
    </div>
  );
}
