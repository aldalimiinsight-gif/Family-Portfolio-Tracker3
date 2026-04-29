import jsPDF from 'jspdf';
import { fmtCurrency, fmtPct, calcMemberContributions, calcMemberNetWorth } from './calculations';

function addHeader(doc, title) {
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Family Office Portfolio', 14, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(title, 14, 20);
  doc.setTextColor(100, 150, 255);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`, 14, 26);
}

function addSection(doc, title, y) {
  doc.setFillColor(30, 41, 59);
  doc.rect(0, y - 1, 210, 9, 'F');
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, y + 5);
  return y + 13;
}

function addMetric(doc, label, value, x, y, highlight = false) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(label, x, y);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(highlight ? [34, 197, 94] : [248, 250, 252]);
  doc.text(value, x, y + 6);
  return y + 14;
}

export function generateExecutiveSummaryPDF({ state, prices, memberData, totals }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const { stocks, realEstate, business, members, contributions, settings } = state;

  addHeader(doc, 'Executive Summary Report');

  let y = 38;

  // Portfolio Overview
  y = addSection(doc, 'Portfolio Overview', y);
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(14, y, 55, 25, 2, 2, 'F');
  doc.roundedRect(75, y, 55, 25, 2, 2, 'F');
  doc.roundedRect(136, y, 60, 25, 2, 2, 'F');

  const writeCard = (x, label, value, color = [248, 250, 252]) => {
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 4, y + 8);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(value, x + 4, y + 18);
  };

  writeCard(14, 'TOTAL PORTFOLIO VALUE', fmtCurrency(totals.total, 'USD', true));
  writeCard(75, 'STOCKS VALUE', fmtCurrency(totals.stocksVal, 'USD', true), [59, 130, 246]);
  writeCard(136, 'REAL ESTATE + BUSINESS', fmtCurrency(totals.reVal + totals.bizVal, 'USD', true), [139, 92, 246]);

  y += 32;

  // Asset Allocation
  y = addSection(doc, 'Asset Allocation', y);
  const total = totals.total || 1;
  const segments = [
    { label: 'Stocks', value: totals.stocksVal, color: [59, 130, 246] },
    { label: 'Real Estate', value: totals.reVal, color: [139, 92, 246] },
    { label: 'Private Business', value: totals.bizVal, color: [34, 197, 94] },
  ];
  let bx = 14;
  segments.forEach((seg) => {
    const pct = ((seg.value / total) * 100).toFixed(1);
    const barW = Math.max(((seg.value / total) * 150), 2);
    doc.setFillColor(...seg.color);
    doc.roundedRect(bx, y, barW, 8, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setTextColor(248, 250, 252);
    doc.text(`${seg.label} ${pct}%`, bx + 2, y + 5.5);
    bx += barW + 3;
    y += 13;
  });
  y += 2;

  // Stock Performance
  if (stocks.length > 0) {
    y = addSection(doc, 'Stock Portfolio', y);
    const topStocks = [...stocks]
      .map((s) => {
        const live = prices?.[s.ticker];
        const currentPrice = live?.price || s.purchasePrice;
        const costBasis = s.purchasePrice * s.quantity;
        const currentValue = currentPrice * s.quantity;
        const pnlPct = costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0;
        return { ...s, pnlPct, currentValue };
      })
      .sort((a, b) => b.pnlPct - a.pnlPct)
      .slice(0, 5);

    // Table header
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, 182, 7, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    ['Stock', 'Exchange', 'Qty', 'Curr. Price', 'P&L %'].forEach((h, i) => {
      doc.text(h, [14, 60, 95, 120, 158][i], y + 5);
    });
    y += 8;

    topStocks.forEach((s, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(30, 41, 59);
        doc.rect(14, y, 182, 7, 'F');
      }
      const live = prices?.[s.ticker];
      const currentPrice = live?.price || s.purchasePrice;
      const pnlColor = s.pnlPct >= 0 ? [34, 197, 94] : [239, 68, 68];

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(248, 250, 252);
      doc.text(s.name || s.ticker, 14, y + 5);
      doc.text(s.exchange, 60, y + 5);
      doc.text(String(s.quantity), 95, y + 5);
      doc.text(fmtCurrency(currentPrice, s.currency), 120, y + 5);
      doc.setTextColor(...pnlColor);
      doc.text(fmtPct(s.pnlPct), 158, y + 5);
      y += 7;
    });
    y += 5;
  }

  // Family Ownership
  if (memberData.length > 0) {
    if (y > 220) {
      doc.addPage();
      addHeader(doc, 'Executive Summary — continued');
      y = 38;
    }
    y = addSection(doc, 'Family Ownership Breakdown', y);

    memberData.forEach((m) => {
      const netWorth = calcMemberNetWorth(m, totals.total);
      const barW = Math.max((m.ownershipPct / 100) * 150, 2);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(248, 250, 252);
      doc.text(`${m.name}`, 14, y + 4);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`${fmtPct(m.ownershipPct, 1)} ownership`, 14, y + 9);
      doc.text(`Net Worth: ${fmtCurrency(netWorth, 'USD', true)}`, 14, y + 14);
      doc.text(`Total Invested: ${fmtCurrency(m.totalContribution, 'USD', true)}`, 90, y + 14);

      const [r, g, b] = hexToRgb(m.color || '#3b82f6');
      doc.setFillColor(r, g, b);
      doc.roundedRect(14, y + 17, barW, 5, 1, 1, 'F');

      y += 28;
    });
  }

  // Footer
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 282, 210, 15, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Family Office Portfolio Tracker — Confidential', 14, 290);
  doc.text('This report is for internal use only.', 100, 290);

  doc.save(`portfolio-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [59, 130, 246];
}
