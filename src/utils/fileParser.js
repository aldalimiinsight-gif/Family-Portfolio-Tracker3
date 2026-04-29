import * as XLSX from 'xlsx';

/**
 * Parses an uploaded Excel/CSV file and returns structured portfolio data.
 *
 * Expected sheet names (case-insensitive):
 *   - "Stocks" | "Stock"
 *   - "Real Estate" | "RealEstate" | "Property"
 *   - "Business" | "Businesses"
 *   - "Contributions" | "Members" | "Deposits"
 *
 * Required columns per sheet:
 *
 * Stocks: Ticker, Exchange, Name, PurchaseDate, PurchasePrice, Quantity, Currency
 * Real Estate: PropertyName, Platform, InvestmentAmount, AnnualizedROI, Currency, PurchaseDate, Location
 * Business: BusinessName, Sector, CapitalInvested, OwnershipPercent, Currency, InvestmentDate, CurrentValuation
 * Contributions: MemberName, Amount, Date (YYYY-MM), Currency
 */

function normalize(str) {
  return (str || '').toLowerCase().replace(/[\s_-]/g, '');
}

function findSheet(wb, ...names) {
  const sheets = wb.SheetNames;
  for (const name of names) {
    const match = sheets.find((s) => normalize(s) === normalize(name));
    if (match) return XLSX.utils.sheet_to_json(wb.Sheets[match], { defval: '' });
  }
  return [];
}

function normalizeRow(row) {
  const out = {};
  Object.keys(row).forEach((k) => {
    out[normalize(k)] = row[k];
  });
  return out;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function parsePortfolioFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });

        const stocks = parseStocks(findSheet(wb, 'Stocks', 'Stock'));
        const realEstate = parseRealEstate(findSheet(wb, 'Real Estate', 'RealEstate', 'Property', 'Properties'));
        const business = parseBusiness(findSheet(wb, 'Business', 'Businesses', 'Private Business'));
        const contributions = parseContributions(findSheet(wb, 'Contributions', 'Members', 'Deposits', 'Contribution'));

        // Infer the upload month from the data
        const dates = contributions.map((c) => c.date).filter(Boolean).sort();
        const uploadDate = dates[dates.length - 1] || new Date().toISOString().slice(0, 7);

        resolve({ stocks, realEstate, business, contributions, uploadDate });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseStocks(rows) {
  return rows.map((r) => {
    const row = normalizeRow(r);
    return {
      id: genId(),
      type: 'stock',
      ticker: String(row['ticker'] || row['symbol'] || '').trim().toUpperCase(),
      exchange: String(row['exchange'] || 'US').trim(),
      name: String(row['name'] || row['companyname'] || '').trim(),
      purchaseDate: formatDate(row['purchasedate'] || row['date'] || ''),
      purchasePrice: parseFloat(row['purchaseprice'] || row['price'] || 0),
      quantity: parseFloat(row['quantity'] || row['qty'] || row['shares'] || 0),
      currency: String(row['currency'] || 'USD').trim().toUpperCase(),
      alertThreshold: parseFloat(row['alertthreshold'] || row['alert'] || 30),
    };
  }).filter((s) => s.ticker && s.quantity > 0);
}

function parseRealEstate(rows) {
  return rows.map((r) => {
    const row = normalizeRow(r);
    return {
      id: genId(),
      type: 'realestate',
      propertyName: String(row['propertyname'] || row['name'] || row['property'] || '').trim(),
      platform: String(row['platform'] || 'Stake').trim(),
      investmentAmount: parseFloat(row['investmentamount'] || row['amount'] || row['investment'] || 0),
      annualizedROI: parseFloat(row['annualizedroi'] || row['roi'] || row['annualroi'] || 0),
      currency: String(row['currency'] || 'USD').trim().toUpperCase(),
      purchaseDate: formatDate(row['purchasedate'] || row['date'] || ''),
      location: String(row['location'] || row['city'] || '').trim(),
    };
  }).filter((p) => p.propertyName && p.investmentAmount > 0);
}

