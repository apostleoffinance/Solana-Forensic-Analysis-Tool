'use client';
import Image from 'next/image';

export default function WalletAnalysis({ wallets }) {
  // For simplicity, we'll display the analysis for the first wallet in the list
  const wallet = Object.values(wallets)[0];

  const {
    fullAddress,
    network,
    status,
    lastChecked,
    certifiedBy,
    predictedTrust,
    experienceLevel,
    riskWillingness,
    amlAnalysis,
    intents,
    transactionCategories,
    protocols,
    recommendations,
  } = wallet;

  return (
    <div className="wallet-analysis">
      <h2>Wallet Analysis</h2>

      {/* Wallet Info */}
      <div className="wallet-info">
        <div className="wallet-address">
          <span className="network-icon">{network === 'ETH Network' && '🅴'}</span>
          <span>{fullAddress}</span>
        </div>
        <div className="wallet-meta">
          <span className="network">{network}</span>
          <div className="status-tags">
            {status.map((tag, index) => (
              <span key={index} className="status-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="wallet-actions">
          <span className="last-checked">Last checked {lastChecked}</span>
          <span className="certified">
            Certified by {certifiedBy} 🛡️
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="wallet-metrics">
        <div className="metric-card">
          <h3>Predicted Trust</h3>
          <p>{predictedTrust}% / 100%</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${predictedTrust}%` }}
            ></div>
          </div>
          <span className="metric-note">AI based trust probability</span>
        </div>
        <div className="metric-card">
          <h3>Experience Level</h3>
          <p>{experienceLevel} / 10</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(experienceLevel / 10) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="metric-card">
          <h3>Risk Willingness</h3>
          <p>{riskWillingness} / 10</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${(riskWillingness / 10) * 100}%` }}
            ></div>
          </div>
          <span className="metric-note">Willingness to take risks</span>
        </div>
      </div>

      {/* AML Analysis */}
      <div className="aml-analysis">
        <h3>AML Analysis</h3>
        <div className="aml-table">
          <div className="aml-column">
            <div className="aml-header">AREA</div>
            <div className="aml-row">Cybercrime</div>
            <div className="aml-row">Money Laundering</div>
            <div className="aml-row">Number of Malicious Contracts</div>
            <div className="aml-row">Financial Crime</div>
            <div className="aml-row">Dark Web Transactions</div>
            <div className="aml-row">Phishing</div>
            <div className="aml-row">Fake KYC</div>
          </div>
          <div className="aml-column">
            <div className="aml-header">INVOLVED</div>
            <div className="aml-row">{amlAnalysis.cybercrime ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.moneyLaundering ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.maliciousContracts}</div>
            <div className="aml-row">{amlAnalysis.financialCrime ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.darkWebTransactions ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.phishing ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.fakeKYC ? 'Yes' : 'No'}</div>
          </div>
          <div className="aml-column">
            <div className="aml-header">AREA</div>
            <div className="aml-row">Stealing Attack</div>
            <div className="aml-row">Blackmail</div>
            <div className="aml-row">CryptoJacking</div>
            <div className="aml-row">Coin Mixer Address</div>
            <div className="aml-row">Fake Token</div>
            <div className="aml-row">Scam Token</div>
          </div>
          <div className="aml-column">
            <div className="aml-header">INVOLVED</div>
            <div className="aml-row">{amlAnalysis.stealingAttack ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.blackmail ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.cryptoJacking ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.coinMixerAddress ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.fakeToken ? 'Yes' : 'No'}</div>
            <div className="aml-row">{amlAnalysis.scamToken ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Intents and Recommendations */}
      <div className="intents-recommendations">
        <div className="intents">
          <h3>Intents</h3>
          <div className="intents-table">
            {intents.map((intent, index) => (
              <div key={index} className="intent-row">
                <span
                  className={`intent-level intent-level-${intent.level.toLowerCase()}`}
                >
                  {intent.level}
                </span>
                <span className="intent-name">{intent.name}</span>
              </div>
            ))}
          </div>
          <p className="section-note">
            Calculated intention of this wallet address for the 14 available categories.
          </p>
        </div>
        <div className="recommendations">
          <h3>
            Recommendations <a href="#" className="show-all">SHOW ALL</a>
          </h3>
          <ul className="recommendations-list">
            {recommendations.map((rec, index) => (
              <li key={index} className="recommendation-item">
                <input type="checkbox" checked={rec.checked} readOnly />
                <span>{rec.name}</span>
              </li>
            ))}
          </ul>
          <p className="section-note">
            Recommended activities based on this wallet’s risk profile.
          </p>
        </div>
      </div>

      {/* Transaction Categories and Protocols */}
      <div className="categories-protocols">
        <div className="transaction-categories">
          <h3>Transaction Categories</h3>
          {transactionCategories.map((category, index) => (
            <div key={index} className="category-row">
              <span className="category-name">{category.name}</span>
              <div className="category-bar">
                <div
                  className="category-fill"
                  style={{ width: `${Math.min((category.count / 1000) * 100, 100)}%` }}
                ></div>
              </div>
              <span className="category-count">{category.count}</span>
            </div>
          ))}
        </div>
        <div className="protocols">
          <h3>Protocols</h3>
          <ul className="protocols-list">
            {protocols.map((protocol, index) => (
              <li key={index} className="protocol-item">
                {/* Note: Logo is placeholder; you'd need to add actual logo assets */}
                <span className="protocol-icon">🦄</span>
                <span>{protocol.name}</span>
              </li>
            ))}
          </ul>
          <p className="section-note">Protocols used by this wallet.</p>
        </div>
      </div>

      <style jsx>{`
        .wallet-analysis {
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
        .wallet-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
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
        .last-checked, .certified {
          color: var(--text-secondary);
        }
        .certified {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }
        .action-btn {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--border);
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .action-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .action-btn.feedback {
          background: none;
          border: none;
          color: var(--accent-blue);
        }
        .wallet-metrics {
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
        .progress-bar {
          height: 8px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background-color: var(--accent-blue);
          transition: width 0.3s ease;
        }
        .metric-note {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }
        .aml-analysis {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .aml-table {
          display: flex;
          gap: 1rem;
        }
        .aml-column {
          flex: 1;
        }
        .aml-header {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent-blue);
          margin-bottom: 0.5rem;
        }
        .aml-row {
          font-size: 0.85rem;
          color: var(--text-primary);
          padding: 0.25rem 0;
          border-bottom: 1px solid var(--border);
        }
        .aml-row:last-child {
          border-bottom: none;
        }
        .intents-recommendations {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .intents, .recommendations {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .intents-table {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .intent-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid var(--border);
        }
        .intent-row:last-child {
          border-bottom: none;
        }
        .intent-level {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .intent-level-high {
          background-color: rgba(255, 0, 0, 0.2);
          color: var(--accent-red);
        }
        .intent-level-med {
          background-color: rgba(255, 165, 0, 0.2);
          color: #ffa500; /* Orange */
        }
        .intent-level-low {
          background-color: rgba(0, 255, 0, 0.2);
          color: var(--accent-green);
        }
        .intent-name {
          font-size: 0.85rem;
        }
        .recommendations-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .recommendation-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid var(--border);
        }
        .recommendation-item:last-child {
          border-bottom: none;
        }
        .recommendation-item input[type="checkbox"] {
          accent-color: var(--accent-blue);
        }
        .show-all {
          font-size: 0.85rem;
          color: var(--accent-blue);
          text-decoration: none;
          float: right;
        }
        .show-all:hover {
          text-decoration: underline;
        }
        .categories-protocols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .transaction-categories, .protocols {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .category-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .category-name {
          flex: 1;
          font-size: 0.85rem;
        }
        .category-bar {
          flex: 2;
          height: 8px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }
        .category-fill {
          height: 100%;
          background-color: var(--accent-blue);
          transition: width 0.3s ease;
        }
        .category-count {
          font-size: 0.85rem;
          color: var(--text-primary);
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