// app/page.js
'use client';
import { getMockTransactions } from '../api/transactionFlow';
import TransactionFlow from '../components/TransactionFlow';

export default function Home() {
  const mockTransactions = getMockTransactions();

  return (
    <div className="dashboard">
      {/* Title Section */}
      <div className="dashboard-title">
        <h1>Solana Forensic Analysis Tool</h1>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <div className="dashboard-left" >
          LEFT COLUMN FOR SOMETHING?
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          <div className="widget transaction-flow">
            <h2>Transaction Flow</h2>
            <TransactionFlow transactions={mockTransactions} />
          </div>

          {/* Placeholder for Entity Labels */}
          <div className="widget entity-labels">
            <h2>Entity Labels</h2>
            <div className="placeholder">Entity Labels Placeholder</div>
          </div>

          {/* Placeholder for Transaction Clusters */}
          <div className="widget transaction-clusters">
            <h2>Transaction Clusters</h2>
            <div className="placeholder">Transaction Clusters Placeholder</div>
          </div>

          {/* Placeholder for Wallet Analysis */}
          <div className="transfers-section">
            <h2>Wallet Analysis</h2>
            <div className="placeholder">Wallet Analysis Placeholder</div>
          </div>

        </div>
      </div>

      {/* Placeholder for Footer */}
      <div className="transfers-section">
        <h2>Footer</h2>
        <div className="placeholder">Footer Placeholder</div>
      </div>
    </div>
  );
}