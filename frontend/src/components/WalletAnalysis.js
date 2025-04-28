'use client';

export default function WalletAnalysis( { wallet_analysis, tx_graph }) {
  const { activity_patterns, funding_sources, transaction_history } = wallet_analysis;
  const { nodes, edges } = tx_graph;

  // Extract key data
  const walletAddress = activity_patterns.wallet_address;
  const network = 'SOL Network'; // Assuming Solana based on addresses
  const activePeriodDays = activity_patterns.active_period_days;
  const avgTxPerDay = activity_patterns.avg_tx_per_day.toFixed(2);
  const senderToReceiverRatio = activity_patterns.sender_to_receiver_ratio.toFixed(2);
  const solNetFlow = activity_patterns.sol_net_flow.toFixed(4);

  // Transaction history
  const firstTransaction = transaction_history.first_transaction;
  const lastTransaction = transaction_history.last_transaction;
  const numTransactions = transaction_history.num_transactions;
  const totalSolReceived = transaction_history.total_sol_volume_received.toFixed(4);
  const totalSolSent = transaction_history.total_sol_volume_sent.toFixed(4);

  // Funding sources (taking first for simplicity, similar to original)
  const fundingSource = funding_sources[0];
  const uniqueSenders = fundingSource['Unique Senders'];
  const uniqueReceivers = fundingSource['Unique Receivers'];
  const tokensReceived = fundingSource['Token Received (Total)'].token_amount;
  const tokensSent = fundingSource['Token Sent (Total)'].token_amount;

  // Protocols (derived from node labels)
  const protocols = Object.values(nodes)
    .filter(node => node.label !== 'Unknown Address')
    .map(node => ({ name: node.label }));

  return (
    <div className="wallet-graph-analysis">
      <h2>Wallet Analysis</h2>

      {/* Wallet Info */}
      <div className="wallet-info">
        <div className="wallet-address">
          <span className="network-icon">◎</span>
          <span>{walletAddress}</span>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="activity-metrics">
        <div className="metric-card">
          <h3>Active Period</h3>
          <p>{activePeriodDays} days</p>
          <span className="metric-note">Duration of wallet activity</span>
        </div>
        <div className="metric-card">
          <h3>Avg. Tx/Day</h3>
          <p>{avgTxPerDay}</p>
          <span className="metric-note">Average transactions per day</span>
        </div>
        <div className="metric-card">
          <h3>Sender/Receiver Ratio</h3>
          <p>{senderToReceiverRatio}</p>
          <span className="metric-note">Ratio of sending to receiving txs</span>
        </div>
        <div className="metric-card">
          <h3>SOL Net Flow</h3>
          <p>{solNetFlow} SOL</p>
          <span className="metric-note">Net SOL flow (in - out)</span>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h3>Transaction History</h3>
        <div className="history-table">
          <div className="history-column">
            <div className="history-header">METRIC</div>
            <div className="history-row">First Transaction</div>
            <div className="history-row">Last Transaction</div>
            <div className="history-row">Total Transactions</div>
            <div className="history-row">Total SOL Received</div>
            <div className="history-row">Total SOL Sent</div>
          </div>
          <div className="history-column">
            <div className="history-header">VALUE</div>
            <div className="history-row">{firstTransaction}</div>
            <div className="history-row">{lastTransaction}</div>
            <div className="history-row">{numTransactions}</div>
            <div className="history-row">{totalSolReceived} SOL</div>
            <div className="history-row">{totalSolSent} SOL</div>
          </div>
        </div>
      </div>

      {/* Funding Sources */}
      <div className="funding-sources">
        <h3>Funding Sources</h3>
        <div className="funding-table">
          <div className="funding-column">
            <div className="funding-header">METRIC</div>
            <div className="funding-row">Entity Label</div>
            <div className="funding-row">Unique Senders</div>
            <div className="funding-row">Unique Receivers</div>
            <div className="funding-row">SOL Received</div>
            <div className="funding-row">SOL Sent</div>
          </div>
          <div className="funding-column">
            <div className="funding-header">VALUE</div>
            <div className="funding-row">{fundingSource['Entity Label']}</div>
            <div className="funding-row">{uniqueSenders}</div>
            <div className="funding-row">{uniqueReceivers}</div>
            <div className="funding-row">{fundingSource['SOL Received'].toFixed(4)} SOL</div>
            <div className="funding-row">{fundingSource['SOL Sent'].toFixed(4)} SOL</div>
          </div>
        </div>
      </div>

      {/* Token Activity */}
      <div className="token-activity">
        <h3>Token Activity</h3>
        <div className="token-tables">
          <div className="token-table">
            <h4>Tokens Received</h4>
            {Object.entries(tokensReceived).map(([token, amount], index) => (
              <div key={index} className="token-row">
                <span className="token-name">{token}</span>
                <span className="token-amount">{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="token-table">
            <h4>Tokens Sent</h4>
            {Object.entries(tokensSent).map(([token, amount], index) => (
              <div key={index} className="token-row">
                <span className="token-name">{token}</span>
                <span className="token-amount">{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protocols */}
      <div className="protocols">
        <h3>Protocols</h3>
        <ul className="protocols-list">
          {protocols.map((protocol, index) => (
            <li key={index} className="protocol-item">
              <span className="protocol-icon">🦄</span>
              <span>{protocol.name}</span>
            </li>
          ))}
        </ul>
        <p className="section-note">Protocols interacted with by this wallet.</p>
      </div>

      <style jsx>{`
        .wallet-graph-analysis {
          color: var(--text-primary);
        }
        h2 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        h3 {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        h4 {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .wallet-info {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .wallet-address {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .network-icon {
          font-size: 1.2rem;
        }
        .network {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .status-tags {
          display: flex;
          gap: 0.5rem;
        }
        .status-tag {
          background-color: rgba(255, 255, 255, 0.1);
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .wallet-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
          font-size: 0.85rem;
        }
        .last-checked,
        .certified {
          color: var(--text-secondary);
        }
        .certified {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .activity-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .metric-card {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .metric-card p {
          font-size: 1rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }
        .metric-note {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }
        .transaction-history,
        .funding-sources {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .history-table,
        .funding-table {
          display: flex;
          gap: 1rem;
        }
        .history-column,
        .funding-column {
          flex: 1;
        }
        .history-header,
        .funding-header {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent-blue);
          margin-bottom: 0.5rem;
        }
        .history-row,
        .funding-row {
          font-size: 0.85rem;
          color: var(--text-primary);
          padding: 0.25rem 0;
          border-bottom: 1px solid var(--border);
        }
        .history-row:last-child,
        .funding-row:last-child {
          border-bottom: none;
        }
        .token-activity {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .token-tables {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .token-table {
          display: flex;
          flex-direction: column;
        }
        .token-row {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.85rem;
        }
        .token-row:last-child {
          border-bottom: none;
        }
        .token-name {
          font-weight: 500;
        }
        .token-amount {
          color: var(--text-secondary);
        }
        .protocols {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .protocols-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .protocol-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid var(--border);
        }
        .protocol-item:last-child {
          border-bottom: none;
        }
        .protocol-icon {
          font-size: 1rem;
        }
        .section-note {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
        }
      `}</style>
    </div>
  );
}