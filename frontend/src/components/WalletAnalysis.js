'use client';
import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function WalletAnalysis({ wallets }) {
  const containerRef = useRef();

  useEffect(() => {
    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: generateElements(wallets),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) =>
              ele.data('type') === 'wallet' ? '#1E90FF' : '#FFD700', // Blue for wallets, gold for sources
            'label': 'data(label)',
            'width': (ele) => (ele.data('type') === 'wallet' ? 40 : 30),
            'height': (ele) => (ele.data('type') === 'wallet' ? 40 : 30),
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'border-width': 1,
            'border-color': '#000',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#666',
            'target-arrow-color': '#666',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: {
        name: 'cose', // Force-directed layout for natural clustering
        animate: true,
        nodeRepulsion: () => 400000,
        idealEdgeLength: () => 100,
        fit: true,
        padding: 30,
      },
    });

    // Enable dragging
    cy.nodes().grabify();

    // Add tooltips or details on hover (optional)
    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      const { history, patterns } = node.data();
      if (history || patterns) {
        node.popper({
          content: () => {
            const div = document.createElement('div');
            div.style.background = '#fff';
            div.style.border = '1px solid #ccc';
            div.style.padding = '5px';
            div.innerHTML = `
              <strong>${node.data('id')}</strong><br>
              ${history ? `History: ${history.join(', ')}<br>` : ''}
              ${patterns ? `Patterns: ${patterns}` : ''}
            `;
            return div;
          },
          popper: { placement: 'top' },
        });
      }
    });

    cy.on('mouseout', 'node', (event) => {
      const node = event.target;
      if (node.popperRef) {
        node.popperRef.destroy();
        delete node.popperRef;
      }
    });

    // Cleanup
    return () => cy.destroy();
  }, [wallets]);

  return (
    <div>
      <h2>Wallet Analysis</h2>
      <div
        ref={containerRef}
        style={{ width: '800px', height: '400px', border: '1px solid #ccc' }}
      />
    </div>
  );
}

// Helper function to convert wallet data into Cytoscape elements
function generateElements(wallets) {
  const elements = [];

  // Add wallet nodes and their funding source nodes/edges
  Object.entries(wallets).forEach(([wallet, data]) => {
    // Wallet node
    elements.push({
      data: {
        id: wallet,
        label: `${wallet}\n${data.fundingSources.length} conn.`,
        type: 'wallet',
        history: data.history,
        patterns: data.patterns,
      },
    });

    // Funding source nodes and edges
    data.fundingSources.forEach((source) => {
      if (!elements.some((el) => el.data.id === source)) {
        elements.push({
          data: {
            id: source,
            label: source,
            type: 'source',
          },
        });
      }
      elements.push({
        data: {
          id: `${source}-to-${wallet}`,
          source: source,
          target: wallet,
        },
      });
    });
  });

  return elements;
}
