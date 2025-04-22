'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import cytoscape from 'cytoscape';
import popper from 'cytoscape-popper';

// Register popper extension with Cytoscape
cytoscape.use(popper);

export default function Home() {
  const containerRef = useRef();
  const heroNetworkRef = useRef();

  useEffect(() => {
    console.log('Home component rendered');
  }, []);

  // Hero Network Animation setup
  useEffect(() => {
    if (!heroNetworkRef.current) return;

    const heroElements = generateHeroNetwork(60, 90);
    
    const cy = cytoscape({
      container: heroNetworkRef.current,
      elements: heroElements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => {
              const rand = Math.random();
              if (rand < 0.4) return '#3B82F6';
              if (rand < 0.7) return '#84CC16';
              if (rand < 0.9) return '#E11D48';
              return '#A1A1AA';
            },
            'width': (ele) => 3 + Math.random() * 7,
            'height': (ele) => 3 + Math.random() * 7,
            'opacity': 0.8,
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': (ele) => {
              const rand = Math.random();
              if (rand < 0.5) return '#3B82F6';
              if (rand < 0.8) return '#84CC16';
              return '#A1A1AA';
            },
            'opacity': 0.5,
            'curve-style': 'straight',
          },
        },
      ],
      layout: {
        name: 'random',
        fit: true,
        padding: 0,
      },
      minZoom: 1,
      maxZoom: 1,
      userZoomingEnabled: false,
      userPanningEnabled: false,
      autoungrabify: true,
      autounselectify: true,
    });

    let animationFrameId;
    const animateNetwork = () => {
      cy.nodes().forEach((node) => {
        const xOffset = (Math.random() - 0.5) * 0.5;
        const yOffset = (Math.random() - 0.5) * 0.5;
        node.position({
          x: node.position('x') + xOffset,
          y: node.position('y') + yOffset,
        });
      });
      
      animationFrameId = requestAnimationFrame(animateNetwork);
    };
    
    animateNetwork();

    return () => {
      cancelAnimationFrame(animationFrameId);
      cy.destroy();
    };
  }, []);

  // Network Visualization Section
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: generateSampleNetwork(),
      style: [
        {
          selector: 'node[type="wallet"]',
          style: {
            'background-color': (ele) => {
              const type = ele.data('walletType');
              if (type === 'exchange') return '#FFD700';
              if (type === 'defi') return '#84CC16';
              if (type === 'unknown') return '#A1A1AA';
              if (type === 'validator') return '#9333EA';
              if (type === 'contract') return '#F97316';
              return '#3B82F6';
            },
            'label': 'data(label)',
            'width': 'data(size)',
            'height': 'data(size)',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'border-width': 2,
            'border-color': '#ffffff',
            'color': '#ffffff',
            'text-outline-width': 1,
            'text-outline-color': '#1a202c',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': (ele) => Math.min(1 + ele.data('weight') / 4, 5),
            'line-color': (ele) =>
              ele.data('unusual') ? '#E11D48' : '#A1A1AA',
            'target-arrow-color': (ele) =>
              ele.data('unusual') ? '#E11D48' : '#A1A1AA',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '8px',
            'text-rotation': 'autorotate',
            'text-outline-width': 1,
            'text-outline-color': '#1a202c',
            'color': '#ffffff',
          },
        },
        {
          selector: 'edge[animated]',
          style: {
            'line-style': 'dashed',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: true,
        nodeRepulsion: () => 500000,
        idealEdgeLength: () => 100,
        fit: true,
        padding: 50,
        nodeDimensionsIncludeLabels: true,
        boundingBox: {
          x1: 0,
          y1: 0,
          w: containerRef.current.offsetWidth,
          h: containerRef.current.offsetHeight,
        },
      },
    });

    cy.resize();
    cy.fit();

    cy.nodes().grabify();

    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      const { id, label, walletType, activity } = node.data();
      node.popper({
        content: () => {
          const div = document.createElement('div');
          div.className = 'cy-tooltip';
          div.innerHTML = `
            <div class="tooltip-content">
              <h3>${id}</h3>
              <p><strong>Type:</strong> ${walletType || 'Unknown'}</p>
              <p><strong>Activity Score:</strong> ${Math.round(activity || 0)}</p>
              <p><strong>Connected Wallets:</strong> ${node.neighborhood().nodes().length}</p>
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
        if (tooltip && tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
        node.popper().destroy();
      }
    });

    let animationFrameId;
    const animateNetwork = () => {
      cy.nodes().forEach((node) => {
        const activity = node.data('activity') || 50;
        const pulseScale = 1 + Math.sin(Date.now() / 1000 * (activity / 50)) * 0.05;

        node.style('width', node.data('size') * pulseScale);
        node.style('height', node.data('size') * pulseScale);

        if (activity > 70) {
          const xOffset = (Math.random() - 0.5) * 0.3;
          const yOffset = (Math.random() - 0.5) * 0.3;
          node.position({
            x: node.position('x') + xOffset,
            y: node.position('y') + yOffset,
          });
        }
      });

      cy.edges('[animated]').forEach((edge) => {
        const currentOpacity = parseFloat(edge.style('opacity')) || 0.5;
        const newOpacity = currentOpacity + Math.sin(Date.now() / 500) * 0.1;
        edge.style('opacity', Math.max(0.3, Math.min(0.9, newOpacity)));
      });

      animationFrameId = requestAnimationFrame(animateNetwork);
    };

    animateNetwork();

    return () => {
      cancelAnimationFrame(animationFrameId);
      cy.destroy();
    };
  }, []);

  return (
    <div className="homepage">
      {/* Hero Section with Cytoscape Network */}
      <section className="hero-section">
        <div ref={heroNetworkRef} className="hero-network" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            Solana Forensic Analysis Tool
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Uncover insights, track transactions, and analyze wallets on the Solana blockchain with cutting-edge forensic tools.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Discover Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Transaction Flow</h3>
            <p>Visualize the flow of transactions across the Solana network with detailed insights.</p>
            <a href="/transaction-flow" className="cta-button">
              Learn More
            </a>
          </div>
          <div className="feature-card">
            <h3>Transaction Clusters</h3>
            <p>Group related transactions and identify patterns of activity.</p>
            <a href="/transaction-clusters" className="cta-button">
              Learn More
            </a>
          </div>
          <div className="feature-card">
            <h3>Entity Labels</h3>
            <p>Label wallets and entities (e.g., exchanges, DeFi projects) with confidence scores.</p>
            <a href="/entity-labels" className="cta-button">
              Learn More
            </a>
          </div>
          <div className="feature-card">
            <h3>Wallet Analysis</h3>
            <p>Analyze wallet behavior, risk profiles, and AML compliance.</p>
            <a href="/wallet-analysis" className="cta-button">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Network Visualization Section */}
      <section className="network-section">
        <h2>Solana Network Insights</h2>
        <p>Explore the interconnected world of Solana transactions with our interactive visualization. See how wallets, exchanges, and DeFi protocols interact in real-time.</p>
        <div ref={containerRef} className="network-graph" />
        <div className="network-legend">
          <div className="legend-item">
            <div className="legend-color legend-exchange"></div>
            <span>Exchange</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-defi"></div>
            <span>DeFi</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-validator"></div>
            <span>Validator</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-contract"></div>
            <span>Contract</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-user"></div>
            <span>User</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-unknown"></div>
            <span>Unknown</span>
          </div>
          <div className="legend-item">
            <div className="legend-color legend-unusual"></div>
            <span>Unusual Transaction</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Solana Forensic Analysis Tool</h3>
            <p>Empowering blockchain forensics with advanced analytics.</p>
          </div>
          <div className="footer-links">
            <h4>Connect With Us</h4>
            <ul>
              <li><a href="https://github.com/apostleoffinance/Solana-Forensic-Analysis-Tool" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .homepage {
          min-height: 100vh;
          background-color: var(--background);
          color: var(--text-primary);
          position: relative;
          overflow-x: hidden;
        }
        /* Hero Section */
        .hero-section {
          position: relative;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          overflow: hidden;
        }
        .hero-network {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
        }
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(26, 32, 44, 0.7) 0%, rgba(26, 32, 44, 0.9) 70%, rgba(26, 32, 44, 0.95) 100%);
          z-index: 2;
        }
        .hero-content {
          z-index: 3;
          padding: 2rem;
          position: relative;
        }
        .hero-content::before {
          content: '';
          position: absolute;
          top: -100%;
          left: -100%;
          width: 300%;
          height: 300%;
          background: linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(132, 204, 22, 0.1), rgba(225, 29, 72, 0.1));
          animation: rotate 20s linear infinite;
          z-index: -1;
          pointer-events: none;
        }
        @keyframes rotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .hero-content h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-content p {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto 2rem;
        }
        .hero-content a {
        color: var(--accent-green);
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
          padding: 1rem 2rem;
          border-radius: 25px;
          color: var(--text-primary);
          font-size: 1.1rem;
          font-weight: 600;
          text-decoration: none;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
        }
        .cta-button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
        }
        /* Features Section */
        .features-section {
          padding: 4rem 2rem;
          background-color: rgba(45, 55, 72, 0.5);
          position: relative;
          z-index: 1;
        }
        .features-section h2 {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          margin-bottom: 2rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .feature-card {
          background-color: var(--card-bg);
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          text-align: center;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
        }
        .feature-card h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        .feature-card p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }
        /* Network Visualization Section */
        .network-section {
          padding: 6rem 2rem;
          text-align: center;
          background: linear-gradient(to bottom, var(--background), #1a1f2e);
          position: relative;
          z-index: 2;
        }
        .network-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, rgba(132, 204, 22, 0.05) 50%, rgba(26, 32, 44, 0.02) 100%);
          z-index: 1;
          pointer-events: none;
        }
        .network-section h2 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          position: relative;
          z-index: 2;
        }
        .network-section p {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 3rem;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 2;
        }
        .network-graph {
          width: 100%;
          height: 500px;
          background-color: rgba(26, 32, 44, 0.4);
          border-radius: 16px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          margin: 0 auto;
          max-width: 1000px;
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.15);
          position: relative;
          z-index: 2;
        }
        .network-graph::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 16px;
          box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.1);
          pointer-events: none;
          z-index: 3;
        }
        .network-legend {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 15px;
          margin-top: 20px;
          max-width: 800px;
          margin-left: auto;
          margin-right: auto;
          position: relative;
          z-index: 2;
        }
        .legend-item {
          display: flex;
          align-items: center;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .legend-exchange {
          background-color: #FFD700;
        }
        .legend-defi {
          background-color: #84CC16;
        }
        .legend-validator {
          background-color: #9333EA;
        }
        .legend-contract {
          background-color: #F97316;
        }
        .legend-user {
          background-color: #3B82F6;
        }
        .legend-unknown {
          background-color: #A1A1AA;
        }
        .legend-unusual {
          background-color: #E11D48;
        }
        /* Footer */
        .footer {
          background: linear-gradient(90deg, var(--background), #2d3748);
          padding: 3rem 2rem;
          color: var(--text-secondary);
        }
        .footer-content {
          display: flex;
          flex-wrap: wrap;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }
        .footer-brand h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        .footer-brand p {
          font-size: 0.9rem;
        }
        .footer-links h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        .footer-links ul {
          list-style: none;
          padding: 0;
        }
        .footer-links li {
          margin-bottom: 0.5rem;
        }
        .footer-links a {
          color: var(--text-secondary);
          font-size: 0.9rem;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-links a:hover {
          color: var(--accent-blue);
        }
        @media (max-width: 768px) {
          .hero-content h1 {
            font-size: 2rem;
          }
          .hero-content p {
            font-size: 1rem;
          }
          .cta-button {
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
          }
          .features-section h2,
          .network-section h2 {
            font-size: 1.5rem;
          }
          .feature-card {
            padding: 1.5rem;
          }
          .footer-content {
            flex-direction: column;
            text-align: center;
          }
          .network-graph {
            height: 350px;
          }
        }
      `}</style>
      <style jsx global>{`
        .cy-tooltip {
          background-color: rgba(26, 32, 44, 0.95);
          color: var(--text-primary);
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          z-index: 10000;
          max-width: 220px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }
        .cy-tooltip .tooltip-content h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--accent-blue);
          border-bottom: 1px solid rgba(59, 130, 246, 0.3);
          padding-bottom: 4px;
        }
        .cy-tooltip .tooltip-content p {
          margin: 6px 0;
          line-height: 1.5;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}

// Helper function to generate a sample network for the homepage visualization
function generateSampleNetwork() {
  const elements = [];
  const nodeCount = 30;
  const walletTypes = ['Exchange', 'DeFi', 'Unknown', 'User', 'Contract', 'Validator'];
  const currencies = ['SOL', 'USDC', 'RAY', 'SRM', 'BONK'];

  for (let i = 0; i < nodeCount; i++) {
    const type = walletTypes[Math.floor(Math.random() * walletTypes.length)];
    elements.push({
      data: {
        id: `Wallet${i}`,
        label: `Wallet${i}\n${type}`,
        type: 'wallet',
        walletType: type.toLowerCase(),
        size: 5 + Math.random() * 15,
        activity: Math.random() * 100,
      },
    });
  }

  const edgeCount = nodeCount * 1.5;
  for (let i = 0; i < edgeCount; i++) {
    const source = Math.floor(Math.random() * nodeCount);
    let target = Math.floor(Math.random() * nodeCount);

    while (target === source) {
      target = Math.floor(Math.random() * nodeCount);
    }

    const amount = Math.floor(Math.random() * 20) + 1;
    const currency = currencies[Math.floor(Math.random() * currencies.length)];
    const unusual = Math.random() > 0.85;

    elements.push({
      data: {
        id: `e${i}`,
        source: `Wallet${source}`,
        target: `Wallet${target}`,
        label: `${unusual ? '⚠️ ' : ''}${amount} ${currency}`,
        unusual: unusual,
        weight: amount,
        animated: Math.random() > 0.7,
      },
    });
  }

  return elements;
}

// Helper function to generate hero network
function generateHeroNetwork(nodeCount = 60, edgeCount = 90) {
  const elements = [];

  for (let i = 0; i < nodeCount; i++) {
    elements.push({
      data: {
        id: `n${i}`,
        type: 'background',
      },
      position: {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      },
    });
  }

  for (let i = 0; i < edgeCount; i++) {
    const source = Math.floor(Math.random() * nodeCount);
    let target = Math.floor(Math.random() * nodeCount);

    while (target === source) {
      target = Math.floor(Math.random() * nodeCount);
    }

    elements.push({
      data: {
        id: `e${i}`,
        source: `n${source}`,
        target: `n${target}`,
      },
    });
  }

  return elements;
}