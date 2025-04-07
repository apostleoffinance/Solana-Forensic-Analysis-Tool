export function getMockClusters() {
    return [
        { id: 'cluster1', transactions: ['tx1', 'tx2'], wallets: ['WalletA', 'WalletB'], unusual: false },
        { id: 'cluster2', transactions: ['tx3'], wallets: ['WalletA', 'WalletC'], unusual: true },
      ];
  }