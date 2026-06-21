import type { ReleveData } from "@/api/releve";

export function imprimerReleve(data: ReleveData, entreprise: { nom: string; adresse?: string; telephone?: string }, devise = "DA") {
  const fmt = (n: number) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = new Date().toLocaleDateString("fr-FR");

  const periode = data.date_debut && data.date_fin
    ? `Du ${new Date(data.date_debut).toLocaleDateString("fr-FR")} au ${new Date(data.date_fin).toLocaleDateString("fr-FR")}`
    : data.date_debut
      ? `À partir du ${new Date(data.date_debut).toLocaleDateString("fr-FR")}`
      : data.date_fin
        ? `Jusqu'au ${new Date(data.date_fin).toLocaleDateString("fr-FR")}`
        : "Toutes les opérations";

  const lignesHtml = data.entries
    .map(
      (e) => `
    <tr class="${e.type === "paiement" ? "paiement-row" : ""}">
      <td style="text-align:center">${e.date}</td>
      <td>${e.designation}</td>
      <td style="text-align:center">${e.reference}</td>
      <td style="text-align:center">${e.quantite != null ? Number(e.quantite).toLocaleString("fr-FR") : "—"}</td>
      <td style="text-align:right">${e.prix_unitaire != null ? fmt(e.prix_unitaire) : "—"}</td>
      <td style="text-align:right">${e.debit > 0 ? fmt(e.debit) : ""}</td>
      <td style="text-align:right;color:#2e7d32;font-weight:600">${e.credit > 0 ? fmt(e.credit) : ""}</td>
      <td style="text-align:right;font-weight:600;color:${e.solde > 0 ? "#d32f2f" : "#2e7d32"}">${fmt(e.solde)}</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Relevé de compte — ${data.client.nom}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #222; padding: 20px; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
      @page { margin: 12mm; size: A4 landscape; }
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .entreprise { font-size: 18px; font-weight: 700; color: #1a237e; }
    .entreprise-info { font-size: 11px; color: #555; margin-top: 2px; }
    .doc-title { text-align: center; font-size: 18px; font-weight: 700; margin: 12px 0; padding: 8px; background: #f5f5f5; border: 2px solid #1a237e; color: #1a237e; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .client-box { border: 1px solid #ccc; padding: 10px; border-radius: 4px; min-width: 280px; }
    .client-box strong { font-size: 15px; }
    .periode { font-size: 12px; color: #555; text-align: right; line-height: 1.6; }
    table.journal { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    table.journal th { background: #1a237e; color: #fff; padding: 7px 5px; font-size: 11px; text-transform: uppercase; }
    table.journal td { padding: 5px; border-bottom: 1px solid #ddd; font-size: 11px; }
    table.journal tr:nth-child(even) { background: #fafafa; }
    .paiement-row { background: #e8f5e9 !important; }
    .totaux { display: flex; justify-content: flex-end; margin-bottom: 16px; }
    .totaux table { border-collapse: collapse; }
    .totaux td { padding: 5px 10px; font-size: 13px; border-bottom: 1px solid #ddd; }
    .solde-final { font-size: 16px; font-weight: 700; }
    .footer { display: flex; justify-content: space-between; margin-top: 30px; }
    .signature { border-top: 1px solid #999; width: 200px; text-align: center; padding-top: 6px; font-size: 11px; color: #666; }
    .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 24px; background: #1a237e; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; z-index: 100; }
    .print-btn:hover { background: #283593; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer</button>

  <div class="header">
    <div>
      <div class="entreprise">${entreprise.nom}</div>
      ${entreprise.adresse ? `<div class="entreprise-info">${entreprise.adresse}</div>` : ""}
      ${entreprise.telephone ? `<div class="entreprise-info">Tél : ${entreprise.telephone}</div>` : ""}
    </div>
    <div style="text-align:right;font-size:11px;color:#666">
      Édité le ${today}
    </div>
  </div>

  <div class="doc-title">RELEVÉ DE COMPTE CLIENT</div>

  <div class="meta">
    <div class="client-box">
      <strong>${data.client.nom}</strong>
      ${data.client.adresse ? `<br/><span style="color:#666">${data.client.adresse}</span>` : ""}
      ${data.client.telephone ? `<br/><span style="color:#666">Tél : ${data.client.telephone}</span>` : ""}
    </div>
    <div class="periode">
      <strong>Période :</strong> ${periode}<br/>
      <strong>Nombre d'opérations :</strong> ${data.entries.length}
    </div>
  </div>

  <table class="journal">
    <thead>
      <tr>
        <th style="width:80px">Date</th>
        <th>Désignation</th>
        <th style="width:80px">Réf.</th>
        <th style="width:50px">Qté</th>
        <th style="width:85px">P.U</th>
        <th style="width:95px">Débit (${devise})</th>
        <th style="width:95px">Crédit (${devise})</th>
        <th style="width:100px">Solde (${devise})</th>
      </tr>
    </thead>
    <tbody>
      ${lignesHtml}
    </tbody>
  </table>

  <div class="totaux">
    <table>
      <tr>
        <td style="text-align:right"><strong>Total achats :</strong></td>
        <td style="text-align:right">${fmt(data.total_debit)} ${devise}</td>
      </tr>
      <tr>
        <td style="text-align:right"><strong>Total paiements :</strong></td>
        <td style="text-align:right;color:#2e7d32">${fmt(data.total_credit)} ${devise}</td>
      </tr>
      <tr>
        <td style="text-align:right" class="solde-final"><strong>Solde restant :</strong></td>
        <td style="text-align:right;color:${data.solde_final > 0 ? "#d32f2f" : "#2e7d32"}" class="solde-final">${fmt(data.solde_final)} ${devise}</td>
      </tr>
    </table>
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
