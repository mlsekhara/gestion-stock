/**
 * AdSign — enseigne lumineuse « storefront » de la marque AD Phone
 * (recréation de screenshots/storefront.png du handoff Claude Design).
 * Badge (icône) + wordmark « AD Phone » + tagline, dans un panneau à halo néon.
 */
import AdBadge from "./AdBadge";
import { brand } from "@/app/theme";

interface Props {
  badgeSize?: number;
  wordmarkSize?: number | string;
  tagline?: string;
  taglineAr?: string | null;
  glow?: boolean;
  style?: React.CSSProperties;
}

export default function AdSign({
  badgeSize = 64,
  wordmarkSize = "clamp(30px, 8vw, 44px)",
  tagline = "Vente · Réparation · Accessoires",
  taglineAr = "بيع · إصلاح · إكسسوارات",
  glow = true,
  style,
}: Props) {
  return (
    <div
      style={{
        position: "relative",
        background: "oklch(0.115 0.015 265)",
        border: "1px solid oklch(0.3 0.03 265)",
        borderRadius: 16,
        padding: "30px clamp(28px, 6vw, 60px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        boxShadow: glow
          ? `0 0 70px color-mix(in oklab, ${brand.cyan} 26%, transparent),` +
            `0 0 110px color-mix(in oklab, ${brand.magenta} 18%, transparent),` +
            `0 30px 60px rgba(0,0,0,0.5)`
          : "0 18px 40px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <AdBadge size={badgeSize} />
        <div
          style={{
            fontFamily: brand.fontDisplay,
            fontSize: wordmarkSize,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              background: brand.ringGradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            AD
          </span>
          <span style={{ color: brand.mist, fontWeight: 500 }}> Phone</span>
        </div>
      </div>
      <div
        style={{
          fontFamily: brand.fontMono,
          fontSize: "clamp(10px, 2.6vw, 13px)",
          letterSpacing: "0.34em",
          textIndent: "0.34em",
          textTransform: "uppercase",
          color: "oklch(0.8 0.02 265)",
          textAlign: "center",
        }}
      >
        {tagline}
      </div>
      {taglineAr && (
        <div
          dir="rtl"
          style={{
            fontFamily: brand.fontArabic,
            fontSize: "clamp(12px, 3vw, 15px)",
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: "oklch(0.82 0.04 195)",
            textAlign: "center",
          }}
        >
          {taglineAr}
        </div>
      )}
    </div>
  );
}
