'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function TransactionFlow({ transactions }) {
  const svgRef = useRef();
  const [dateFilter, setDateFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState(0);

  useEffect(() => {
    const svg = d3.select(svgRef.current)
      .attr('width', 800)
      .attr('height', 400)
      .style('border', '1px solid #ccc');

    const filtered = transactions.filter(tx => 
      (!dateFilter || tx.date === dateFilter) && 
      tx.amount >= amountFilter
    );

    svg.selectAll('*').remove();

    const nodes = [...new Set(filtered.flatMap(tx => [tx.source, tx.target]))];
    const links = filtered.map(tx => ({ 
      source: tx.source, 
      target: tx.target, 
      amount: tx.amount, 
      critical: tx.critical 
    }));

    const simulation = d3.forceSimulation(nodes.map(id => ({ id })))
      .force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(400, 200));

    const link = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => d.critical ? 'red' : 'gray')
      .attr('stroke-width', d => Math.sqrt(d.amount));

    const node = svg.append('g')
      .selectAll('circle')
      .data(simulation.nodes())
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', 'blue')
      .call(drag(simulation)); // Updated to use a separate drag function

    const label = svg.append('g')
      .selectAll('text')
      .data(simulation.nodes())
      .enter()
      .append('text')
      .text(d => d.id)
      .attr('dx', 12)
      .attr('dy', 4);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
  }, [transactions, dateFilter, amountFilter]);

  // Define drag behavior as a separate function
  function drag(simulation) {
    function dragStarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3.drag()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded);
  }

  return (
    <div>
      <h2>Transaction Flow</h2>
      <div>
        <label>Date Filter: </label>
        <input 
          type="date" 
          onChange={e => setDateFilter(e.target.value.replaceAll('-', '-'))} 
        />
        <label> Min Amount: </label>
        <input 
          type="number" 
          min="0" 
          value={amountFilter} 
          onChange={e => setAmountFilter(Number(e.target.value))} 
        />
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
}