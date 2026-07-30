import Link from "next/link";
import { Metadata } from "next";
import { getSettings } from "@/lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: `404 - Page Not Found | ${settings.name}`,
  };
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1b2a]">
      <div className="text-center px-4">
        <h1 className="text-9xl font-bold text-amber-300/80 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-white mb-4">Page Not Found</h2>
        <p className="text-white/60 max-w-md mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/en"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-amber-300/90 text-[#0a1628] hover:bg-amber-300 transition-colors font-semibold"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}

