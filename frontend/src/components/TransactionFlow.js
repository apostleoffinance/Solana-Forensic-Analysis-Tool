'use client';
import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export default function TransactionFlow({ transactions }) {
  const containerRef = useRef(null); // Explicitly initialize as null
  const cyRef = useRef(null); // Store Cytoscape instance
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState(0);

  useEffect(() => {
    // Ensure container exists before initializing
    if (!containerRef.current) return;

    // Destroy previous instance if it exists
    if (cyRef.current) {
      cyRef.current.destroy();
      cyRef.current = null;
    }

    // Filter transactions
    const filtered = transactions.filter(
      (tx) =>
        (!dateFilter || tx.date === dateFilter) && tx.amount >= amountFilter
    );

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: generateElements(filtered),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'blue',
            'label': 'data(id)',
            'width': 20,
            'height': 20,
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': (ele) => Math.sqrt(ele.data('amount')) || 1,
            'line-color': (ele) => (ele.data('critical') ? 'red' : 'gray'),
            'target-arrow-color': (ele) => (ele.data('critical') ? 'red' : 'gray'),
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        nodeRepulsion: () => 400000,
        idealEdgeLength: () => 100,
        fit: true,
        padding: 30,
      },
    });

    cy.nodes().grabify(); // Enable dragging
    cyRef.current = cy; // Store instance

    // Cleanup on unmount or update
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [transactions, dateFilter, amountFilter]);

  return (
    <div>
      <h2>Transaction Flow</h2>
      <div>
        <label>Date Filter: </label>
        <input
          type="date"
          onChange={(e) => setDateFilter(e.target.value.replaceAll('-', '-'))}
        />
        <label> Min Amount: </label>
        <input
          type="number"
          min="0"
          value={amountFilter}
          onChange={(e) => setAmountFilter(Number(e.target.value))}
        />
      </div>
      <div
        ref={containerRef}
        style={{ width: '800px', height: '400px', border: '1px solid #ccc' }}
      />
    </div>
  );
}

function generateElements(transactions) {
  const nodes = new Set();
  const edges = [];

  transactions.forEach((tx, idx) => {
    nodes.add(tx.source);
    nodes.add(tx.target);
    edges.push({
      data: {
        key: `${idx}`,
        id: `${tx.source}-${tx.target}-${tx.amount}`,
        source: tx.source,
        target: tx.target,
        amount: tx.amount,
        critical: tx.critical,
      },
    });
  });

  return [
    ...Array.from(nodes).map((id) => ({ data: { id } })),
    ...edges,
  ];
}