/**
 * Portfolio financial calculations
 */

export function toUSD(amount, currency, exchangeRates) {
  if (!amount) return 0;
  if (currency === 'USD') return amount;
  const rate = exchangeRates?.[currency];
  if (!rate) return amount;
  return amount * rate;
}

// ---- STOCK CALCULATIONS ----

export function calcStockMetrics(stock, livePrice, exchangeRates) {
  const rates = exchangeRates || { QAR: 0.2747, SAR: 0.2667 };
  const costPerShare = stock.purchasePrice;
  const currentPriceNative = livePrice?.price || stock.purchasePrice;

  const costBasisNative = costPerShare * stock.quantity;
  const currentValueNative = currentPriceNative * stock.quantity;

  const costBasisUSD = toUSD(costBasisNative, stock.currency, rates);
  const currentValueUSD = toUSD(currentValueNative, stock.currency, rates);

  const unrealizedPnL = currentValueUSD - costBasisUSD;
  const unrealizedPnLPct = costBasisUSD > 0 ? (unrealizedPnL / costBasisUSD) * 100 : 0;

  const dayChangeNative = livePrice
    ? (livePrice.price - (livePrice.previousClose || livePrice.price)) * stock.quantity
    : 0;
  const dayChangePct = livePrice?.previousClose
    ? ((livePrice.price - livePrice.previousClose) / livePrice.previousClose) * 100
    : 0;

  return {
    costBasisUSD,
    currentValueUSD,
    unrealizedPnL,
    unrealizedPnLPct,
    dayChangeNative,
    dayChangePct,
    currentPriceNative,
    costPerShare,
    quantity: stock.quantity,
  };
}

export function calcTotalStocksValue(stocks, prices, exchangeRates) {
  return stocks.reduce((sum, stock) => {
    const live = prices?.[stock.ticker];
    const { currentValueUSD } = calcStockMetrics(stock, live, exchangeRates);
    return sum + currentValueUSD;
  }, 0);
}

// ---- REAL ESTATE CALCULATIONS ----

export function calcRealEstateValue(property) {
  return property.investmentAmount || 0;
}

export function calcRealEstateAnnualIncome(property) {
  return ((property.investmentAmount || 0) * (property.annualizedROI || 0)) / 100;
}

export function calcTotalRealEstateValue(realEstate) {
  return realEstate.reduce((sum, p) => sum + calcRealEstateValue(p), 0);
}

export function calcTotalRealEstateIncome(realEstate) {
  return realEstate.reduce((sum, p) => sum + calcRealEstateAnnualIncome(p), 0);
}

// ---- BUSINESS CALCULATIONS ----

export function calcBusinessCurrentValue(biz) {
  if (biz.currentValuation && biz.ownershipPercent) {
    return (biz.currentValuation * biz.ownershipPercent) / 100;
  }
  return biz.capitalInvested || 0;
}

export function calcBusinessPnL(biz) {
  const currentValue = calcBusinessCurrentValue(biz);
  const pnl = currentValue - (biz.capitalInvested || 0);
  const pct = biz.capitalInvested > 0 ? (pnl / biz.capitalInvested) * 100 : 0;
  return { pnl, pct, currentValue };
}

export function calcTotalBusinessValue(business) {
  return business.reduce((sum, b) => sum + calcBusinessCurrentValue(b), 0);
}

// ---- PORTFOLIO TOTALS ----

export function calcTotalPortfolioValue(state, prices) {
  const { stocks, realEstate, business, settings } = state;
  const stocksVal = calcTotalStocksValue(stocks, prices, settings.exchangeRates);
  const reVal = calcTotalRealEstateValue(realEstate);
  const bizVal = calcTotalBusinessValue(business);
  return { stocksVal, reVal, bizVal, total: stocksVal + reVal + bizVal };
}

// ---- FAMILY OWNERSHIP ----

export function calcMemberContributions(contributions, members) {
  const totals = {};
  members.forEach((m) => { totals[m.id] = 0; });

  contributions.forEach((c) => {
    const amt = toUSD(c.amount, c.currency || 'USD', {});
    if (totals[c.memberId] !== undefined) {
      totals[c.memberId] += amt;
    }
  });

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return members.map((m) => ({
    ...m,
    totalContribution: totals[m.id] || 0,
    ownershipPct: grandTotal > 0 ? ((totals[m.id] || 0) / grandTotal) * 100 : 0,
  }));
}

export function calcMemberNetWorth(member, totalPortfolioValue) {
  return (totalPortfolioValue * member.ownershipPct) / 100;
}

// ---- ALLOCATION ----

export function calcAllocation(stocksVal, reVal, bizVal) {
  const total = stocksVal + reVal + bizVal;
  if (total === 0) return [
    { name: 'Stocks', value: 0, pct: 0 },
    { name: 'Real Estate', value: 0, pct: 0 },
    { name: 'Business', value: 0, pct: 0 },
  ];
  return [
    { name: 'Stocks', value: stocksVal, pct: (stocksVal / total) * 100 },
    { name: 'Real Estate', value: reVal, pct: (reVal / total) * 100 },
    { name: 'Business', value: bizVal, pct: (bizVal / total) * 100 },
  ];
}

// ---- FORMATTING ----

export function fmt(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function fmtCurrency(value, currency = 'USD', compact = false) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (compact && Math.abs(value) >= 1_000_000) {
    return `${currency === 'USD' ? '$' : ''}${(value / 1_000_000).toFixed(2)}M`;
  }
  if (compact && Math.abs(value) >= 1000) {
    return `${currency === 'USD' ? '$' : ''}${(value / 1000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function fmtPct(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function pnlColor(value) {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-red-400';
  return 'text-slate-400';
}

export function pnlBg(value) {
  if (value > 0) return 'bg-emerald-400/10 text-emerald-400';
  if (value < 0) return 'bg-red-400/10 text-red-400';
  return 'bg-slate-400/10 text-slate-400';
}

// ---- PORTFOLIO GROWTH HISTORY ----

export function buildGrowthHistory(contributions) {
  if (!contributions.length) return [];

  const byMonth = {};
  contributions.forEach((c) => {
    byMonth[c.date] = (byMonth[c.date] || 0) + toUSD(c.amount, c.currency || 'USD', {});
  });

  const months = Object.keys(byMonth).sort();
  let running = 0;
  return months.map((m) => {
    running += byMonth[m];
    return { month: m, value: running };
  });
}

// ---- FINANCIAL RATIO HELPERS ----

export function ratingClass(verdict) {
  if (!verdict) return 'text-slate-400';
  const v = verdict.toLowerCase();
  if (v.includes('buy') || v.includes('strong_buy')) return 'text-emerald-400';
  if (v.includes('sell') || v.includes('strong_sell')) return 'text-red-400';
  return 'text-amber-400';
}
