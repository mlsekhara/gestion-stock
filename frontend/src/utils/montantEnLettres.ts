const UNITES = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const DIX_A_VINGT = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const DIZAINES = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

function deuxChiffres(n: number): string {
  if (n === 0) return "";
  if (n < 10) return UNITES[n];
  if (n < 20) return DIX_A_VINGT[n - 10];
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7 || d === 9) {
    const base = DIZAINES[d];
    const reste = n - d * 10 + 10;
    if (reste === 11 && d === 7) return base + " et onze";
    return base + "-" + DIX_A_VINGT[reste - 10];
  }
  if (u === 0) {
    if (d === 8) return "quatre-vingts";
    return DIZAINES[d];
  }
  if (u === 1 && d !== 8) return DIZAINES[d] + " et un";
  return DIZAINES[d] + "-" + UNITES[u];
}

function troisChiffres(n: number): string {
  if (n === 0) return "";
  if (n < 100) return deuxChiffres(n);
  const c = Math.floor(n / 100);
  const r = n % 100;
  let result = c === 1 ? "cent" : UNITES[c] + " cent";
  if (r === 0 && c > 1) return result + "s";
  if (r > 0) result += " " + deuxChiffres(r);
  return result;
}

export function montantEnLettres(montant: number, devise = "Dinar Algérien"): string {
  if (montant === 0) return "zéro " + devise;

  const entier = Math.floor(Math.abs(montant));
  const centimes = Math.round((Math.abs(montant) - entier) * 100);

  const blocs: { val: number; label: string; pluriel: string }[] = [
    { val: 1_000_000_000, label: "milliard", pluriel: "milliards" },
    { val: 1_000_000, label: "million", pluriel: "millions" },
    { val: 1_000, label: "mille", pluriel: "mille" },
    { val: 1, label: "", pluriel: "" },
  ];

  let result = "";
  let reste = entier;

  for (const { val, label, pluriel } of blocs) {
    const q = Math.floor(reste / val);
    reste = reste % val;
    if (q === 0) continue;
    if (val === 1) {
      result += troisChiffres(q);
    } else if (val === 1000 && q === 1) {
      result += "mille";
    } else {
      const txt = troisChiffres(q);
      result += txt + " " + (q > 1 ? pluriel : label);
    }
    if (reste > 0) result += " ";
  }

  result = result.trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);
  result += " " + devise;

  if (centimes > 0) {
    result += " et " + deuxChiffres(centimes) + " centimes";
  }

  return result;
}
