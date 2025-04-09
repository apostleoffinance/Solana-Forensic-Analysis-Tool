export function getMockTransactions() {
  return [
    // Cluster 1: Exchange-related transactions
    { id: 'tx1', source: 'Oxadsfasdlfjio3093803', target: 'Oxkweprtyuio123456789', amount: 100, date: '2025-04-01', critical: false, entity: 'Exchange' },
    { id: 'tx2', source: 'Oxkweprtyuio123456789', target: 'Oxzxcvbnmlkjhgfdsa987', amount: 50, date: '2025-04-01', critical: false },
    { id: 'tx3', source: 'Oxzxcvbnmlkjhgfdsa987', target: 'Oxqazwsxedcrfvtgbyhnu', amount: 30, date: '2025-04-02', critical: false },

    // Cluster 2: Suspicious transactions
    { id: 'tx4', source: 'Oxplmoknijbuhvygctfxrd', target: 'Oxeswzaqxdcfvrtgbyhnuj', amount: 200, date: '2025-04-03', critical: true, entity: 'Hacker' },
    { id: 'tx5', source: 'Oxeswzaqxdcfvrtgbyhnuj', target: 'Oxmkoplniuhbygvctfxrde', amount: 150, date: '2025-04-03', critical: true },
    { id: 'tx6', source: 'Oxmkoplniuhbygvctfxrde', target: 'Oxswedfrtgyhujikolpazq', amount: 100, date: '2025-04-04', critical: true },

    // Cluster 3: OpenSea-related transactions
    { id: 'tx7', source: 'Oxqazwsxedcrfvtgbyhnu2', target: 'Oxplmoknijbuhvygctfxrd2', amount: 80, date: '2025-04-05', critical: false, entity: 'Marketplace' },
    { id: 'tx8', source: 'Oxplmoknijbuhvygctfxrd2', target: 'Oxeswzaqxdcfvrtgbyhnuj2', amount: 40, date: '2025-04-05', critical: false },
    { id: 'tx9', source: 'Oxeswzaqxdcfvrtgbyhnuj2', target: 'Oxmkoplniuhbygvctfxrde2', amount: 20, date: '2025-04-06', critical: false },

    // Additional connections
    { id: 'tx10', source: 'Oxqazwsxedcrfvtgbyhnu', target: 'Oxeswzaqxdcfvrtgbyhnuj', amount: 10, date: '2025-04-07', critical: false },
    { id: 'tx11', source: 'Oxswedfrtgyhujikolpazq', target: 'Oxmkoplniuhbygvctfxrde2', amount: 15, date: '2025-04-08', critical: false },
    { id: 'tx12', source: 'Oxkweprtyuio123456789', target: 'Oxplmoknijbuhvygctfxrd2', amount: 25, date: '2025-04-09', critical: false },
  ];
}