export function getMockTransactionClusters() {
    // Mock transactions with detailed information
    const transactions = [
      {
        id: 'tx1',
        source: '3J9k...xYz',
        target: '5K2m...aBc',
        amount: 50,
        currency: 'ETH',
        date: '2025-03-15',
        protocol: 'Uniswap',
        type: 'Swap',
        riskFlags: ['High Volume'],
      },
      {
        id: 'tx2',
        source: '3J9k...xYz',
        target: '7L8n...pQr',
        amount: 20,
        currency: 'ETH',
        date: '2025-03-16',
        protocol: 'Uniswap',
        type: 'Swap',
        riskFlags: ['High Volume'],
      },
      {
        id: 'tx3',
        source: '5K2m...aBc',
        target: '9P4q...mNo',
        amount: 10,
        currency: 'ETH',
        date: '2025-03-20',
        protocol: 'SushiSwap',
        type: 'Swap',
        riskFlags: [],
      },
      {
        id: 'tx4',
        source: '7L8n...pQr',
        target: 'MixerZ',
        amount: 5,
        currency: 'ETH',
        date: '2025-04-10',
        protocol: 'Mixer',
        type: 'Transfer',
        riskFlags: ['Mixer Use', 'Dark Web'],
      },
      {
        id: 'tx5',
        source: '9P4q...mNo',
        target: 'ExchangeX',
        amount: 30,
        currency: 'ETH',
        date: '2025-04-05',
        protocol: 'Exchange',
        type: 'Deposit',
        riskFlags: [],
      },
    ];
  
    // Group transactions into clusters based on shared wallets and protocols
    const clusters = [
      {
        id: 'Cluster 1',
        transactions: [transactions[0], transactions[1]], // tx1 and tx2 share wallet 3J9k...xYz and protocol Uniswap
        wallets: ['3J9k...xYz', '5K2m...aBc', '7L8n...pQr'],
        protocols: ['Uniswap'],
        riskFlags: ['High Volume'],
        unusual: true, // Flagged due to high volume
      },
      {
        id: 'Cluster 2',
        transactions: [transactions[2]], // tx3 involves 5K2m...aBc and SushiSwap
        wallets: ['5K2m...aBc', '9P4q...mNo'],
        protocols: ['SushiSwap'],
        riskFlags: [],
        unusual: false,
      },
      {
        id: 'Cluster 3',
        transactions: [transactions[3]], // tx4 involves 7L8n...pQr and Mixer
        wallets: ['7L8n...pQr', 'MixerZ'],
        protocols: ['Mixer'],
        riskFlags: ['Mixer Use', 'Dark Web'],
        unusual: true, // Flagged due to mixer use and dark web activity
      },
      {
        id: 'Cluster 4',
        transactions: [transactions[4]], // tx5 involves 9P4q...mNo and Exchange
        wallets: ['9P4q...mNo', 'ExchangeX'],
        protocols: ['Exchange'],
        riskFlags: [],
        unusual: false,
      },
    ];
  
    return clusters;
  }