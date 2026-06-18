/**
 * AdBadge — marque AD Phone (handoff Claude Design, recréation fidèle de AdBadge.dc.html).
 * Anneau conique dual-tone (cyan→magenta), disque « void », monogramme A/D,
 * et label PHONE optionnel. Toutes les mesures sont proportionnelles à `size`.
 */
import { brand } from "@/app/theme";

interface Props {
  size?: number;
  full?: boolean; // affiche le label PHONE
  cy?: string; // surcharge cyan (variantes mono)
  mg?: string; // surcharge magenta
  disc?: string; // couleur du disque
  ink?: string; // couleur du label PHONE
  style?: React.CSSProperties;
}

export default function AdBadge({
  size = 96,
  full = false,
  cy = brand.cyan,
  mg = brand.magenta,
  disc = "oklch(0.15 0.02 265)",
  ink = "oklch(0.96 0.005 265)",
  style,
}: Props) {
  const s = size;
  const mix = (c: string, pct: number) => `color-mix(in oklab, ${c} ${pct}%, transparent)`;

  return (
    <div
      style={{
        position: "relative",
        width: s,
        height: s,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        ...style,
      }}
    >
      {/* anneau néon */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `conic-gradient(from 215deg, ${cy}, ${mg} 50%, ${cy})`,
          boxShadow: `0 0 ${0.08 * s}px ${mix(cy, 55)}, 0 0 ${0.17 * s}px ${mix(mg, 38)}`,
        }}
      />
      {/* disque intérieur */}
      <div
        style={{
          position: "absolute",
          inset: 0.064 * s,
          borderRadius: "50%",
          background: disc,
          boxShadow: `inset 0 0 ${0.1 * s}px rgba(0,0,0,0.55)`,
        }}
      />
      {/* contenu */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.026 * s,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 0.04 * s,
            fontFamily: brand.fontDisplay,
            fontWeight: 600,
            fontSize: 0.31 * s,
            lineHeight: 0.78,
            letterSpacing: "0.01em",
          }}
        >
          <span style={{ color: cy, textShadow: `0 0 ${0.035 * s}px ${mix(cy, 70)}` }}>A</span>
          <span style={{ color: mg, textShadow: `0 0 ${0.035 * s}px ${mix(mg, 70)}` }}>D</span>
        </div>
        {full && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.026 * s }}>
            <div
              style={{
                width: 0.25 * s,
                height: Math.max(1, 0.005 * s),
                background: `linear-gradient(90deg, transparent, ${cy}, ${mg}, transparent)`,
              }}
            />
            <div
              style={{
                fontFamily: brand.fontMono,
                fontSize: 0.084 * s,
                fontWeight: 400,
                letterSpacing: "0.55em",
                textIndent: "0.55em",
                color: ink,
              }}
            >
              PHONE
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
