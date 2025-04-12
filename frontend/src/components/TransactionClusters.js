import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function TransactionClusters({ clusters }) {
  const containerRef = useRef();

  useEffect(() => {
    // Initialize Cytoscape instance
    const cy = cytoscape({
      container: containerRef.current,
      elements: generateElements(clusters), // Convert clusters to nodes and edges
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => (ele.data('unusual') ? 'orange' : 'lightblue'),
            'label': 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 60,
            'height': 60,
            'font-size': '12px',
            'border-width': 1,
            'border-color': 'black',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: {
        name: 'cose', // Compound Spring Embedder layout for clustering
        animate: true,
        nodeRepulsion: () => 400000, // Spread nodes out
        idealEdgeLength: () => 100, // Edge length preference
      },
    });

    // Cleanup on unmount
    return () => cy.destroy();
  }, [clusters]);

  return (
    <div>
      <h2>Transaction Clusters</h2>
      <div
        ref={containerRef}
        style={{ width: '800px', height: '400px', border: '1px solid #ccc' }}
      />
    </div>
  );
}

// Helper function to convert clusters data into Cytoscape elements
function generateElements(clusters) {
  const elements = [];

  // Add cluster nodes
  clusters.forEach((cluster) => {
    elements.push({
      data: {
        id: cluster.id,
        label: `${cluster.id}\n${cluster.wallets.length} wallets`,
        unusual: cluster.unusual,
      },
    });

    // Add wallet nodes and edges to cluster
    cluster.wallets.forEach((wallet, index) => {
      const walletId = `${cluster.id}-${wallet}`;
      elements.push({
        data: {
          id: walletId,
          label: wallet,
          unusual: cluster.unusual, // Inherit unusual flag for simplicity
        },
      });
      elements.push({
        data: {
          id: `${cluster.id}-to-${walletId}`,
          source: cluster.id,
          target: walletId,
        },
      });
    });
  });

  return elements;
}