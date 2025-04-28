'use client';
import React, { useState, useEffect } from 'react';
import WalletAnalysis from '@/components/WalletAnalysis';
import { useData } from '@/app/DataContext'

export default function WalletAnalysisPage() {
    const { data, error } = useData();
    const [tx_graph, setTxGraph] = useState(null);
    const [wallet_analysis, setWalletAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      if (data) {
        setTxGraph(data.tx_graph);
        setWalletAnalysis(data.wallet_analysis);
        setLoading(false);
      }
    }
    , [data]);
  
    if (loading) {
      return <div>Loading...</div>;
    }
    if (error) {
      return <div>Error: {error}</div>;
    }
    if (!tx_graph || !wallet_analysis) {
      return <div>No data available</div>;
    }

  return (
    <div className="transfers-section">
      <WalletAnalysis tx_graph={tx_graph} wallet_analysis={wallet_analysis} />
    </div>
  );
}