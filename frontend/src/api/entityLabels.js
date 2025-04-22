export function getMockEntityLabels() {
    return [
      {
        wallet: '3J9k...xYz',
        fullAddress: '0x3J9k1234567890abcdef1234567890xYz',
        network: 'SOL Network',
        label: 'Exchange Deposit (Binance)',
        labelMetadata: {
          confidence: 0.95,
          source: 'ChainAware.ai',
        },
        patterns: [
          {
            type: 'Deposit',
            amount: 50,
            currency: 'SOL',
            timestamp: '2025-03-15T10:00:00Z',
            target: 'Binance Hot Wallet',
          },
          {
            type: 'Withdrawal',
            amount: 20,
            currency: 'SOL',
            timestamp: '2025-03-16T12:00:00Z',
            target: '7L8n...pQr',
          },
          {
            type: 'Deposit',
            amount: 30,
            currency: 'SOL',
            timestamp: '2025-03-17T09:00:00Z',
            target: 'Binance Hot Wallet',
          },
        ],
        associatedEntities: ['Binance', 'Uniswap'],
      },
      {
        wallet: '5K2m...aBc',
        fullAddress: '0x5K2mabcdef1234567890abcdefaBc',
        network: 'SOL Network',
        label: 'Unknown',
        labelMetadata: {
          confidence: 0.60,
          source: 'ChainAware.ai',
        },
        patterns: [
          {
            type: 'Deposit',
            amount: 10,
            currency: 'SOL',
            timestamp: '2025-03-20T14:00:00Z',
            target: '9P4q...mNo',
          },
          {
            type: 'Withdrawal',
            amount: 5,
            currency: 'SOL',
            timestamp: '2025-03-21T16:00:00Z',
            target: 'ExchangeY',
          },
        ],
        associatedEntities: ['SushiSwap'],
      },
      {
        wallet: '7L8n...pQr',
        fullAddress: '0x7L8n9876543210fedcba9876543pQr',
        network: 'SOL Network',
        label: 'DeFi Project (Aave)',
        labelMetadata: {
          confidence: 0.88,
          source: 'ChainAware.ai',
        },
        patterns: [
          {
            type: 'Deposit',
            amount: 5,
            currency: 'SOL',
            timestamp: '2025-04-10T08:00:00Z',
            target: 'Aave Protocol',
          },
          {
            type: 'Withdrawal',
            amount: 3,
            currency: 'SOL',
            timestamp: '2025-04-11T10:00:00Z',
            target: 'MixerZ',
          },
        ],
        associatedEntities: ['Aave', 'MixerZ'],
      },
      {
        wallet: '9P4q...mNo',
        fullAddress: '0x9P4qfedcba9876543210fedcbamNo',
        network: 'SOL Network',
        label: 'Exchange Withdrawal (Coinbase)',
        labelMetadata: {
          confidence: 0.92,
          source: 'ChainAware.ai',
        },
        patterns: [
          {
            type: 'Withdrawal',
            amount: 30,
            currency: 'SOL',
            timestamp: '2025-04-05T11:00:00Z',
            target: 'Coinbase Cold Wallet',
          },
        ],
        associatedEntities: ['Coinbase'],
      },
    ];
  }