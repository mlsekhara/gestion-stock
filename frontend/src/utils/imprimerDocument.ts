import { montantEnLettres } from "./montantEnLettres";

interface LigneDoc {
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
}

interface DocOptions {
  type: "facture" | "proforma" | "bon_livraison" | "bon_achat";
  reference: string;
  date: string;
  entreprise: { nom: string; adresse?: string; telephone?: string };
  tiers?: { label: string; nom: string; adresse?: string; telephone?: string } | null;
  lignes: LigneDoc[];
  montant_total: number;
  montant_paye?: number;
  reste_a_payer?: number;
  devise?: string;
  note?: string;
}

const TITRE_TYPE: Record<string, string> = {
  facture: "FACTURE DE VENTE",
  proforma: "FACTURE PROFORMA",
  bon_livraison: "BON DE LIVRAISON",
  bon_achat: "BON D'ACHAT",
};

export function imprimerDocument(opts: DocOptions) {
  const devise = opts.devise ?? "DA";
  const titre = TITRE_TYPE[opts.type] ?? "DOCUMENT";
  const fmt = (n: number) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lettres = montantEnLettres(opts.montant_total, "Dinar Algérien");

  const lignesHtml = opts.lignes
    .map(
      (l, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${l.designation}</td>
      <td style="text-align:center">${Number(l.quantite).toLocaleString("fr-FR")}</td>
      <td style="text-align:right">${fmt(l.prix_unitaire)}</td>
      <td style="text-align:right">${fmt(l.montant)}</td>
    </tr>`
    )
    .join("");

  const tiersHtml = opts.tiers
    ? `<div style="border:1px solid #ccc;padding:10px;border-radius:4px;min-width:250px">
        <strong>${opts.tiers.label} :</strong><br/>
        <span style="font-size:16px;font-weight:600">${opts.tiers.nom}</span>
        ${opts.tiers.adresse ? `<br/><span style="color:#666">${opts.tiers.adresse}</span>` : ""}
        ${opts.tiers.telephone ? `<br/><span style="color:#666">Tél : ${opts.tiers.telephone}</span>` : ""}
       </div>`
    : "";

  const paiementHtml =
    opts.montant_paye !== undefined
      ? `<tr><td style="text-align:right;padding:4px 8px"><strong>Montant payé :</strong></td><td style="text-align:right;padding:4px 8px">${fmt(opts.montant_paye)} ${devise}</td></tr>
         <tr><td style="text-align:right;padding:4px 8px"><strong>Reste à payer :</strong></td><td style="text-align:right;padding:4px 8px;color:${(opts.reste_a_payer ?? 0) > 0 ? "#d32f2f" : "#2e7d32"}">${fmt(opts.reste_a_payer ?? 0)} ${devise}</td></tr>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${titre} ${opts.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #222; padding: 20px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 15mm; size: A4; }
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .entreprise { font-size: 18px; font-weight: 700; color: #1a237e; }
    .entreprise-info { font-size: 12px; color: #555; margin-top: 4px; }
    .doc-title { text-align: center; font-size: 20px; font-weight: 700; margin: 16px 0; padding: 8px; background: #f5f5f5; border: 2px solid #1a237e; color: #1a237e; }
    .ref-date { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
    .tiers-row { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
    table.lignes { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.lignes th { background: #1a237e; color: #fff; padding: 8px 6px; font-size: 12px; text-transform: uppercase; }
    table.lignes td { padding: 6px; border-bottom: 1px solid #ddd; font-size: 12px; }
    table.lignes tr:nth-child(even) { background: #fafafa; }
    .totaux { display: flex; justify-content: flex-end; margin-bottom: 12px; }
    .totaux table td { white-space: nowrap; }
    .lettres { font-style: italic; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 20px; font-size: 12px; }
    .footer { display: flex; justify-content: space-between; margin-top: 30px; }
    .signature { border-top: 1px solid #999; width: 200px; text-align: center; padding-top: 6px; font-size: 12px; color: #666; }
    .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 24px; background: #1a237e; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; z-index: 100; }
    .print-btn:hover { background: #283593; }
    ${opts.note ? ".note { font-size: 12px; color: #666; margin-bottom: 12px; }" : ""}
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer</button>

  <div class="header">
    <div>
      <div class="entreprise">${opts.entreprise.nom}</div>
      ${opts.entreprise.adresse ? `<div class="entreprise-info">${opts.entreprise.adresse}</div>` : ""}
      ${opts.entreprise.telephone ? `<div class="entreprise-info">Tél : ${opts.entreprise.telephone}</div>` : ""}
    </div>
  </div>

  <div class="doc-title">${titre} N°${opts.reference}</div>

  <div class="ref-date">
    <span></span>
    <span><strong>Date :</strong> ${opts.date}</span>
  </div>

  <div class="tiers-row">
    ${tiersHtml}
    <div></div>
  </div>

  ${opts.note ? `<div class="note"><strong>Note :</strong> ${opts.note}</div>` : ""}

  <table class="lignes">
    <thead>
      <tr>
        <th style="width:40px">N°</th>
        <th>Désignation</th>
        <th style="width:70px">Qté</th>
        <th style="width:100px">P.U HT</th>
        <th style="width:110px">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${lignesHtml}
    </tbody>
  </table>

  <div class="totaux">
    <table>
      <tr>
        <td style="text-align:right;padding:4px 8px;font-size:16px"><strong>Total :</strong></td>
        <td style="text-align:right;padding:4px 8px;font-size:16px;font-weight:700">${fmt(opts.montant_total)} ${devise}</td>
      </tr>
      ${paiementHtml}
    </table>
  </div>

  <div class="lettres">
    <strong>Arrêté le présent document à la somme de :</strong><br/>
    ${lettres}
  </div>

  <div class="footer">
    <div class="signature">Le client</div>
    <div class="signature">Cachet & Signature</div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
