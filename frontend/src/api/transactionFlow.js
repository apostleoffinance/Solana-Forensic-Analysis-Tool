export function getMockTransactions() {
    return [
      { id: 'tx1', source: 'WalletA', target: 'WalletB', amount: 10, date: '2025-04-01', critical: true },
      { id: 'tx2', source: 'WalletB', target: 'WalletC', amount: 5, date: '2025-04-02', critical: false },
      { id: 'tx3', source: 'WalletA', target: 'WalletC', amount: 15, date: '2025-04-03', critical: true },
    ];
  }