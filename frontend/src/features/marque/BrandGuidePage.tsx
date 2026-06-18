/**
 * Charte de marque AD Phone — bilingue Français + Arabe (RTL, police Cairo).
 * Recréation de « AD Phone Brand.dc.html » (handoff Claude Design, localisation FR/AR).
 */
import { Link } from "react-router-dom";
import { ArrowLeftOutlined } from "@ant-design/icons";
import AdBadge from "@/components/AdBadge";
import AdSign from "@/components/AdSign";
import { brand } from "@/app/theme";

const CY = "oklch(0.86 0.15 195)";
const MG = "oklch(0.70 0.23 340)";
const VOID = "oklch(0.145 0.018 265)";
const CARBON = "oklch(0.185 0.02 265)";
const STEEL = "oklch(0.27 0.022 265)";
const INK = "oklch(0.97 0.005 265)";
const MUTED = "oklch(0.7 0.02 265)";
const MUTED2 = "oklch(0.6 0.02 265)";

const F_DISPLAY = brand.fontDisplay;
const F_MONO = brand.fontMono;
const F_AR = brand.fontArabic;

const wrap: React.CSSProperties = { position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto" };
const arBlock = (size: number, color: string, weight = 600): React.CSSProperties => ({
  fontFamily: F_AR,
  fontSize: size,
  fontWeight: weight,
  color,
  lineHeight: 1.8,
});

function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <span style={{ fontFamily: F_DISPLAY, fontSize: size, fontWeight: 600, lineHeight: 1, letterSpacing: "0.01em" }}>
      <span style={{ background: `linear-gradient(90deg, ${CY}, ${MG})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
        AD
      </span>
      <span style={{ color: INK, fontWeight: 500 }}> Phone</span>
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: F_MONO, fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", color: CY }}>
      {children}
    </span>
  );
}

function Caption({ fr, ar, light }: { fr: string; ar: string; light?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, textAlign: "center" }}>
      <span style={{ fontFamily: F_MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: light ? "oklch(0.45 0.02 265)" : MUTED2 }}>
        {fr}
      </span>
      <span dir="rtl" style={{ fontFamily: F_AR, fontSize: 12, color: light ? "oklch(0.5 0.02 265)" : "oklch(0.56 0.02 265)" }}>
        {ar}
      </span>
    </div>
  );
}

const card: React.CSSProperties = {
  background: CARBON,
  border: `1px solid ${STEEL}`,
  borderRadius: 18,
  padding: 34,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 24,
};

function Swatch({ nom, hex, fr }: { nom: string; hex: string; fr: string }) {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${STEEL}`, background: CARBON }}>
      <div style={{ height: 104, background: hex, boxShadow: `inset 0 0 50px color-mix(in oklab, ${hex} 60%, white)` }} />
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>{nom}</span>
        <span style={{ fontFamily: F_MONO, fontSize: 11, color: MUTED2 }}>{hex}</span>
        <span style={{ fontSize: 12.5, color: MUTED }}>{fr}</span>
      </div>
    </div>
  );
}

