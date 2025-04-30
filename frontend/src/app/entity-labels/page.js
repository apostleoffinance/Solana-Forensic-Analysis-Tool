// app/entity-labels/page.jsx
'use client';

import React, { useEffect, useState } from 'react';
import EntityLabels from '@/components/EntityLabels';
import AddressModal from '@/components/AddressModal';
import { useData } from '@/app/DataContext';

export default function EntityLabelsPage() {
  const { data, error, isHomepage } = useData();
  const [tx_graph, setTxGraph] = useState(null);
  const [wallet_analysis, setWalletAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data) {
      console.log('isHomepage:', isHomepage);
      setTxGraph(data.tx_graph);
      setWalletAnalysis(data.wallet_analysis);
      setLoading(false);
    }
  }, [data, isHomepage]);

  // Show modal on non-homepage when no data
  if (!isHomepage && !data && !error) {
    return <AddressModal />;
  }

  // Show error if present
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Show loading while data is being processed
  if (loading) {
    return <div>Loading...</div>;
  }

  // Check for valid data
  if (!tx_graph || !wallet_analysis) {
    return <div>No data available</div>;
  }

  return (
    <>
      <AddressModal />
      <EntityLabels tx_graph={tx_graph} wallet_analysis={wallet_analysis} />
    </>
  );
}