// Palette de marque AD Phone — système raffiné (handoff Claude Design).
// Deux néons sur une échelle bleu quasi-noir, valeurs en oklch.
export const brand = {
  // Néons de la marque
  cyan: "oklch(0.86 0.15 195)", // Neon Cyan — anneau (début) · le « A »
  magenta: "oklch(0.70 0.23 340)", // Neon Magenta — anneau (fin) · le « D »
  // Teinte cyan plus profonde, lisible pour boutons/éléments primaires.
  // En HEX : les tokens de thème Ant Design ne savent pas parser oklch().
  cyanDeep: "#0c97a6",
  magentaDeep: "#b81f8f",
  // Échelle sombre
  void: "oklch(0.145 0.018 265)", // fond principal · disque du badge
  carbon: "oklch(0.20 0.022 265)", // cartes · surfaces surélevées
  steel: "oklch(0.32 0.028 265)", // bordures · filets
  mist: "oklch(0.97 0.005 265)", // texte principal · wordmark « Phone »
  // Alias rétro-compatibles (barre latérale / fonds)
  dark: "oklch(0.20 0.022 265)",
  darker: "oklch(0.135 0.016 265)",
  darkest: "oklch(0.10 0.012 265)",
  // Polices de la marque
  fontDisplay: "'Space Grotesk', system-ui, sans-serif",
  fontMono: "'Space Mono', ui-monospace, monospace",
  fontArabic: "'Cairo', system-ui, sans-serif",
  // Dégradés réutilisables
  ringGradient: "linear-gradient(135deg, oklch(0.86 0.15 195), oklch(0.70 0.23 340))",
  loginBg:
    "radial-gradient(900px 520px at 32% -12%, color-mix(in oklab, oklch(0.86 0.15 195) 20%, transparent), transparent 60%)," +
    "radial-gradient(900px 520px at 76% 116%, color-mix(in oklab, oklch(0.70 0.23 340) 20%, transparent), transparent 60%)," +
    "oklch(0.145 0.018 265)",
} as const;
