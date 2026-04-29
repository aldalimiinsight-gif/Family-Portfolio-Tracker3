function id() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const memberIds = {
  ahmed:  id(),
  sara:   id(),
  khalid: id(),
  noor:   id(),
  hassan: id(),
};

export const sampleData = {
  members: [
    { id: memberIds.ahmed,  name: 'Ahmed',  color: '#3b82f6', avatar: 'A' },
    { id: memberIds.sara,   name: 'Sara',   color: '#8b5cf6', avatar: 'S' },
    { id: memberIds.khalid, name: 'Khalid', color: '#22c55e', avatar: 'K' },
    { id: memberIds.noor,   name: 'Noor',   color: '#f59e0b', avatar: 'N' },
    { id: memberIds.hassan, name: 'Hassan', color: '#ef4444', avatar: 'H' },
  ],

  contributions: [
    { id: id(), memberId: memberIds.ahmed,  amount: 15000, date: '2024-01', currency: 'USD', uploadDate: '2024-01' },
    { id: id(), memberId: memberIds.sara,   amount: 10000, date: '2024-01', currency: 'USD', uploadDate: '2024-01' },
    { id: id(), memberId: memberIds.khalid, amount: 20000, date: '2024-01', currency: 'USD', uploadDate: '2024-01' },
    { id: id(), memberId: memberIds.noor,   amount:  8000, date: '2024-01', currency: 'USD', uploadDate: '2024-01' },
    { id: id(), memberId: memberIds.hassan, amount: 12000, date: '2024-01', currency: 'USD', uploadDate: '2024-01' },
    { id: id(), memberId: memberIds.ahmed,  amount: 15000, date: '2024-02', currency: 'USD', uploadDate: '2024-02' },
    { id: id(), memberId: memberIds.sara,   amount: 12000, date: '2024-02', currency: 'USD', uploadDate: '2024-02' },
    { id: id(), memberId: memberIds.khalid, amount: 20000, date: '2024-02', currency: 'USD', uploadDate: '2024-02' },
    { id: id(), memberId: memberIds.noor,   amount:  8000, date: '2024-02', currency: 'USD', uploadDate: '2024-02' },
    { id: id(), memberId: memberIds.hassan, amount: 15000, date: '2024-02', currency: 'USD', uploadDate: '2024-02' },
    { id: id(), memberId: memberIds.ahmed,  amount: 20000, date: '2024-03', currency: 'USD', uploadDate: '2024-03' },
    { id: id(), memberId: memberIds.sara,   amount: 12000, date: '2024-03', currency: 'USD', uploadDate: '2024-03' },
    { id: id(), memberId: memberIds.khalid, amount: 18000, date: '2024-03', currency: 'USD', uploadDate: '2024-03' },
    { id: id(), memberId: memberIds.noor,   amount: 10000, date: '2024-03', currency: 'USD', uploadDate: '2024-03' },
    { id: id(), memberId: memberIds.hassan, amount: 15000, date: '2024-03', currency: 'USD', uploadDate: '2024-03' },
    { id: id(), memberId: memberIds.ahmed,  amount: 18000, date: '2024-04', currency: 'USD', uploadDate: '2024-04' },
    { id: id(), memberId: memberIds.sara,   amount: 14000, date: '2024-04', currency: 'USD', uploadDate: '2024-04' },
    { id: id(), memberId: memberIds.khalid, amount: 22000, date: '2024-04', currency: 'USD', uploadDate: '2024-04' },
    { id: id(), memberId: memberIds.noor,   amount: 10000, date: '2024-04', currency: 'USD', uploadDate: '2024-04' },
    { id: id(), memberId: memberIds.hassan, amount: 16000, date: '2024-04', currency: 'USD', uploadDate: '2024-04' },
  ],

  stocks: [
    {
      id: id(), ticker: 'QNBK.QA', exchange: 'QSE',     name: 'QNB Group',
      purchaseDate: '2024-01-15', purchasePrice: 18.50, quantity: 2000, currency: 'QAR', alertThreshold: 30,
    },
    {
      id: id(), ticker: 'MARK.QA', exchange: 'QSE',     name: 'Masraf Al Rayan',
      purchaseDate: '2024-01-20', purchasePrice: 1.65,  quantity: 5000, currency: 'QAR', alertThreshold: 30,
    },
    {
      id: id(), ticker: '2222.SR', exchange: 'Tadawul', name: 'Saudi Aramco',
      purchaseDate: '2024-02-05', purchasePrice: 28.40, quantity: 500,  currency: 'SAR', alertThreshold: 30,
    },
    {
      id: id(), ticker: 'AAPL',   exchange: 'US',       name: 'Apple Inc.',
      purchaseDate: '2024-01-10', purchasePrice: 185.20, quantity: 50,  currency: 'USD', alertThreshold: 30,
    },
    {
      id: id(), ticker: 'MSFT',   exchange: 'US',       name: 'Microsoft Corp.',
      purchaseDate: '2024-02-12', purchasePrice: 408.00, quantity: 25,  currency: 'USD', alertThreshold: 30,
    },
    {
      id: id(), ticker: 'NVDA',   exchange: 'US',       name: 'NVIDIA Corp.',
      purchaseDate: '2024-03-01', purchasePrice: 820.00, quantity: 15,  currency: 'USD', alertThreshold: 30,
    },
  ],

  realEstate: [
    {
      id: id(), propertyName: 'Marina Heights Tower, Dubai',
      platform: 'Stake', investmentAmount: 12000, annualizedROI: 8.5,
      currency: 'USD', purchaseDate: '2023-06-01', location: 'Dubai Marina, UAE',
    },
    {
      id: id(), propertyName: 'Downtown Residences, Dubai',
      platform: 'Stake', investmentAmount: 8500, annualizedROI: 7.2,
      currency: 'USD', purchaseDate: '2023-09-15', location: 'Downtown Dubai, UAE',
    },
    {
      id: id(), propertyName: 'JLT Cluster M',
      platform: 'Stake', investmentAmount: 5000, annualizedROI: 9.1,
      currency: 'USD', purchaseDate: '2024-01-01', location: 'JLT, Dubai, UAE',
    },
  ],

  business: [
    {
      id: id(), businessName: 'Gulf Tech Ventures LLC',
      sector: 'Technology', capitalInvested: 75000, ownershipPercent: 15,
      currency: 'USD', investmentDate: '2022-03-01', currentValuation: 620000,
      description: 'B2B SaaS platform for logistics management in GCC.',
    },
    {
      id: id(), businessName: 'Al Noor Food Industries',
      sector: 'Food & Beverage', capitalInvested: 50000, ownershipPercent: 10,
      currency: 'USD', investmentDate: '2021-07-15', currentValuation: 380000,
      description: 'Regional food distribution and packaging company.',
    },
    {
      id: id(), businessName: 'Doha Real Estate Development',
      sector: 'Real Estate', capitalInvested: 100000, ownershipPercent: 8,
      currency: 'USD', investmentDate: '2023-01-01', currentValuation: 1250000,
      description: 'Residential property developer in Qatar.',
    },
  ],

  monthlyUploads: [
    { date: '2024-01', uploadedAt: '2024-01-31T10:00:00Z', entries: [] },
    { date: '2024-02', uploadedAt: '2024-02-29T10:00:00Z', entries: [] },
    { date: '2024-03', uploadedAt: '2024-03-31T10:00:00Z', entries: [] },
    { date: '2024-04', uploadedAt: '2024-04-30T10:00:00Z', entries: [] },
  ],

  settings: {
    alertThreshold: 30,
    baseCurrency: 'USD',
    exchangeRates: { QAR: 0.2747, SAR: 0.2667, GBP: 1.27, EUR: 1.08 },
  },

  prices: {},
  pricesLoading: {},
};