export default function BrandGuidePage() {
  return (
    <div style={{ background: VOID, minHeight: "100vh", fontFamily: F_DISPLAY, color: INK, position: "relative", overflow: "hidden" }}>
      {/* lueurs ambiantes */}
      <div
        style={{
          position: "absolute", top: -140, left: "50%", transform: "translateX(-50%)", width: 820, height: 560,
          background: `radial-gradient(circle at 34% 36%, color-mix(in oklab, ${CY} 24%, transparent), transparent 60%), radial-gradient(circle at 70% 64%, color-mix(in oklab, ${MG} 22%, transparent), transparent 60%)`,
          filter: "blur(34px)", pointerEvents: "none", zIndex: 0,
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 3px)", pointerEvents: "none", zIndex: 1, mixBlendMode: "overlay" }} />

      {/* top bar */}
      <div style={{ ...wrap, padding: "26px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: F_MONO, fontSize: 12, letterSpacing: "0.22em", color: MUTED2, textTransform: "uppercase" }}>
        <Link to="/" style={{ color: CY, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ArrowLeftOutlined /> Application
        </Link>
        <span>AD Phone — Système de marque</span>
        <span>v1.0 / 2026</span>
      </div>

      {/* HERO */}
      <section style={{ ...wrap, padding: "48px 40px 96px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 38 }}>
        <AdBadge size={300} full />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <h1 style={{ margin: 0, fontSize: 66, fontWeight: 600, letterSpacing: "0.005em", lineHeight: 1 }}>
            <span style={{ background: `linear-gradient(90deg, ${CY}, ${MG})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>AD</span>
            <span style={{ color: INK, fontWeight: 500 }}> Phone</span>
          </h1>
          <div style={{ fontFamily: F_MONO, fontSize: 14, letterSpacing: "0.5em", textIndent: "0.5em", color: MUTED, textTransform: "uppercase" }}>Vente · Réparation</div>
          <div dir="rtl" style={{ fontFamily: F_AR, fontSize: 18, fontWeight: 600, letterSpacing: "0.04em", color: "oklch(0.78 0.06 195)" }}>بيع · إصلاح</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, maxWidth: 600 }}>
          <p style={{ margin: 0, maxWidth: 560, fontSize: 17, lineHeight: 1.65, color: MUTED }}>
            L'énergie néon d'origine, repensée avec intention — un anneau bicolore précis, un monogramme équilibré et une lueur maîtrisée qui tient aussi bien sur une enseigne lumineuse que sur un avatar de 48 pixels.
          </p>
          <p dir="rtl" style={{ margin: 0, maxWidth: 560, ...arBlock(16, "oklch(0.66 0.02 265)") }}>
            طاقة النيون الأصلية، أُعيد بناؤها بعناية — حلقة دقيقة ثنائية اللون، وحرف مدمج متوازن، وتوهّج محكوم يصمد من لافتة المتجر المضيئة وصولًا إلى صورة ملف شخصي بحجم 48 بكسل.
          </p>
        </div>
      </section>

      {/* 01 LE LOGO */}
      <section style={{ ...wrap, padding: "72px 40px", borderTop: `1px solid oklch(0.26 0.022 265)` }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          <SectionLabel>01 / Le logo · الشعار</SectionLabel>
          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 600 }}>Un seul logo, toutes les surfaces</h2>
          <div dir="rtl" style={arBlock(24, "oklch(0.88 0.01 265)")}>شعار واحد، لكل الأسطح</div>
          <p style={{ margin: "8px 0 0", maxWidth: 580, fontSize: 16, lineHeight: 1.6, color: MUTED }}>
            Conçu pour rester lisible et électrique en couleur, en monogramme plat, en monochrome et inversé sur fond clair.
          </p>
          <p dir="rtl" style={{ margin: 0, maxWidth: 580, ...arBlock(15, "oklch(0.64 0.02 265)") }}>
            مُصمَّم ليبقى واضحًا ونابضًا بالحياة بالألوان الكاملة، وكأيقونة أحادية، وبلون واحد، ومعكوسًا على خلفية فاتحة.
          </p>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          <div style={card}>
            <AdBadge size={148} full />
            <Caption fr="Principal · couleur" ar="الأساسي · بالألوان" />
          </div>
          <div style={card}>
            <AdBadge size={148} />
            <Caption fr="Icône · monogramme" ar="أيقونة · الحرف" />
          </div>
          <div style={{ ...card, background: "oklch(0.125 0.015 265)" }}>
            <AdBadge size={148} full cy={INK} mg={INK} />
            <Caption fr="Monochrome · inversé" ar="أحادي · معكوس" />
          </div>
          <div style={{ ...card, background: "oklch(0.95 0.004 265)", border: "1px solid oklch(0.85 0.01 265)" }}>
            <AdBadge size={148} full cy="oklch(0.30 0.03 265)" mg="oklch(0.30 0.03 265)" disc="oklch(0.95 0.004 265)" ink="oklch(0.30 0.03 265)" />
            <Caption fr="Sur fond clair" ar="على خلفية فاتحة" light />
          </div>
        </div>

        {/* lockup horizontal */}
        <div style={{ marginTop: 20, background: CARBON, border: `1px solid ${STEEL}`, borderRadius: 18, padding: "42px 52px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <AdBadge size={64} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Wordmark size={30} />
              <div style={{ fontFamily: F_MONO, fontSize: 10, letterSpacing: "0.36em", textTransform: "uppercase", color: MUTED2 }}>Vente · Réparation</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, textAlign: "right" }}>
            <span style={{ fontFamily: F_MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "oklch(0.55 0.02 265)" }}>Verrouillage horizontal</span>
            <span dir="rtl" style={{ fontFamily: F_AR, fontSize: 12, color: "oklch(0.55 0.02 265)" }}>التركيب الأفقي</span>
          </div>
        </div>
      </section>

      {/* 02 COULEUR */}
      <section style={{ ...wrap, padding: "72px 40px", borderTop: `1px solid oklch(0.26 0.022 265)` }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          <SectionLabel>02 / Couleur · الألوان</SectionLabel>
          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 600 }}>Deux néons sur un noir profond</h2>
          <div dir="rtl" style={arBlock(24, "oklch(0.88 0.01 265)")}>نيونان على سواد عميق</div>
          <p style={{ margin: "8px 0 0", maxWidth: 580, fontSize: 16, lineHeight: 1.6, color: MUTED }}>
            Le cyan et le magenta portent la marque ; tout le reste est une échelle de bleu quasi noir qui fait briller les accents. Les valeurs sont en oklch pour une luminosité perçue constante.
          </p>
          <p dir="rtl" style={{ margin: 0, maxWidth: 580, ...arBlock(15, "oklch(0.64 0.02 265)") }}>
            السماوي والأرجواني يحملان العلامة، وكل ما تبقّى هو تدرّج أزرق شبه أسود يُبرز الألوان المميّزة. القيم بصيغة oklch لثبات السطوع المُدرَك.
          </p>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <Swatch nom="Cyan néon · سماوي" hex="oklch(0.86 0.15 195)" fr="Début de l'anneau · le « A » · accent principal" />
          <Swatch nom="Magenta néon · أرجواني" hex="oklch(0.70 0.23 340)" fr="Fin de l'anneau · le « D » · accent secondaire" />
          <Swatch nom="Noir profond · أسود عميق" hex="oklch(0.145 0.018 265)" fr="Fond principal · disque" />
          <Swatch nom="Carbone · كربون" hex="oklch(0.20 0.022 265)" fr="Cartes · surfaces en relief" />
          <Swatch nom="Acier · فولاذ" hex="oklch(0.32 0.028 265)" fr="Bordures · filets · séparateurs" />
          <Swatch nom="Brume · ضباب" hex="oklch(0.97 0.005 265)" fr="Texte principal · mot « Phone »" />
        </div>
      </section>

      {/* 03 TYPOGRAPHIE */}
      <section style={{ ...wrap, padding: "72px 40px", borderTop: `1px solid oklch(0.26 0.022 265)` }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          <SectionLabel>03 / Typographie · الخطوط</SectionLabel>
          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 600 }}>Voix géométrique, détail technique</h2>
          <div dir="rtl" style={arBlock(24, "oklch(0.88 0.01 265)")}>صوت هندسي، تفصيل تقني</div>
        </header>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {/* Space Grotesk */}
          <div style={{ ...card, alignItems: "stretch" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
              <span style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 96, lineHeight: 0.8, color: INK }}>Aa</span>
              <span style={{ fontFamily: F_MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED2, textAlign: "right" }}>Display<br />Logo · Titres</span>
            </div>
            <div style={{ fontFamily: F_DISPLAY, fontSize: 21, fontWeight: 500, color: "oklch(0.9 0.01 265)" }}>Vente et réparation, bien faites.</div>
            <span style={{ fontFamily: F_DISPLAY, fontSize: 20, fontWeight: 600, color: INK }}>Space Grotesk</span>
          </div>
          {/* Cairo */}
          <div dir="rtl" style={{ ...card, alignItems: "stretch" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
              <span style={{ fontFamily: F_AR, fontWeight: 700, fontSize: 88, lineHeight: 0.9, color: INK }}>أ ب</span>
              <span style={{ fontFamily: F_MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED2, textAlign: "left", direction: "ltr" }}>Arabe<br />Titres · Texte</span>
            </div>
            <div style={{ fontFamily: F_AR, fontSize: 21, fontWeight: 500, color: "oklch(0.9 0.01 265)" }}>بيع وإصلاح، بإتقان.</div>
            <span style={{ fontFamily: F_AR, fontSize: 20, fontWeight: 700, color: INK }}>خط Cairo</span>
          </div>
          {/* Space Mono */}
          <div style={{ ...card, alignItems: "stretch" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
              <span style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 96, lineHeight: 0.8, color: INK }}>Aa</span>
              <span style={{ fontFamily: F_MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: MUTED2, textAlign: "right" }}>Mono<br />Étiquettes · Specs</span>
            </div>
            <div style={{ fontFamily: F_MONO, fontSize: 15, letterSpacing: "0.08em", color: "oklch(0.9 0.01 265)" }}>MODÈLE · IMEI · GARANTIE</div>
            <span style={{ fontFamily: F_MONO, fontSize: 20, fontWeight: 700, color: INK }}>Space Mono</span>
          </div>
        </div>
      </section>

      {/* 04 APPLICATIONS */}
      <section style={{ ...wrap, padding: "72px 40px 40px", borderTop: `1px solid oklch(0.26 0.022 265)` }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
          <SectionLabel>04 / En situation · في الواقع</SectionLabel>
          <h2 style={{ margin: 0, fontSize: 34, fontWeight: 600 }}>Où il vit</h2>
          <div dir="rtl" style={arBlock(24, "oklch(0.88 0.01 265)")}>أين يعيش</div>
        </header>

        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 20, marginBottom: 20 }}>
          {/* avatar social */}
          <div style={{ background: CARBON, border: `1px solid ${STEEL}`, borderRadius: 18, padding: 30, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "oklch(0.13 0.016 265)", border: "1px solid oklch(0.26 0.022 265)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: 78, background: `radial-gradient(circle at 30% 120%, color-mix(in oklab, ${CY} 45%, transparent), transparent 55%), radial-gradient(circle at 80% 130%, color-mix(in oklab, ${MG} 45%, transparent), transparent 55%), oklch(0.17 0.02 265)` }} />
              <div style={{ padding: "0 22px 22px", marginTop: -44, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div style={{ width: 84, height: 84, borderRadius: "50%", padding: 4, background: "oklch(0.13 0.016 265)" }}>
                    <AdBadge size={76} full />
                  </div>
                  <button style={{ fontFamily: F_MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: CY, background: "transparent", border: `1px solid ${CY}`, borderRadius: 999, padding: "9px 18px", cursor: "pointer" }}>Message</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>AD Phone</span>
                  <span style={{ fontFamily: F_MONO, fontSize: 12, color: MUTED2 }}>@adphone</span>
                  <span style={{ fontSize: 13.5, color: MUTED, marginTop: 5 }}>Vente &amp; réparation · boutique locale de confiance</span>
                  <span dir="rtl" style={{ fontFamily: F_AR, fontSize: 13, color: "oklch(0.66 0.02 265)", marginTop: 2 }}>بيع وإصلاح الهواتف · متجر محلي موثوق</span>
                </div>
              </div>
            </div>
            <Caption fr="Avatar & profil" ar="الصورة الرمزية والملف" />
          </div>

          {/* cartes de visite */}
          <div style={{ background: CARBON, border: `1px solid ${STEEL}`, borderRadius: 18, padding: 30, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, flex: 1 }}>
              <div style={{ aspectRatio: "1.72 / 1", borderRadius: 13, background: `radial-gradient(circle at 50% 140%, color-mix(in oklab, ${MG} 28%, transparent), transparent 60%), oklch(0.135 0.016 265)`, border: "1px solid oklch(0.3 0.025 265)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 40px rgba(0,0,0,0.45)" }}>
                <AdBadge size={92} full />
              </div>
              <div style={{ aspectRatio: "1.72 / 1", borderRadius: 13, background: "oklch(0.135 0.016 265)", border: "1px solid oklch(0.3 0.025 265)", padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 18px 40px rgba(0,0,0,0.45)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <AdBadge size={38} />
                  <Wordmark size={17} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3, fontFamily: F_MONO, fontSize: 9.5, letterSpacing: "0.04em", color: "oklch(0.68 0.02 265)" }}>
                  <span>+00 000 00 00 00</span>
                  <span>hello@adphone.store</span>
                  <span>00 Rue Example · Votre Ville</span>
                </div>
              </div>
            </div>
            <Caption fr="Carte de visite · recto & verso" ar="بطاقة العمل · الوجهان" />
          </div>
        </div>

        {/* enseigne storefront */}
        <div style={{ background: CARBON, border: `1px solid ${STEEL}`, borderRadius: 18, padding: 30, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ position: "relative", height: 330, borderRadius: 14, overflow: "hidden", background: "linear-gradient(180deg, oklch(0.24 0.012 265), oklch(0.13 0.012 265))", border: "1px solid oklch(0.28 0.02 265)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0px, rgba(255,255,255,0.018) 1px, transparent 1px, transparent 90px)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 120, background: "linear-gradient(180deg, rgba(255,255,255,0.05), transparent)" }} />
            <AdSign badgeSize={72} wordmarkSize={44} />
            <div style={{ position: "absolute", left: "50%", bottom: 0, transform: "translateX(-50%)", width: 480, height: 60, background: `radial-gradient(ellipse at center, color-mix(in oklab, ${CY} 22%, transparent), transparent 70%)`, filter: "blur(8px)" }} />
          </div>
          <Caption fr="Enseigne lumineuse" ar="لافتة المتجر المضيئة" />
        </div>
      </section>

      {/* footer */}
      <footer style={{ ...wrap, padding: "30px 40px 48px", borderTop: `1px solid oklch(0.26 0.022 265)`, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: F_MONO, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "oklch(0.5 0.02 265)" }}>
        <span>AD Phone — Système de marque</span>
        <span>Néon, raffiné · 2026</span>
      </footer>
    </div>
  );
}
