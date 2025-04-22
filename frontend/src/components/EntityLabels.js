'use client';
import { useState, useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import popper from 'cytoscape-popper';

// Register popper extension with Cytoscape
cytoscape.use(popper);

export default function EntityLabels({ entities }) {
  const [selectedEntity, setSelectedEntity] = useState(entities[0]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'graph'
  const containerRef = useRef();

  // Calculate summary statistics
  const summary = {
    totalEntities: entities.length,
    exchanges: entities.filter((e) =>
      e.label.toLowerCase().includes('exchange')
    ).length,
    defiProjects: entities.filter((e) =>
      e.label.toLowerCase().includes('defi')
    ).length,
    unknown: entities.filter((e) =>
      e.label.toLowerCase().includes('unknown')
    ).length,
  };

  // Cytoscape.js setup
  useEffect(() => {
    if (viewMode !== 'graph') return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: generateElements(entities),
      style: [
        {
          selector: 'node[type="wallet"]',
          style: {
            'background-color': (ele) => {
              const label = ele.data('label').toLowerCase();
              if (label.includes('exchange')) return '#FFD700'; // Gold for exchanges
              if (label.includes('defi')) return '#84CC16'; // Green for DeFi (matches --accent-green)
              if (label.includes('unknown')) return '#A1A1AA'; // Gray for unknown (matches --text-secondary)
              return '#3B82F6'; // Default blue (matches --accent-blue)
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
            'background-color': '#FFD700', // Gold for associated entities
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
            'line-color': (ele) =>
              ele.data('unusual') ? '#E11D48' : '#A1A1AA', // Red for unusual, gray for normal
            'target-arrow-color': (ele) =>
              ele.data('unusual') ? '#E11D48' : '#A1A1AA',
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
              ${
                type === 'wallet'
                  ? `<p><strong>Confidence:</strong> ${(confidence * 100).toFixed(1)}%</p>
                     ${patternsHTML}`
                  : ''
              }
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
  }, [entities, viewMode]);

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
          <div
            ref={containerRef}
            className="cy-container"
          />
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
                  key={entity.wallet}
                  className={`table-row ${
                    selectedEntity.wallet === entity.wallet ? 'selected' : ''
                  }`}
                >
                  <span>{entity.wallet}</span>
                  <span>{entity.label}</span>
                  <span>{(entity.labelMetadata.confidence * 100).toFixed(1)}%</span>
                  <span>{entity.network}</span>
                  <span>{entity.associatedEntities.join(', ')}</span>
                  <span>
                    <button
                      className="action-btn"
                      onClick={() => setSelectedEntity(entity)}
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
              <h3>
                Deposit/Withdrawal Patterns for {selectedEntity.wallet}
              </h3>
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
                    className={`table-row ${
                      pattern.target.toLowerCase().includes('mixer') ||
                      pattern.target.toLowerCase().includes('dark')
                        ? 'unusual-row'
                        : ''
                    }`}
                  >
                    <span>{pattern.type}</span>
                    <span>
                      {pattern.amount} {pattern.currency}
                    </span>
                    <span>{pattern.target}</span>
                    <span>{new Date(pattern.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="patterns-summary">
                <h4>Pattern Insights</h4>
                <p>
                  <strong>Deposit Frequency:</strong>{' '}
                  {
                    selectedEntity.patterns.filter((p) => p.type === 'Deposit')
                      .length
                  }{' '}
                  deposits in the last 30 days
                </p>
                <p>
                  <strong>Withdrawal Frequency:</strong>{' '}
                  {
                    selectedEntity.patterns.filter((p) => p.type === 'Withdrawal')
                      .length
                  }{' '}
                  withdrawals in the last 30 days
                </p>
                <p>
                  <strong>Total Volume:</strong>{' '}
                  {selectedEntity.patterns
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toFixed(2)}{' '}
                  {selectedEntity.patterns[0]?.currency || 'ETH'}
                </p>
                <p>
                  <strong>Unusual Patterns:</strong>{' '}
                  {selectedEntity.patterns.some(
                    (p) =>
                      p.target.toLowerCase().includes('mixer') ||
                      p.target.toLowerCase().includes('dark')
                  )
                    ? 'Yes (Potential Mixer or Dark Web Activity)'
                    : 'None'}
                </p>
              </div>
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
        .table-header, .table-row {
          display: grid;
          grid-template-columns: 1fr 2fr 1fr 1fr 2fr 1fr;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border);
          font-size: 0.85rem;
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
          background-color: #2563eb; /* Slightly darker blue */
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
        .patterns-table .table-header, .patterns-table .table-row {
          grid-template-columns: 1fr 1fr 2fr 2fr;
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
        .cy-tooltip {
          background-color: rgba(26, 32, 44, 0.95);
          color: var(--text-primary);
          padding: 10px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 10000;
          max-width: 250px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .cy-tooltip .tooltip-content h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .cy-tooltip .tooltip-content p {
          margin: 4px 0;
          line-height: 1.4;
        }
        .cy-tooltip .tooltip-content h4 {
          margin: 8px 0 4px 0;
          font-size: 12px;
          color: var(--text-secondary);
        }
        .cy-tooltip .tooltip-content ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .cy-tooltip .tooltip-content li {
          font-size: 11px;
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}

// Helper function to convert entities into Cytoscape elements
function generateElements(entities) {
  const elements = [];

  // Add wallet nodes
  entities.forEach((entity) => {
    elements.push({
      data: {
        id: entity.wallet,
        label: `${entity.wallet}\n${entity.label}`,
        type: 'wallet',
        confidence: entity.labelMetadata.confidence,
        patterns: entity.patterns,
      },
    });

    // Add nodes for associated entities (e.g., Binance, Aave) and edges to them
    entity.associatedEntities.forEach((assocEntity) => {
      if (!elements.some((el) => el.data.id === assocEntity)) {
        elements.push({
          data: {
            id: assocEntity,
            label: assocEntity,
            type: 'entity',
          },
        });
      }
      elements.push({
        data: {
          id: `${entity.wallet}-to-${assocEntity}`,
          source: entity.wallet,
          target: assocEntity,
          label: 'Associated',
          unusual: assocEntity.toLowerCase().includes('mixer') || assocEntity.toLowerCase().includes('dark'),
        },
      });
    });

    // Add edges for deposit/withdrawal patterns
    entity.patterns.forEach((pattern) => {
      const target = pattern.target;
      if (!elements.some((el) => el.data.id === target)) {
        elements.push({
          data: {
            id: target,
            label: target,
            type: 'entity',
          },
        });
      }
      elements.push({
        data: {
          id: `${entity.wallet}-to-${target}-${pattern.timestamp}`,
          source: entity.wallet,
          target: target,
          label: `${pattern.type}: ${pattern.amount} ${pattern.currency}`,
          unusual:
            target.toLowerCase().includes('mixer') ||
            target.toLowerCase().includes('dark'),
        },
      });
    });
  });

  return elements;
}