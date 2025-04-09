'use client';
import dynamic from 'next/dynamic';
import { getMockTransactions } from '../api/transactionFlow';
import { getMockWallets } from '../api/walletAnalysis';
import { getMockClusters } from '../api/transactionClusters';
import { getMockEntities } from '../api/entityLabels';
import TransactionFlow from '../components/TransactionFlow';

export default function Home() {
  // const TransactionFlow = dynamic(() => import('../components/TransactionFlow'), {
  //   ssr: false
  // });
  const WalletAnalysis = dynamic(() => import('../components/WalletAnalysis'), {
    ssr: false
  });
  const TransactionClusters = dynamic(() => import('../components/TransactionClusters'), {
    ssr: false
  });
  const EntityLabels = dynamic(() => import('../components/EntityLabels'), {
    ssr: false
  });

  const mockTransactions = getMockTransactions();
  const mockWallets = getMockWallets();
  const mockClusters = getMockClusters();
  const mockEntities = getMockEntities();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Solana Forensic Analysis Tool</h1>
      <TransactionFlow transactions={mockTransactions} />
      {/* <WalletAnalysis wallets={mockWallets} />
      <TransactionClusters clusters={mockClusters} />
      <EntityLabels entities={mockEntities} /> */}
    </div>
  );
}