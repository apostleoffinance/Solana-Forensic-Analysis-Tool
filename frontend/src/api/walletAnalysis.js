  export function getMockWallets() {
    return {
        WalletA: { fundingSources: ['ExchangeX', 'WalletD'], history: ['tx1', 'tx3'], patterns: 'High volume' },
        WalletB: { fundingSources: ['WalletA'], history: ['tx1', 'tx2'], patterns: 'Relay' },
        WalletC: { fundingSources: ['WalletB', 'WalletA'], history: ['tx2', 'tx3'], patterns: 'Sink' },
      };
  }