// src/data/getMockTransactions.js
export function getMockTransactions() {
  return [
    // Cluster 1: Exchange-related transactions (9 transactions)
    { id: 'tx1', source: 'Oxadsfasdlfjio3093803', target: 'Oxkweprtyuio123456789', amount: 100, date: '2025-04-01', critical: false, entity: 'Exchange' },
    { id: 'tx2', source: 'Oxkweprtyuio123456789', target: 'Oxzxcvbnmlkjhgfdsa987', amount: 50, date: '2025-04-01', critical: false },
    { id: 'tx3', source: 'Oxzxcvbnmlkjhgfdsa987', target: 'Oxqazwsxedcrfvtgbyhnu', amount: 30, date: '2025-04-02', critical: false },
    { id: 'tx13', source: 'Oxqazwsxedcrfvtgbyhnu', target: 'Oxadsfasdlfjio3093803', amount: 70, date: '2025-04-02', critical: false },
    { id: 'tx14', source: 'Oxadsfasdlfjio3093803', target: 'Oxuytrewqlkjhgfdsapoi', amount: 90, date: '2025-04-03', critical: false },
    { id: 'tx15', source: 'Oxuytrewqlkjhgfdsapoi', target: 'Oxkweprtyuio123456789', amount: 40, date: '2025-04-03', critical: false },
    { id: 'tx16', source: 'Oxkweprtyuio123456789', target: 'Oxmnbvcxzlkjhgfdsqwerty', amount: 60, date: '2025-04-04', critical: false },
    { id: 'tx17', source: 'Oxmnbvcxzlkjhgfdsqwerty', target: 'Oxzxcvbnmlkjhgfdsa987', amount: 20, date: '2025-04-04', critical: false },
    { id: 'tx18', source: 'Oxzxcvbnmlkjhgfdsa987', target: 'Oxuytrewqlkjhgfdsapoi', amount: 80, date: '2025-04-05', critical: false },

    // Cluster 2: Suspicious transactions (9 transactions)
    { id: 'tx4', source: 'Oxplmoknijbuhvygctfxrd', target: 'Oxeswzaqxdcfvrtgbyhnuj', amount: 200, date: '2025-04-03', critical: true, entity: 'Hacker' },
    { id: 'tx5', source: 'Oxeswzaqxdcfvrtgbyhnuj', target: 'Oxmkoplniuhbygvctfxrde', amount: 150, date: '2025-04-03', critical: true },
    { id: 'tx6', source: 'Oxmkoplniuhbygvctfxrde', target: 'Oxswedfrtgyhujikolpazq', amount: 100, date: '2025-04-04', critical: true },
    { id: 'tx19', source: 'Oxplmoknijbuhvygctfxrd', target: 'Oxqwerfvbnhyujmkolpazx', amount: 180, date: '2025-04-04', critical: true },
    { id: 'tx20', source: 'Oxqwerfvbnhyujmkolpazx', target: 'Oxeswzaqxdcfvrtgbyhnuj', amount: 120, date: '2025-04-05', critical: true },
    { id: 'tx21', source: 'Oxeswzaqxdcfvrtgbyhnuj', target: 'Oxzxcvfrtgbnhyujmkolpi', amount: 160, date: '2025-04-05', critical: true },
    { id: 'tx22', source: 'Oxzxcvfrtgbnhyujmkolpi', target: 'Oxmkoplniuhbygvctfxrde', amount: 90, date: '2025-04-06', critical: true },
    { id: 'tx23', source: 'Oxmkoplniuhbygvctfxrde', target: 'Oxplmoknijbuhvygctfxrd', amount: 130, date: '2025-04-06', critical: true },
    { id: 'tx24', source: 'Oxplmoknijbuhvygctfxrd', target: 'Oxswedfrtgyhujikolpazq', amount: 110, date: '2025-04-07', critical: true },

    // Cluster 3: Marketplace-related transactions (9 transactions)
    { id: 'tx7', source: 'Oxqazwsxedcrfvtgbyhnu2', target: 'Oxplmoknijbuhvygctfxrd2', amount: 80, date: '2025-04-05', critical: false, entity: 'Marketplace' },
    { id: 'tx8', source: 'Oxplmoknijbuhvygctfxrd2', target: 'Oxeswzaqxdcfvrtgbyhnuj2', amount: 40, date: '2025-04-05', critical: false },
    { id: 'tx9', source: 'Oxeswzaqxdcfvrtgbyhnuj2', target: 'Oxmkoplniuhbygvctfxrde2', amount: 20, date: '2025-04-06', critical: false },
    { id: 'tx25', source: 'Oxmkoplniuhbygvctfxrde2', target: 'Oxqazwsxedcrfvtgbyhnu2', amount: 60, date: '2025-04-06', critical: false },
    { id: 'tx26', source: 'Oxqazwsxedcrfvtgbyhnu2', target: 'Oxuytrewqlkjhgfdsapoi2', amount: 50, date: '2025-04-07', critical: false },
    { id: 'tx27', source: 'Oxuytrewqlkjhgfdsapoi2', target: 'Oxplmoknijbuhvygctfxrd2', amount: 30, date: '2025-04-07', critical: false },
    { id: 'tx28', source: 'Oxplmoknijbuhvygctfxrd2', target: 'Oxzxcvfrtgbnhyujmkolpi2', amount: 70, date: '2025-04-08', critical: false },
    { id: 'tx29', source: 'Oxzxcvfrtgbnhyujmkolpi2', target: 'Oxeswzaqxdcfvrtgbyhnuj2', amount: 45, date: '2025-04-08', critical: false },
    { id: 'tx30', source: 'Oxeswzaqxdcfvrtgbyhnuj2', target: 'Oxuytrewqlkjhgfdsapoi2', amount: 25, date: '2025-04-09', critical: false },

    // Additional connections (9 transactions)
    { id: 'tx10', source: 'Oxqazwsxedcrfvtgbyhnu', target: 'Oxeswzaqxdcfvrtgbyhnuj', amount: 10, date: '2025-04-07', critical: false },
    { id: 'tx11', source: 'Oxswedfrtgyhujikolpazq', target: 'Oxmkoplniuhbygvctfxrde2', amount: 15, date: '2025-04-08', critical: false },
    { id: 'tx12', source: 'Oxkweprtyuio123456789', target: 'Oxplmoknijbuhvygctfxrd2', amount: 25, date: '2025-04-09', critical: false },
    { id: 'tx31', source: 'Oxuytrewqlkjhgfdsapoi', target: 'Oxqwerfvbnhyujmkolpazx', amount: 35, date: '2025-04-09', critical: false },
    { id: 'tx32', source: 'Oxzxcvfrtgbnhyujmkolpi', target: 'Oxmnbvcxzlkjhgfdsqwerty', amount: 20, date: '2025-04-10', critical: false },
    { id: 'tx33', source: 'Oxeswzaqxdcfvrtgbyhnuj2', target: 'Oxadsfasdlfjio3093803', amount: 15, date: '2025-04-10', critical: false },
    { id: 'tx34', source: 'Oxmkoplniuhbygvctfxrde', target: 'Oxuytrewqlkjhgfdsapoi2', amount: 50, date: '2025-04-11', critical: false },
    { id: 'tx35', source: 'Oxplmoknijbuhvygctfxrd2', target: 'Oxzxcvbnmlkjhgfdsa987', amount: 30, date: '2025-04-11', critical: false },
    { id: 'tx36', source: 'Oxswedfrtgyhujikolpazq', target: 'Oxqazwsxedcrfvtgbyhnu', amount: 40, date: '2025-04-12', critical: false },
  ];
}