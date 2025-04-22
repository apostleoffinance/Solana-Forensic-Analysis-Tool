import React from 'react'
import TransactionFlow from '@/components/TransactionFlow'
import { getMockTransactions } from '@/api/transactionFlow'

export default function TransactionFlowPage() {
    const mockTransactionFlowData = getMockTransactions();
    
    return (
    <div className="widget transaction-flow">
        <h2>Transaction Flow</h2>
        <TransactionFlow transactions={mockTransactionFlowData} />
    </div>
    )
}
