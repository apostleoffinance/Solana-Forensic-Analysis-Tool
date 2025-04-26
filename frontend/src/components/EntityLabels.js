'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import cytoscape from 'cytoscape';
import popper from 'cytoscape-popper';

// Register popper extension with Cytoscape
cytoscape.use(popper);

export default function EntityLabels({ tx_graph, wallet_analysis }) {
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'graph'
  const containerRef = useRef();

  // Memoize entities to prevent recreation on every render
  const entities = useMemo(() => {
    return Object.values(tx_graph?.nodes || {})
      .filter(node => node.id && node.id !== '')
      .map((node, index) => {
        const isTargetWallet = node.id === wallet_analysis?.activity_patterns?.wallet_address;
        const patterns = isTargetWallet
          ? [
              ...Object.entries(wallet_analysis?.funding_sources?.[0]?.['Token Received (Total)'] || {}).flatMap(([currency, amountObj], idx) =>
                Object.entries(amountObj).map(([token, amount]) => ({
                  type: 'Deposit',
                  amount,
                  currency: `${currency} (${token})`,
                  timestamp: new Date(
                    new Date(wallet_analysis?.transaction_history?.first_transaction || Date.now()).getTime() +
                      (idx * (new Date(wallet_analysis?.transaction_history?.last_transaction || Date.now()) - new Date(wallet_analysis?.transaction_history?.first_transaction || Date.now())) / (wallet_analysis?.transaction_history?.num_transactions || 1))
                  ).toISOString(),
                  target: (tx_graph?.edges || []).find((e) => e.to === node.id)?.from || 'Unknown',
                }))
              ),
              ...Object.entries(wallet_analysis?.funding_sources?.[0]?.['Token Sent (Total)'] || {}).flatMap(([currency, amountObj], idx) =>
                Object.entries(amountObj).map(([token, amount]) => ({
                  type: 'Withdrawal',
                  amount,
                  currency: `${currency} (${token})`,
                  timestamp: new Date(
                    new Date(wallet_analysis?.transaction_history?.first_transaction || Date.now()).getTime() +
                      ((idx + Object.keys(wallet_analysis?.funding_sources?.[0]?.['Token Received (Total)'] || {}).length) *
                        (new Date(wallet_analysis?.transaction_history?.last_transaction || Date.now()) - new Date(wallet_analysis?.transaction_history?.first_transaction || Date.now())) /
                        (wallet_analysis?.transaction_history?.num_transactions || 1))
                  ).toISOString(),
                  target: (tx_graph?.edges || []).find((e) => e.from === node.id)?.to || 'Unknown',
                }))
              ),
            ]
          : [];
    
        const associatedEntities = (tx_graph?.edges || [])
          .filter((e) => e.from === node.id || e.to === node.id)
          .filter((e) => e.from && e.to)
          .map((e) => {
            const relatedNodeId = e.from === node.id ? e.to : e.from;
            const relatedNode = tx_graph?.nodes?.[relatedNodeId];
            return relatedNode?.label;
          })
          .filter((label) => label && label !== node.label);
        return {
          wallet: `${node.id.slice(0, 4)}...${node.id.slice(-4)}`,
          fullAddress: node.id,
          network: 'Solana',
          label: node.label,
          labelMetadata: {
            confidence: node.label.includes('Unknown') ? 0.60 : 0.95,
          },
          patterns,
          associatedEntities: [...new Set(associatedEntities)],
        };
      });
  }, [tx_graph, wallet_analysis]);

  // Set initial selected entity
  useEffect(() => {
    if (!selectedEntity || selectedEntity.fullAddress !== wallet_analysis?.activity_patterns?.wallet_address) {
      const targetEntity = entities.find((e) => e.fullAddress === wallet_analysis?.activity_patterns?.wallet_address);
      const newSelectedEntity = targetEntity || entities[0];
      setSelectedEntity(newSelectedEntity);
    }
  }, [entities, wallet_analysis]); // Remove selectedEntity from dependencies

  // Log selectedEntity updates
  useEffect(() => {
    console.log('selectedEntity updated:', selectedEntity);
  }, [selectedEntity]);

  // Calculate summary statistics
  const summary = {
    totalEntities: entities.length,
    exchanges: entities.filter((e) => e.label.toLowerCase().includes('exchange')).length,
    defiProjects: entities.filter((e) => e.label.toLowerCase().includes('jupiter') || e.label.toLowerCase().includes('orca') || e.label.toLowerCase().includes('raydium')).length,
    unknown: entities.filter((e) => e.label.toLowerCase().includes('unknown')).length,
  };

  // Cytoscape.js setup
  useEffect(() => {
    if (viewMode !== 'graph' || !containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: generateElements(entities, tx_graph?.edges || [], wallet_analysis),
      style: [
        {
          selector: 'node[type="wallet"]',
          style: {
            'background-color': (ele) => {
              const label = ele.data('label').toLowerCase();
              if (label.includes('exchange')) return '#FFD700';
              if (label.includes('jupiter')) return 'var(--accent-purple)';
              if (label.includes('orca')) return 'var(--accent-teal)';
              if (label.includes('raydium')) return 'var(--accent-pink)';
              if (label.includes('unknown')) return 'var(--text-secondary)';
              return 'var(--accent-blue)';
            },
            'label': 'data(label)',
            'width': 50,
            'height': 50,
            'font-size': '12px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
            'border-width': 2,
            'border-color': '#ffffff',
            'color': '#ffffff',
            'text-outline-width': 2,
            'text-outline-color': '#1a202c',
          },
        },
        {
          selector: 'node[type="entity"]',
          style: {
            'background-color': '#FFD700',
            'label': 'data(label)',
            'width': 30,
            'height': 30,
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'border-width': 1,
            'border-color': '#ffffff',
            'color': '#ffffff',
            'text-outline-width': 1,
            'text-outline-color': '#1a202c',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': (ele) => (ele.data('unusual') ? 'var(--accent-red)' : 'var(--text-secondary)'),
            'target-arrow-color': (ele) => (ele.data('unusual') ? 'var(--accent-red)' : 'var(--text-secondary)'),
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '10px',
            'text-rotation': 'autorotate',
            'text-outline-width': 1,
            'text-outline-color': '#1a202c',
            'color': '#ffffff',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        nodeRepulsion: () => 500000,
        idealEdgeLength: () => 150,
        fit: true,
        padding: 50,
        nodeDimensionsIncludeLabels: true,
      },
    });

    // Enable dragging
    cy.nodes().grabify();

    // Add tooltips on hover
    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      const { id, type, label, confidence, patterns } = node.data();
      node.popper({
        content: () => {
          const div = document.createElement('div');
          div.className = 'cy-tooltip';
          let patternsHTML = '';
          if (patterns && patterns.length > 0) {
            patternsHTML = '<h4>Recent Patterns:</h4><ul>';
            patterns.forEach((p) => {
              patternsHTML += `<li>${p.type}: ${p.amount} ${p.currency} to ${p.target}</li>`;
            });
            patternsHTML += '</ul>';
          }
          div.innerHTML = `
            <div class="tooltip-content">
              <h3>${id}</h3>
              <p><strong>Type:</strong> ${type === 'wallet' ? 'Wallet' : 'Entity'}</p>
              <p><strong>Label:</strong> ${label}</p>
              ${type === 'wallet' ? `<p><strong>Confidence:</strong> ${(confidence * 100).toFixed(1)}%</p>${patternsHTML}` : ''}
            </div>
          `;
          document.body.appendChild(div);
          return div;
        },
        popper: { placement: 'top' },
      });
    });

    cy.on('mouseout', 'node', (event) => {
      const node = event.target;
      if (node.popper) {
        const tooltip = node.popper().popper;
        tooltip.parentNode.removeChild(tooltip);
        node.popper().destroy();
      }
    });

    // Cleanup
    return () => {
      cy.destroy();
    };
  }, [viewMode, entities, tx_graph, wallet_analysis]);

  return (
    <div className="entity-labels">
      {/* View Toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          Table View
        </button>
        <button
          className={`toggle-btn ${viewMode === 'graph' ? 'active' : ''}`}
          onClick={() => setViewMode('graph')}
        >
          Graph View
        </button>
      </div>

      {/* Graph View */}
      {viewMode === 'graph' && (
        <div className="graph-view">
          <h3>Entity Network Visualization</h3>
          <div ref={containerRef} className="cy-container" />
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <>
          {/* Summary Section */}
          <div className="summary-section">
            <h3>Entity Labeling Summary</h3>
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Total Entities</h4>
                <p>{summary.totalEntities}</p>
              </div>
              <div className="summary-card">
                <h4>Exchange Addresses</h4>
                <p>{summary.exchanges}</p>
              </div>
              <div className="summary-card">
                <h4>DeFi Projects</h4>
                <p>{summary.defiProjects}</p>
              </div>
              <div className="summary-card">
                <h4>Unknown Entities</h4>
                <p>{summary.unknown}</p>
              </div>
            </div>
          </div>

          {/* Entity List */}
          <div className="entity-list">
            <h3>Entity List</h3>
            <div className="entity-table">
              <div className="table-header">
                <span>Wallet</span>
                <span>Label</span>
                <span>Confidence</span>
                <span>Network</span>
                <span>Associated Entities</span>
                <span>Actions</span>
              </div>
              {entities.map((entity) => (
                <div
                  key={entity.fullAddress}
                  className={`table-row ${selectedEntity?.fullAddress === entity.fullAddress ? 'selected' : ''}`}
                >
                  <span>{entity.wallet}</span>
                  <span>{entity.label}</span>
                  <span>{(entity.labelMetadata.confidence * 100).toFixed(1)}%</span>
                  <span>{entity.network}</span>
                  <span>{entity.associatedEntities.join(', ')}</span>
                  <span>
                    <button
                      className="action-btn"
                      onClick={() => {
                        const newEntity = { ...entity, timestamp: Date.now() };
                        setSelectedEntity(newEntity);
                      }}
                    >
                      View Patterns
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deposit/Withdrawal Patterns */}
          {selectedEntity && (
            <div className="patterns-section">
              <h3>Deposit/Withdrawal Patterns for {selectedEntity.wallet}</h3>
              {selectedEntity.patterns.length > 0 ? (
                <>
                  <div className="patterns-table">
                    <div className="table-header">
                      <span>Type</span>
                      <span>Amount</span>
                      <span>Target</span>
                      <span>Timestamp</span>
                    </div>
                    {selectedEntity.patterns.map((pattern, index) => (
                      <div
                        key={index}
                        className={`table-row ${pattern.target.toLowerCase().includes('unknown') ? 'unusual-row' : ''}`}
                      >
                        <span>{pattern.type}</span>
                        <span>{pattern.amount} {pattern.currency}</span>
                        <span>{pattern.target}</span>
                        <span>{new Date(pattern.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="patterns-summary">
                    <h4>Pattern Insights</h4>
                    <p>
                      <strong>Deposit Frequency:</strong>{' '}
                      {selectedEntity.patterns.filter((p) => p.type === 'Deposit').length} deposits
                    </p>
                    <p>
                      <strong>Withdrawal Frequency:</strong>{' '}
                      {selectedEntity.patterns.filter((p) => p.type === 'Withdrawal').length} withdrawals
                    </p>
                    <p>
                      <strong>Total Volume:</strong>{' '}
                      {Object.entries(
                        selectedEntity.patterns.reduce((acc, p) => {
                          const [baseCurrency] = p.currency.split(' (');
                          acc[baseCurrency] = (acc[baseCurrency] || 0) + (typeof p.amount === 'number' ? p.amount : 0);
                          return acc;
                        }, {})
                      )
                        .map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`)
                        .join(', ') || '0.00'}
                    </p>
                    <p>
                      <strong>Unusual Patterns:</strong>{' '}
                      {selectedEntity.patterns.some((p) => p.target.toLowerCase().includes('unknown'))
                        ? 'Yes (Unknown Counterparty)'
                        : 'None'}
                    </p>
                  </div>
                </>
              ) : (
                <p>No deposit/withdrawal patterns available for this wallet.</p>
              )}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .entity-labels {
          color: var(--text-primary);
        }
        h3 {
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        h4 {
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: var(--text-secondary);
        }
        .view-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .toggle-btn {
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid var(--border);
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .toggle-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .toggle-btn.active {
          background-color: var(--accent-blue);
          border-color: var(--accent-blue);
        }
        .graph-view {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .cy-container {
          width: 100%;
          height: 400px;
        }
        .summary-section {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }
        .summary-card {
          text-align: center;
        }
        .summary-card p {
          font-size: 1.25rem;
          font-weight: 500;
        }
        .entity-list {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }
        .entity-table {
          display: flex;
          flex-direction: column;
        }
        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr 1fr 2fr 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.85rem;
        }
        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            text-align: left;
          }
          .table-header span,
          .table-row span {
            padding: 0.25rem 0;
          }
        }
        .table-header {
          font-weight: 600;
          color: var(--text-secondary);
        }
        .table-row:last-child {
          border-bottom: none;
        }
        .table-row.selected {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .action-btn {
          background-color: var(--accent-blue);
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 0.8rem;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        .action-btn:hover {
          background-color: #2563eb;
        }
        .patterns-section {
          background-color: var(--card-bg);
          padding: 1rem;
          border-radius: 6px;
          border: 1px solid var(--border);
        }
        .patterns-table {
          display: flex;
          flex-direction: column;
          margin-bottom: 1rem;
        }
        .patterns-table .table-header,
        .patterns-table .table-row {
          grid-template-columns: 1fr 1fr 2fr 2fr;
        }
        @media (max-width: 768px) {
          .patterns-table .table-header,
          .patterns-table .table-row {
            grid-template-columns: 1fr;
          }
        }
        .table-row.unusual-row {
          color: var(--accent-red);
        }
        .patterns-summary {
          font-size: 0.85rem;
        }
        .patterns-summary p {
          margin-bottom: 0.5rem;
        }
      `}</style>
      <style jsx global>{`
        :root {
          --accent-purple: #7B3FE4;
          --accent-teal: #26A69A;
          --accent-pink: #FF2D55;
        }
        .cy-tooltip {
          background-color: rgba(26, 32, 44, 0.95);
          color: var(--text-primary);
          padding: 12px;
          border-radius: 4px;
          font-size: 14px;
          z-index: 10000;
          max-width: 300px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .cy-tooltip .tooltip-content h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }
        .cy-tooltip .tooltip-content p {
          margin: 4px 0;
          line-height: 1.4;
        }
        .cy-tooltip .tooltip-content h4 {
          margin: 8px 0 4px 0;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .cy-tooltip .tooltip-content ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .cy-tooltip .tooltip-content li {
          font-size: 12px;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}

// Helper function to convert entities into Cytoscape elements
function generateElements(entities, edges, wallet_analysis) {
  const elements = [];

  // Add wallet nodes
  entities.forEach((entity) => {
    if (!entity.fullAddress) return;
    elements.push({
      data: {
        id: entity.fullAddress,
        label: `${entity.wallet}\n${entity.label}`,
        type: 'wallet',
        confidence: entity.labelMetadata.confidence,
        patterns: entity.patterns,
      },
    });

    // Add nodes for associated entities and edges
    entity.associatedEntities.forEach((assocEntity) => {
      if (!assocEntity) return;
      if (!elements.some((el) => el.data.id === assocEntity)) {
        elements.push({
          data: {
            id: assocEntity,
            label: assocEntity,
            type: 'entity',
          },
        });
      }
      const edgeId = `${entity.fullAddress}-to-${assocEntity}`;
      if (!edgeId.includes('')) {
        elements.push({
          data: {
            id: edgeId,
            source: entity.fullAddress,
            target: assocEntity,
            label: 'Associated',
            unusual: assocEntity.toLowerCase().includes('unknown'),
          },
        });
      }
    });

    // Add edges for patterns
    entity.patterns.forEach((pattern) => {
      const target = pattern.target;
      if (!target) return;
      if (!elements.some((el) => el.data.id === target)) {
        elements.push({
          data: {
            id: target,
            label: target,
            type: 'entity',
          },
        });
      }
      const edgeId = `${entity.fullAddress}-to-${target}-${pattern.timestamp}`;
      if (!edgeId.includes('')) {
        elements.push({
          data: {
            id: edgeId,
            source: entity.fullAddress,
            target: target,
            label: `${pattern.type}: ${pattern.amount} ${pattern.currency}`,
            unusual: target.toLowerCase().includes('unknown'),
          },
        });
      }
    });
  });

  return elements;
}