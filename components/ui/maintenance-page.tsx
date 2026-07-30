// ============================================================
// Maintenance Mode Page
// ============================================================
// แสดงเมื่อตั้งค่า maintenanceMode = true ใน /admin/settings
// ============================================================

import { Wrench } from "lucide-react";

interface MaintenancePageProps {
  message?: string;
  locale?: string;
}

export function MaintenancePage({ message, locale = "en" }: MaintenancePageProps) {
  const isThai = locale === "th";

  const title = isThai
    ? "อยู่ระหว่างการปรับปรุงระบบ"
    : "Under Maintenance";

  const description = message || (isThai
    ? "เรากำลังปรับปรุงระบบเพื่อประสบการณ์ที่ดีขึ้นของคุณ กรุณากลับมาใหม่ในภายหลัง ขออภัยในความไม่สะดวก 🙏"
    : "We are currently performing scheduled maintenance to improve your experience. Please check back soon. Thank you for your patience! 🙏");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0d1b2a] to-[#060e1a]">
      <div className="text-center px-6 max-w-lg">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center animate-pulse">
              <Wrench size={48} className="text-amber-400" />
            </div>
            {/* Spinning ring */}
            <div className="absolute -top-1 -left-1 w-26 h-26 rounded-full border-2 border-transparent border-t-amber-400/40 border-r-amber-400/20 animate-spin" 
                 style={{ width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', top: '-4px', left: '-4px' }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {title}
        </h1>

        {/* Description */}
        <p className="text-white/60 text-sm md:text-base leading-relaxed mb-8">
          {description}
        </p>

        {/* Progress bar animation */}
        <div className="w-full max-w-xs mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 animate-[loading_2s_ease-in-out_infinite]" 
               style={{ width: '30%' }} />
        </div>

        {/* Footer note */}
        <p className="text-white/20 text-xs mt-8">
          SiamHeritage.org
        </p>
      </div>

      {/* Keyframes for loading animation */}
      <style>{`
        @keyframes loading {
          0% { width: 20%; margin-left: 0; }
          50% { width: 60%; margin-left: 40%; }
          100% { width: 20%; margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
