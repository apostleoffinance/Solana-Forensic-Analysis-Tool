'use client'; // Required for client-side rendering with D3
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function Home() {
  const svgRef = useRef(null);

  useEffect(() => {
    // Select the SVG element
    const svg = d3.select(svgRef.current)
      .attr('width', 800)
      .attr('height', 600);

    // Sample data (mock Solana transactions)
    const transactions = [
      { source: 'Wallet A', target: 'Wallet B', amount: 10 },
      { source: 'Wallet B', target: 'Wallet C', amount: 5 },
    ];

    // Draw lines for transactions
    svg.selectAll('line')
      .data(transactions)
      .enter()
      .append('line')
      .attr('x1', (d, i) => i * 200 + 100) // Horizontal spacing
      .attr('y1', 100)
      .attr('x2', (d, i) => i * 200 + 300)
      .attr('y2', 300)
      .attr('stroke', 'blue')
      .attr('stroke-width', 2);

    // Add labels
    svg.selectAll('text')
      .data(transactions)
      .enter()
      .append('text')
      .attr('x', (d, i) => i * 200 + 200)
      .attr('y', 200)
      .text(d => `${d.source} -> ${d.target} (${d.amount} SOL)`)
      .attr('text-anchor', 'middle')
      .attr('fill', 'black');
  }, []);

  return (
    <div>
      <h1>Solana Transaction Flow</h1>
      <svg ref={svgRef}></svg>
    </div>
  );
}