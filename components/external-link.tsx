// ============================================================
// ExternalLink Component
// ============================================================
// ใช้แทน <a> สำหรับลิงก์ไปยังเว็บภายนอก
// - เปิดใน tab ใหม่ (target="_blank")
// - rel="noopener noreferrer" เพื่อความปลอดภัย
// - แสดง icon บอกว่าเป็น external link
// - ติดตามคลิกเพื่อ analytics (optional)

import { ExternalLink as ExternalLinkIcon } from "lucide-react";

interface ExternalLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

// รายชื่อ domain ที่ถือว่าเป็น trusted / authoritative
export const TRUSTED_DOMAINS = [
  "go.th",           // หน่วยงานราชการไทย
  "ac.th",           // สถาบันการศึกษาไทย
  "in.th",           // องค์กรไทยอื่นๆ
  "or.th",           // องค์กรไม่แสวงผลกำไร
  "unesco.org",      // UNESCO
  "wipo.int",        // WIPO
  "who.int",         // WHO
  "un.org",          // UN
  "worldbank.org",   // World Bank
  "wikipedia.org",   // Wikipedia
  "britannica.com",  // Britannica
  "doi.org",         // Digital Object Identifier
  "scholar.google.com", // Google Scholar
  "researchgate.net",   // ResearchGate
  "academia.edu",       // Academia
];

export function isTrustedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return TRUSTED_DOMAINS.some(domain => hostname.endsWith(domain));
  } catch {
    return false;
  }
}

export function getDomainLabel(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname;
  } catch {
    return url;
  }
}

export default function ExternalLink({
  href,
  children,
  className = "",
  showIcon = true,
}: ExternalLinkProps) {
  const isExternal = href.startsWith("http://") || href.startsWith("https://");
  const isTrusted = isExternal && isTrustedDomain(href);

  if (!isExternal) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 transition-all ${
        isTrusted
          ? "text-amber-300 hover:text-amber-200"
          : "text-blue-300 hover:text-blue-200"
      } ${className}`}
      title={`${isTrusted ? "🔗 แหล่งอ้างอิงที่เชื่อถือได้" : "ลิงก์ภายนอก"} - ${getDomainLabel(href)}`}
    >
      {children}
      {showIcon && (
        <ExternalLinkIcon size={12} className="opacity-50 group-hover:opacity-100" />
      )}
      {isTrusted && (
        <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/10 text-green-400/70">
          .gov / .edu
        </span>
      )}
    </a>
  );
}
