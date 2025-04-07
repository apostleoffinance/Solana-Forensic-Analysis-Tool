import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function TransactionClusters({ clusters }) {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', 800)
      .attr('height', 200)
      .style('border', '1px solid #ccc');

    svg.selectAll('*').remove();

    // Draw clusters as rectangles
    svg.selectAll('rect')
      .data(clusters)
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * 200 + 20)
      .attr('y', 20)
      .attr('width', 150)
      .attr('height', 150)
      .attr('fill', d => d.unusual ? 'orange' : 'lightblue')
      .attr('stroke', 'black');

    // Add cluster labels
    svg.selectAll('text')
      .data(clusters)
      .enter()
      .append('text')
      .attr('x', (d, i) => i * 200 + 95)
      .attr('y', 90)
      .text(d => `Cluster ${d.id}`)
      .attr('text-anchor', 'middle');

    // Add details
    svg.selectAll('.details')
      .data(clusters)
      .enter()
      .append('text')
      .attr('x', (d, i) => i * 200 + 95)
      .attr('y', 110)
      .text(d => `${d.wallets.length} wallets`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px');
  }, [clusters]);

  return (
    <div>
      <h2>Transaction Clusters</h2>
      <svg ref={svgRef}></svg>
    </div>
  );
}