// app/page.js
'use client';
import { getMockTransactions } from '../api/transactionFlow';
import { getMockWallets } from '../api/walletAnalysis';
import TransactionFlow from '../components/TransactionFlow';
import WalletAnalysis from '../components/WalletAnalysis';

export default function Home() {
  const mockTransactionFlowData = getMockTransactions();
  const mockWalletAnalysisData = getMockWallets();

  return (
    <div className="dashboard">
      {/* Title Section */}
      <div className="dashboard-title">
        <h1>Solana Forensic Analysis Tool</h1>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Left Column */}
        {/* <div className="dashboard-left" >
          LEFT COLUMN FOR SOMETHING?
        </div> */}

        {/* Right Column */}
        <div className="dashboard-right">

          {/* Placeholder for Entity Labels */}
          {/* <div className="widget entity-labels">
            <h2>Entity Labels</h2>
            <div className="placeholder">Entity Labels Placeholder</div>
          </div> */}

          {/* Placeholder for Transaction Clusters */}
          <div className="widget transaction-clusters">
            <h2>Transaction Clusters</h2>
            <div className="placeholder">Transaction Clusters Placeholder</div>
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