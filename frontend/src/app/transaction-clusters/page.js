import React from 'react'
import TransactionClusters from '@/components/TransactionClusters'
import { getMockTransactionClusters } from '@/api/transactionClusters'

export default function TransactionClusterPage() {
    const mockTransactionClustersData = getMockTransactionClusters()
  return (
    <div className="widget transaction-clusters">
      <h2>Transaction Clusters</h2>
      <TransactionClusters clusters={mockTransactionClustersData} />
    </div>
  )
}