function parseBusiness(rows) {
  return rows.map((r) => {
    const row = normalizeRow(r);
    return {
      id: genId(),
      type: 'business',
      businessName: String(row['businessname'] || row['name'] || row['company'] || '').trim(),
      sector: String(row['sector'] || row['industry'] || '').trim(),
      capitalInvested: parseFloat(row['capitalinvested'] || row['capital'] || row['invested'] || 0),
      ownershipPercent: parseFloat(row['ownershippercent'] || row['ownership'] || row['stake'] || 0),
      currency: String(row['currency'] || 'USD').trim().toUpperCase(),
      investmentDate: formatDate(row['investmentdate'] || row['date'] || ''),
      currentValuation: parseFloat(row['currentvaluation'] || row['valuation'] || 0),
      description: String(row['description'] || row['notes'] || '').trim(),
    };
  }).filter((b) => b.businessName && b.capitalInvested > 0);
}

function parseContributions(rows) {
  return rows.map((r) => {
    const row = normalizeRow(r);
    const rawDate = row['date'] || row['month'] || row['period'] || '';
    return {
      id: genId(),
      type: 'contribution',
      memberName: String(row['membername'] || row['name'] || row['member'] || '').trim(),
      amount: parseFloat(row['amount'] || row['deposit'] || row['contribution'] || 0),
      date: formatMonth(rawDate),
      currency: String(row['currency'] || 'USD').trim().toUpperCase(),
    };
  }).filter((c) => c.memberName && c.amount > 0);
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  // Try Excel serial date
  if (/^\d+$/.test(str)) {
    const d = XLSX.SSF.parse_date_code(parseInt(str));
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  return str;
}

function formatMonth(val) {
  if (!val) return new Date().toISOString().slice(0, 7);
  const d = formatDate(val);
  return d ? d.slice(0, 7) : String(val).trim().slice(0, 7);
}

/**
 * Generate a CSV template for download
 */
export function generateTemplate() {
  const wb = XLSX.utils.book_new();

  const stocksData = [
    ['Ticker', 'Exchange', 'Name', 'PurchaseDate', 'PurchasePrice', 'Quantity', 'Currency', 'AlertThreshold'],
    ['AAPL', 'US', 'Apple Inc.', '2024-01-10', 185.20, 50, 'USD', 30],
    ['QNBK.QA', 'QSE', 'QNB Group', '2024-01-15', 18.50, 2000, 'QAR', 30],
    ['2222.SR', 'Tadawul', 'Saudi Aramco', '2024-02-05', 28.40, 500, 'SAR', 30],
  ];

  const reData = [
    ['PropertyName', 'Platform', 'InvestmentAmount', 'AnnualizedROI', 'Currency', 'PurchaseDate', 'Location'],
    ['Marina Heights Tower', 'Stake', 12000, 8.5, 'USD', '2023-06-01', 'Dubai Marina, UAE'],
  ];

  const bizData = [
    ['BusinessName', 'Sector', 'CapitalInvested', 'OwnershipPercent', 'Currency', 'InvestmentDate', 'CurrentValuation', 'Description'],
    ['Gulf Tech Ventures', 'Technology', 75000, 15, 'USD', '2022-03-01', 620000, 'B2B SaaS for GCC logistics'],
  ];

  const contribData = [
    ['MemberName', 'Amount', 'Date', 'Currency'],
    ['Ahmed', 15000, '2024-03', 'USD'],
    ['Sara', 12000, '2024-03', 'USD'],
    ['Khalid', 18000, '2024-03', 'USD'],
  ];

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(stocksData), 'Stocks');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(reData), 'Real Estate');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bizData), 'Business');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contribData), 'Contributions');

  XLSX.writeFile(wb, 'portfolio_template.xlsx');
}
