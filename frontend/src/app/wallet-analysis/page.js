import React from 'react';
import WalletAnalysis from '@/components/WalletAnalysis';
import { getMockWallets } from '@/api/walletAnalysis';

export default function WalletAnalysisPage() {
  const mockWalletAnalysisData = getMockWallets();

  return (
    <div className="transfers-section">
      <WalletAnalysis wallets={mockWalletAnalysisData} />
    </div>
  );
}