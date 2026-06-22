import type { Vente } from "@/api/ventes";

interface TicketOpts {
  vente: Vente;
  entreprise: { nom: string; adresse?: string | null; telephone?: string | null };
  devise?: string;
  caissier?: string;
}

export function imprimerTicket({ vente, entreprise, devise = "DA", caissier }: TicketOpts) {
  const fmt = (n: number) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR") + " à " + now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const lignesHtml = vente.lignes
    .map(
      (l) => `
    <tr>
      <td style="text-align:center">${Number(l.quantite)}</td>
      <td>${l.article_designation ?? "—"}</td>
      <td style="text-align:right">${fmt(Number(l.montant))}</td>
    </tr>`,
    )
    .join("");

  const solde = Number(vente.reste_a_payer);
  const soldeLabel = solde > 0 ? "CR" : "—";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket ${vente.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 80mm; margin: 0 auto; padding: 8px; }
    @media print {
      body { padding: 0; width: 80mm; }
      .no-print { display: none !important; }
      @page { margin: 2mm; size: 80mm auto; }
    }
    .center { text-align: center; }
    .logo { font-size: 20px; font-weight: 900; margin-bottom: 2px; }
    .logo-circle { display: inline-block; border: 3px solid #000; border-radius: 50%; width: 50px; height: 50px; line-height: 50px; font-size: 14px; font-weight: 900; margin-bottom: 4px; }
    .info { font-size: 10px; line-height: 1.4; }
    .sep { border-top: 1px dashed #000; margin: 6px 0; }
    .caissier { font-size: 11px; display: flex; justify-content: space-between; }
    table { width: 100%; border-collapse: collapse; }
    table th { font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #000; padding: 3px 2px; }
    table td { padding: 3px 2px; font-size: 11px; }
    .total-row { font-size: 16px; font-weight: 900; display: flex; justify-content: space-between; padding: 6px 0; }
    .solde { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; font-weight: 700; border-top: 1px solid #000; border-bottom: 1px solid #000; }
    .barcode { text-align: center; margin: 8px 0; font-family: 'Libre Barcode 39', monospace; font-size: 36px; letter-spacing: 2px; }
    .barcode-text { text-align: center; font-size: 10px; margin-bottom: 4px; }
    .date-line { text-align: center; font-size: 11px; margin: 6px 0; }
    .footer-ar { direction: rtl; text-align: right; font-size: 9px; line-height: 1.5; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #000; }
    .footer-brand { text-align: center; font-size: 8px; margin-top: 6px; color: #666; }
    .print-btn { display: block; margin: 10px auto; padding: 10px 24px; background: #1a237e; color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
    .print-btn:hover { background: #283593; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer le ticket</button>

  <div class="center">
    <div class="logo-circle">AD<br/>phone</div>
    <div class="logo">${entreprise.nom}</div>
    <div class="info">
      ${entreprise.adresse ? `${entreprise.adresse}<br/>` : ""}
      ${entreprise.telephone ? `Tél : ${entreprise.telephone}` : ""}
    </div>
  </div>

  <div class="sep"></div>

  <div class="caissier">
    <span>${caissier ? `Caissier/ère: ${caissier}` : ""}</span>
    <span>${vente.client_nom ?? ""}</span>
  </div>

  <div class="sep"></div>

  <table>
    <thead>
      <tr>
        <th style="width:30px;text-align:center">Qte</th>
        <th>Désignation</th>
        <th style="width:80px;text-align:right">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${lignesHtml}
    </tbody>
  </table>

  <div class="sep"></div>

  <div class="total-row">
    <span>TOTAL</span>
    <span>${fmt(Number(vente.montant_total))} ${devise}</span>
  </div>

  <div class="solde">
    <span>Nouveau solde :</span>
    <span>(${soldeLabel}) ${fmt(Math.abs(solde))} ${devise}</span>
  </div>

  <div class="barcode">${vente.reference}</div>
  <div class="barcode-text">${vente.reference}</div>

  <div class="date-line">Le ${dateStr}</div>

  <div class="footer-ar">
    <strong>تنويه:</strong><br/>
    نعلم جميع زبائننا الكرام ان شاشات سامسونج<br/>
    الأصلية لا تستبدل ولا ترد<br/>
    الشاشة لا تستبدل في حالة الكسر<br/>
    الشاشة لا تستبدل في حال وجود غلط في الهاتف
  </div>

  <div class="footer-brand">
    © AD-PHONE — Gestion de Stock
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
