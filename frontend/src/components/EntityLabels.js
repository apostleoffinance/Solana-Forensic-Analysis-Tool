'use client';
import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

export default function EntityLabels({ entities }) {
  const containerRef = useRef();

  useEffect(() => {
    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: generateElements(entities),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => getColorByLabel(ele.data('label')),
            'label': 'data(label)',
            'width': 40,
            'height': 40,
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
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
        name: 'cose', // Force-directed layout
        animate: true,
        nodeRepulsion: () => 400000,
        idealEdgeLength: () => 100,
        fit: true,
        padding: 30,
      },
    });

    // Enable dragging
    cy.nodes().grabify();

    // Add tooltips on hover
    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      node.popper({
        content: () => {
          const div = document.createElement('div');
          div.style.background = '#fff';
          div.style.border = '1px solid #ccc';
          div.style.padding = '5px';
          div.innerHTML = `<strong>${node.data('id')}</strong><br>Label: ${node.data('label')}`;
          return div;
        },
        popper: { placement: 'top' },
      });
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
  }, [entities]);

  return (
    <div>
      <h2>Entity Labels</h2>
      <div
        ref={containerRef}
        style={{ width: '800px', height: '400px', border: '1px solid #ccc' }}
      />
    </div>
  );
}

// Helper function to convert entities into Cytoscape elements
function generateElements(entities) {
  const elements = [];

  // Add nodes for each wallet with its label
  Object.entries(entities).forEach(([wallet, label]) => {
    elements.push({
      data: {
        id: wallet,
        label: `${wallet}\n${label}`,
      },
    });
  });

  // Optional: Infer edges if entities reference each other (e.g., WalletA -> WalletB)
  // This assumes no direct connections in mock data; extend if needed
  return elements;
}

// Helper function to assign colors based on label
function getColorByLabel(label) {
  if (label.includes('Exchange')) return '#FFD700'; // Gold for exchanges
  if (label.includes('DeFi')) return '#32CD32'; // Green for DeFi projects
  if (label.includes('Unknown')) return '#A9A9A9'; // Gray for unknown
  return '#1E90FF'; // Default blue
}