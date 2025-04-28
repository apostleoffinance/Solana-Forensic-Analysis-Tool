'use client'
import React, { useEffect, useState, useMemo } from 'react'
import TransactionFlow from '@/components/TransactionFlow'
import { useData } from '@/app/DataContext'

export default function TransactionFlowPage() {
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
    }, [data]);

    

    // Memoize tx_graph to prevent unnecessary re-renders of TransactionFlow
    const memoizedTxGraph = useMemo(() => {
        if (!tx_graph) return null;
        return {
            edges: tx_graph.edges,
            nodes: tx_graph.nodes
        };
    }, [tx_graph]);


    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }
    if (!memoizedTxGraph || !wallet_analysis) {
        return <div>No data available</div>;
    }

    return (
        <TransactionFlow tx_graph={memoizedTxGraph} />
    )
}