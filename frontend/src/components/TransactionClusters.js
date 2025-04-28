'use client';
import { useState, useEffect } from 'react';

export default function TransactionClusters({ tx_graph, wallet_analysis }) {
  // Debug the funding_sources structure
  console.log('wallet_analysis.funding_sources[0]:', wallet_analysis.funding_sources[0]);

  // Adjust for possible nested structure
  const fundingData = wallet_analysis.funding_sources[0].token_amount || wallet_analysis.funding_sources[0];
  const tokenReceived = fundingData['Token Received (Total)'] || {};
  const tokenSent = fundingData['Token Sent (Total)'] || {};
  const allTokens = [...new Set([...Object.keys(tokenReceived), ...Object.keys(tokenSent)])];
  
  // Debug token lists
  console.log('tokenReceived:', tokenReceived);
  console.log('tokenSent:', tokenSent);
  console.log('allTokens:', allTokens);

  const clusters = allTokens.map((token, index) => {
    const transactions = [];
    let txIndex = 1;

    // Add received transactions
    if (token in tokenReceived) {
      const source = tx_graph.edges.find((e) => e.to === wallet_analysis.activity_patterns.wallet_address)?.from || 'Unknown';
      const protocol = source !== 'Unknown' && tx_graph.nodes[source] ? tx_graph.nodes[source].label : 'Unknown';
      transactions.push({
        id: `tx${txIndex++}`,
        source,
        target: wallet_analysis.activity_patterns.wallet_address,
        amount: Number(tokenReceived[token]) || 0,
        currency: token,
        date: new Date(
          new Date(wallet_analysis.transaction_history.first_transaction).getTime() +
            (index * (new Date(wallet_analysis.transaction_history.last_transaction) - new Date(wallet_analysis.transaction_history.first_transaction)) /
              allTokens.length)
        ).toISOString().split('T')[0],
        protocol,
        type: ['Jupiter', 'Orca', 'Raydium'].includes(protocol) ? 'Swap' : 'Transfer',
        riskFlags:
          Number(tokenReceived[token]) > 1000
            ? ['High Volume', protocol.includes('Unknown') ? 'Unknown Counterparty' : ''].filter(Boolean)
            : [protocol.includes('Unknown') ? 'Unknown Counterparty' : ''].filter(Boolean),
      });
    }

    // Add sent transactions
    if (token in tokenSent) {
      const target = tx_graph.edges.find((e) => e.from === wallet_analysis.activity_patterns.wallet_address)?.to || 'Unknown';
      const protocol = target !== 'Unknown' && tx_graph.nodes[target] ? tx_graph.nodes[target].label : 'Unknown';
      transactions.push({
        id: `tx${txIndex++}`,
        source: wallet_analysis.activity_patterns.wallet_address,
        target,
        amount: Number(tokenSent[token]) || 0,
        currency: token,
        date: new Date(
          new Date(wallet_analysis.transaction_history.first_transaction).getTime() +
            ((index + 0.5) * (new Date(wallet_analysis.transaction_history.last_transaction) - new Date(wallet_analysis.transaction_history.first_transaction)) /
              allTokens.length)
        ).toISOString().split('T')[0],
        protocol,
        type: ['Jupiter', 'Orca', 'Raydium'].includes(protocol) ? 'Swap' : 'Transfer',
        riskFlags:
          Number(tokenSent[token]) > 1000
            ? ['High Volume', protocol.includes('Unknown') ? 'Unknown Counterparty' : ''].filter(Boolean)
            : [protocol.includes('Unknown') ? 'Unknown Counterparty' : ''].filter(Boolean),
      });
    }

    // Debug transactions structure
    console.log(`Transactions for cluster ${token}:`, transactions);

    return {
      id: `Cluster ${index + 1} (${token})`,
      transactions,
      wallets: [...new Set(transactions.flatMap((t) => [t.source, t.target]))],
      protocols: [...new Set(transactions.map((t) => t.protocol))],
      riskFlags: [...new Set(transactions.flatMap((t) => t.riskFlags))],
      unusual: transactions.some((t) => t.riskFlags.length > 0),
    };
  });

  const [selectedCluster, setSelectedCluster] = useState(clusters[0]);

  // Debug styling application
  useEffect(() => {
    const card = document.querySelector('.cluster-selector');
    if (card) {
      const computedBg = window.getComputedStyle(card).backgroundColor;
      console.log('TransactionClusters cluster-selector background:', computedBg);
    }
  }, []);

  return (
    <div className="transaction-clusters">
      <div className="cluster-selector">
        <h3>💸 Clusters</h3>
        <div className="cluster-options">
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              className={`cluster-btn ${selectedCluster?.id === cluster.id ? 'active' : ''} ${cluster.unusual ? 'unusual' : ''}`}
              onClick={() => setSelectedCluster(cluster)}
            >
              {cluster.id}
              {cluster.unusual && <span className="unusual-flag">⚠️</span>}
            </button>
          ))}
        </div>
      </div>

      {selectedCluster && (
        <div className="cluster-details">
          {/* Cluster Overview */}
          <div className="cluster-overview">
            <h3>Cluster Overview</h3>
            <div className="overview-card">
              <p>
                <strong>Transactions:</strong> {selectedCluster.transactions.length}
              </p>
              <p>
                <strong>Wallets Involved:</strong>{' '}
                {selectedCluster.wallets.map((w) => `${w.slice(0, 4)}...${w.slice(-4)}`).join(', ')}
              </p>
              <p>
                <strong>Protocols:</strong>{' '}
                {selectedCluster.protocols.join(', ')}
              </p>
              <p>
                <strong>Unusual Movements:</strong>{' '}
                {selectedCluster.unusual ? (
                  <span className="unusual-text">{selectedCluster.riskFlags.join(', ')}</span>
                ) : (
                  'No'
                )}
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="transaction-details">
            <h3>Transaction Details</h3>
            <div className="transactions-table">
              <div className="table-header">
                <span>ID</span>
                <span>Source</span>
                <span>Target</span>
                <span>Amount</span>
                <span>Date</span>
                <span>Type</span>
                <span>Risk Flags</span>
              </div>
              {selectedCluster.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`table-row ${tx.riskFlags.length > 0 ? 'unusual-row' : ''}`}
                >
                  <span>{tx.id}</span>
                  <span>{`${tx.source.slice(0, 4)}...${tx.source.slice(-4)}`}</span>
                  <span>{`${tx.target.slice(0, 4)}...${tx.target.slice(-4)}`}</span>
                  <span>{tx.amount.toFixed(2)} {tx.currency}</span>
                  <span>{tx.date}</span>
                  <span>{tx.type}</span>
                  <span>{tx.riskFlags.length > 0 ? tx.riskFlags.join(', ') : 'None'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .transaction-clusters {
          color: var(--text-primary);
          font-family: 'Courier New', Courier, monospace;
        }
        h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: var(--accent-red);
        }
        .cluster-selector {
          background-color: var(--card-bg-dark, #1a202c);
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid var(--accent-red);
          margin-bottom: 1.5rem;
        }
        .cluster-options {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .cluster-btn {
          background-color: var(--accent-red);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0;
          color: #fff;
          font-size: 0.9rem;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .cluster-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        }
        .cluster-btn.active {
          background-color: #b91c3a;
        }
        .cluster-btn.unusual {
          background-color: #ff4d4f;
        }
        .unusual-flag {
          font-size: 1rem;
        }
        .cluster-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .cluster-overview {
          background-color: var(--card-bg-dark, #1a202c);
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid var(--accent-red);
        }
        .overview-card {
          font-size: 0.9rem;
        }
        .overview-card p {
          margin-bottom: 0.75rem;
        }
        .unusual-text {
          color: #ff4d4f;
          font-weight: 600;
        }
        .transaction-details {
          background-color: var(--card-bg-dark, #1a202c);
          padding: 1.5rem;
          border-radius: 8px;
          border: 2px solid var(--accent-red);
        }
        .transactions-table {
          display: flex;
          flex-direction: column;
        }
        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 1fr 2fr 2fr 1fr 1fr 1fr 2fr;
          gap: 0.75rem;
          padding: 0.75rem 0;
          border-bottom: 1px solid rgba(225, 29, 72, 0.3);
          font-size: 0.9rem;
        }
        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            text-align: left;
          }
          .table-header span,
          .table-row span {
            padding: 0.5rem 0;
          }
        }
        .table-header {
          font-weight: 700;
          color: var(--accent-red);
          background-color: rgba(225, 29, 72, 0.1);
        }
        .table-row:last-child {
          border-bottom: none;
        }
        .table-row.unusual-row {
          color: #ff4d4f;
          border-left: 4px solid #ff4d4f;
        }
      `}</style>
      <style jsx global>{`
        :root {
          --accent-purple: #7B3FE4;
          --accent-teal: #26A69A;
          --accent-pink: #FF2D55;
          --card-bg-dark: #1a202c; /* Fallback */
        }
      `}</style>
    </div>
  );
}