'use client'
import React, { useEffect, useState, useMemo } from 'react'
import TransactionFlow from '@/components/TransactionFlow'
import AddressModal from '@/components/AddressModal';
import { useData } from '@/app/DataContext'

export default function TransactionFlowPage() {
    const { data, error, isHomepage } = useData();
    const [tx_graph, setTxGraph] = useState(null);
    const [wallet_analysis, setWalletAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (data) {
            setTxGraph(data.tx_graph);
            setWalletAnalysis(data.wallet_analysis);
            setLoading(false);
        }
    }, [data, isHomepage]);

    

    // Memoize tx_graph to prevent unnecessary re-renders of TransactionFlow
    const memoizedTxGraph = useMemo(() => {
        if (!tx_graph) return null;
        return {
            edges: tx_graph.edges,
            nodes: tx_graph.nodes
        };
    }, [tx_graph]);


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
            <TransactionFlow tx_graph={memoizedTxGraph} />
        </>
    )
}