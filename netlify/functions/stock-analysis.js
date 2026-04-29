const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const opts = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    };
    https.get(url, opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error')); }
      });
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const { ticker } = event.queryStringParameters || {};
  if (!ticker) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'ticker required' }) };
  }

  try {
    const modules = [
      'financialData',
      'defaultKeyStatistics',
      'summaryDetail',
      'incomeStatementHistory',
      'balanceSheetHistory',
      'cashflowStatementHistory',
      'incomeStatementHistoryQuarterly',
      'earningsTrend',
      'assetProfile',
    ].join(',');

    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`;
    const data = await fetchJson(url);
    const result = data?.quoteSummary?.result?.[0];

    if (!result) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'No data found', ticker }) };
    }

    const fd = result.financialData || {};
    const ks = result.defaultKeyStatistics || {};
    const sd = result.summaryDetail || {};
    const profile = result.assetProfile || {};

    // Extract annual income statements
    const annualIS = (result.incomeStatementHistory?.incomeStatementHistory || []).map((s) => ({
      endDate: s.endDate?.fmt,
      totalRevenue: s.totalRevenue?.raw,
      netIncome: s.netIncome?.raw,
      ebit: s.ebit?.raw,
      grossProfit: s.grossProfit?.raw,
    }));

    // Extract balance sheets
    const annualBS = (result.balanceSheetHistory?.balanceSheetStatements || []).map((s) => ({
      endDate: s.endDate?.fmt,
      totalStockholderEquity: s.totalStockholderEquity?.raw,
      totalDebt: (s.longTermDebt?.raw || 0) + (s.shortLongTermDebt?.raw || 0),
      totalCurrentAssets: s.totalCurrentAssets?.raw,
      totalCurrentLiabilities: s.totalCurrentLiab?.raw,
      totalAssets: s.totalAssets?.raw,
      cash: s.cash?.raw,
    }));

    // Extract cash flows
    const annualCF = (result.cashflowStatementHistory?.cashflowStatements || []).map((s) => ({
      endDate: s.endDate?.fmt,
      freeCashFlow: (s.totalCashFromOperatingActivities?.raw || 0) + (s.capitalExpenditures?.raw || 0),
      operatingCashFlow: s.totalCashFromOperatingActivities?.raw,
      capitalExpenditures: s.capitalExpenditures?.raw,
    }));

    const ratios = {
      peRatio: sd.trailingPE?.raw || ks.forwardPE?.raw,
      forwardPE: ks.forwardPE?.raw,
      pbRatio: ks.priceToBook?.raw,
      evEbitda: ks.enterpriseToEbitda?.raw,
      roe: fd.returnOnEquity?.raw,
      roa: fd.returnOnAssets?.raw,
      netProfitMargin: fd.profitMargins?.raw,
      debtToEquity: fd.debtToEquity?.raw,
      currentRatio: fd.currentRatio?.raw,
      dividendYield: sd.dividendYield?.raw || ks.dividendYield?.raw,
      beta: ks.beta?.raw || sd.beta?.raw,
      eps: ks.trailingEps?.raw,
      marketCap: ks.enterpriseValue?.raw || sd.marketCap?.raw,
      revenue: fd.totalRevenue?.raw,
      grossMargins: fd.grossMargins?.raw,
      operatingMargins: fd.operatingMargins?.raw,
      earningsGrowth: fd.earningsGrowth?.raw,
      revenueGrowth: fd.revenueGrowth?.raw,
      targetPrice: fd.targetMeanPrice?.raw,
      recommendation: fd.recommendationKey,
      sector: profile.sector,
      industry: profile.industry,
      country: profile.country,
      description: profile.longBusinessSummary,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ticker,
        ratios,
        annualIS,
        annualBS,
        annualCF,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Failed to fetch analysis data', ticker }),
    };
  }
};
