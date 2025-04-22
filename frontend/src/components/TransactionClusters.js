'use client';
import { useState } from 'react';

export default function TransactionClusters({ clusters }) {
  const [selectedCluster, setSelectedCluster] = useState(clusters[0]);

  return (
    <div className="transaction-clusters">
      <div className="cluster-selector">
        <h3>Select Cluster</h3>
        <div className="cluster-options">
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              className={`cluster-btn ${selectedCluster.id === cluster.id ? 'active' : ''} ${
                cluster.unusual ? 'unusual' : ''
              }`}
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
                {selectedCluster.wallets.join(', ')}
              </p>
              <p>
                <strong>Protocols:</strong>{' '}
                {selectedCluster.protocols.join(', ')}
              </p>
              <p>
                <strong>Unusual Movements:</strong>{' '}
                {selectedCluster.unusual ? (
                  <span className="unusual-text">
                    Yes ({selectedCluster.riskFlags.join(', ')})
                  </span>
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
                  <span>{tx.source}</span>
                  <span>{tx.target}</span>
                  <span>
                    {tx.amount} {tx.currency}
                  </span>
                  <span>{tx.date}</span>
                  <span>{tx.type}</span>
                  <span>
                    {tx.riskFlags.length > 0
                      ? tx.riskFlags.join(', ')
                      : 'None'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .transaction-clusters {
          color: var(--text-primary);
        }
        h3 {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .cluster-selector {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .cluster-options {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .cluster-btn {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--border);
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .cluster-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .cluster-btn.active {
          background-color: var(--accent-blue);
          border-color: var(--accent-blue);
        }
        .cluster-btn.unusual {
          border-color: var(--accent-red);
          color: var(--accent-red);
        }
        .unusual-flag {
          font-size: 0.85rem;
        }
        .cluster-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .cluster-overview {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .overview-card {
          font-size: 0.85rem;
        }
        .overview-card p {
          margin-bottom: 0.5rem;
        }
        .unusual-text {
          color: var(--accent-red);
        }
        .transaction-details {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .transactions-table {
          display: flex;
          flex-direction: column;
        }
        .table-header, .table-row {
          display: grid;
          grid-template-columns: 1fr 2fr 2fr 1fr 1fr 1fr 2fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.85rem;
        }
        .table-header {
          font-weight: 600;
          color: var(--text-secondary);
        }
        .table-row:last-child {
          border-bottom: none;
        }
        .table-row.unusual-row {
          color: var(--accent-red);
        }
      `}</style>
    </div>
  );
}