'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Function to create a canvas texture for the sprite
const createSpriteTexture = (text) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 128;
  context.fillStyle = 'rgba(0, 0, 0, 0.7)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '24px Arial';
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.fillText(text?.substring(0, 10) + '...' || 'Unknown...', canvas.width / 2, canvas.height / 2);
  return canvas;
};

// TransactionFlow Component
const TransactionFlow = ({ tx_graph }) => {
  const [selectedNode, setSelectedNode] = useState(null);
  const [addressFilter, setAddressFilter] = useState(''); // Filter by address or label
  const [amountFilter, setAmountFilter] = useState(0); // Filter by minimum transaction amount

  if (!tx_graph || !tx_graph.nodes || !tx_graph.edges) {
    return <div>Invalid transaction graph data</div>;
  }

  // Determine if there is something to filter
  const hasFilter = addressFilter.trim() !== '' || amountFilter > 0;

  // Calculate hacker address (same logic as in Graph component)
  const addressVolume = useMemo(() => {
    const volumeMap = new Map();
    tx_graph.edges.forEach(edge => {
      const value = Number(edge.value) || 0;
      volumeMap.set(edge.from, (volumeMap.get(edge.from) || 0) + value);
      volumeMap.set(edge.to, (volumeMap.get(edge.to) || 0) + value);
    });
    return volumeMap;
  }, [tx_graph.edges]);

  const hackerAddress = useMemo(() => {
    let max = 0;
    let hacker = tx_graph.edges.length > 0 ? tx_graph.edges[0]?.to : null;
    addressVolume.forEach((volume, address) => {
      if (volume > max) {
        max = volume;
        hacker = address;
      }
    });
    return hacker;
  }, [addressVolume, tx_graph.edges]);

  // Create filtered lists
  let filteredNodeList = tx_graph.nodes;
  let filteredEdgeList = tx_graph.edges;

  if (hasFilter) {
    const filteredAddresses = new Set();
    const filteredEdges = new Set();

    // Step 1: Address Filter - Find nodes that match the address or label
    if (addressFilter.trim() !== '') {
      const searchText = addressFilter.toLowerCase();
      const matchingNodes = Object.entries(tx_graph.nodes).filter(([address, node]) =>
        address.toLowerCase().includes(searchText) || node.label.toLowerCase().includes(searchText)
      );

      console.log('Matching nodes:', matchingNodes.map(([address]) => address));

      // Add matching nodes to filteredAddresses
      matchingNodes.forEach(([address]) => {
        filteredAddresses.add(address);
      });

      // Include all edges connected to these nodes
      tx_graph.edges.forEach(edge => {
        if (filteredAddresses.has(edge.from) || filteredAddresses.has(edge.to)) {
          filteredEdges.add(JSON.stringify(edge));
          filteredAddresses.add(edge.from);
          filteredAddresses.add(edge.to);
        }
      });
    }

    // Step 2: Amount Filter - Include edges that match the amount filter
    if (amountFilter > 0) {
      tx_graph.edges.forEach(edge => {
        const value = Number(edge.value) || 0;
        if (value >= amountFilter) {
          filteredEdges.add(JSON.stringify(edge));
          filteredAddresses.add(edge.from);
          filteredAddresses.add(edge.to);
        }
      });
    }

    // If no matches found, show nothing
    if (filteredAddresses.size === 0 && filteredEdges.size === 0) {
      filteredNodeList = {};
      filteredEdgeList = [];
    } else {
      // Create filtered node list
      filteredNodeList = Object.fromEntries(
        [...filteredAddresses]
          .filter(address => tx_graph.nodes[address])
          .map(address => [address, tx_graph.nodes[address]])
      );

      // Convert filteredEdges back to array of edge objects
      filteredEdgeList = [...filteredEdges].map(edge => JSON.parse(edge));
    }

    console.log('Filtered nodes:', [...filteredAddresses]);
    console.log('Filtered edges:', filteredEdgeList);
  }

  // Create the filtered graph to pass to the Graph component
  const filteredGraph = {
    nodes: filteredNodeList,
    edges: filteredEdgeList,
  };

  return (
    <div style={{ width: '100%', height: '750px', position: 'relative', backgroundColor: '#1A202C' }}>
      {/* Filter Inputs */}
      <div className="filters">
        <div className="filter-item">
          <label className="filter-label">Filter by Address/Label</label>
          <input
            type="text"
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            placeholder="Search address or label..."
            className="filter-input"
          />
        </div>
        <div className="filter-item">
          <label className="filter-label">Min Transaction Amount (USD)</label>
          <input
            type="number"
            min="0"
            value={amountFilter}
            onChange={(e) => setAmountFilter(Number(e.target.value))}
            className="filter-input"
          />
        </div>
      </div>

      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} />
        <Graph tx_graph={filteredGraph} setSelectedNode={setSelectedNode} hackerAddress={hackerAddress} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={50} />
      </Canvas>

      {selectedNode && (
        <div className="info-card">
          <div
            className="info-card-header"
            style={{
              background: selectedNode.id === hackerAddress ? '#E11D48' : '#3B82F6', // Red for hacker, blue for others
            }}
          >
            <h3>
              {selectedNode.label !== 'Unknown' ? selectedNode.label : 'Address'}
            </h3>
            <button onClick={() => setSelectedNode(null)}>×</button>
          </div>
          <div className="info-card-content">
            <p><strong>Address:</strong> {selectedNode.id}</p>
            <p><strong>Label:</strong> {selectedNode.label}</p>
            <p><strong>USD Received:</strong> ${selectedNode.amount_usd_received.toFixed(2)}</p>
            <p><strong>USD Sent:</strong> ${selectedNode.amount_usd_sent.toFixed(2)}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .filters {
          display: flex;
          gap: 1rem;
          padding: 10px;
          background: rgba(26, 32, 44, 0.8);
          border-bottom: 1px solid #2D3748;
        }
        .filter-item {
          flex: 1;
        }
        .filter-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #A1A1AA;
          margin-bottom: 0.25rem;
        }
        .filter-input {
          width: 100%;
          padding: 0.5rem;
          border-radius: 6px;
          background: #2D3748;
          color: #E2E8F0;
          border: 1px solid #4A5568;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }
        .filter-input:hover,
        .filter-input:focus {
          border-color: #3B82F6;
          outline: none;
        }
        .info-card {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 300px;
          background: rgba(26, 32, 44, 0.95);
          color: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          z-index: 9999;
        }
        .info-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
        }
        .info-card-header h3 {
          margin: 0;
          font-size: 16px;
        }
        .info-card-header button {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        }
        .info-card-content {
          padding: 15px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

// Graph Component to Render Nodes, Edges, and Labels
const Graph = ({ tx_graph, setSelectedNode, hackerAddress }) => {
  const groupRef = useRef();

  // Ensure nodes and edges are always defined, even if empty
  const nodes = useMemo(() => (tx_graph.nodes ? Object.values(tx_graph.nodes) : []), [tx_graph.nodes]);
  const edges = useMemo(() => tx_graph.edges || [], [tx_graph.edges]);

  // Calculate address volume for visualization
  const addressVolume = useMemo(() => {
    const volumeMap = new Map();
    edges.forEach(edge => {
      const value = Number(edge.value) || 0;
      volumeMap.set(edge.from, (volumeMap.get(edge.from) || 0) + value);
      volumeMap.set(edge.to, (volumeMap.get(edge.to) || 0) + value);
    });
    return volumeMap;
  }, [edges]);

  const maxVolume = useMemo(() => {
    let max = 0;
    addressVolume.forEach(volume => {
      if (volume > max) max = volume;
    });
    return max;
  }, [addressVolume]);

  // Include all nodes except the hacker address for positioning on the sphere
  const addresses = useMemo(() => {
    const addressSet = new Set(Object.keys(tx_graph.nodes));
    if (hackerAddress) addressSet.delete(hackerAddress);
    return [...addressSet];
  }, [tx_graph.nodes, hackerAddress]);

  // Position nodes on a sphere
  const nodePositions = useMemo(() => {
    const radius = 6;
    const posArray = [];
    for (let i = 0; i < addresses.length; i++) {
      const phi = Math.acos(-1 + (2 * i) / Math.max(addresses.length, 1));
      const theta = Math.sqrt(Math.max(addresses.length, 1) * Math.PI) * phi;
      posArray.push(
        new THREE.Vector3(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        )
      );
    };
    return posArray;
  }, [addresses]);

  // Animate the central node
  useFrame(() => {
    if (groupRef.current && groupRef.current.children.length > 0) {
      const time = Date.now() * 0.002;
      if (groupRef.current.children[0]?.scale) {
        groupRef.current.children[0].scale.setScalar(1 + Math.sin(time) * 0.1);
      }
    }
  });

  return (
    <group ref={groupRef}>
      {/* Hacker Node */}
      {hackerAddress && tx_graph.nodes[hackerAddress] && (
        <>
          <Sphere
            args={[0.8, 32, 32]}
            position={[0, 0, 0]}
            onClick={() => {
              const nodeData = tx_graph.nodes[hackerAddress];
              // If label is "Unknown Address", change it to "Hacker"
              const updatedLabel =
                nodeData.label === 'Unknown Address' ? 'Hacker' : nodeData.label;
              setSelectedNode({ ...nodeData, id: hackerAddress, label: updatedLabel });
            }}
          >
            <meshPhongMaterial color="#E11D48" emissive="#E11D48" emissiveIntensity={0.5} shininess={100} />
          </Sphere>
          {/* Hacker Label */}
          <sprite position={[0, 1.2, 0]} scale={[1.8, 0.9, 1]}>
            <spriteMaterial attach="material">
              <canvasTexture
                attach="map"
                image={createSpriteTexture(
                  tx_graph.nodes[hackerAddress].label === 'Unknown Address'
                    ? 'Hacker'
                    : tx_graph.nodes[hackerAddress].label
                )}
              />
            </spriteMaterial>
          </sprite>
        </>
      )}

      {/* Address Nodes and Labels */}
      {addresses.map((address, index) => {
        const nodeData = tx_graph.nodes[address];
        const position = nodePositions[index];
        if (!nodeData || !position) return null;

        const volume = addressVolume.get(address) || 0;
        const isHighVolume = maxVolume > 0 && volume > maxVolume * 0.5;
        const labelText = nodeData.label === 'Unknown Address' ? address : nodeData.label;
        const labelPosition = position.clone().multiplyScalar(1.2); // Offset the label slightly

        return (
          <group key={address}>
            <Sphere
              args={[0.1, 16, 16]}
              position={position}
              onClick={() => setSelectedNode({ ...nodeData, id: address })}
            >
              <meshBasicMaterial color={isHighVolume ? '#FF9500' : '#84CC16'} />
            </Sphere>
            <sprite position={labelPosition} scale={[1.5, 0.75, 1]}>
              <spriteMaterial attach="material">
                <canvasTexture attach="map" image={createSpriteTexture(labelText)} />
              </spriteMaterial>
            </sprite>
          </group>
        );
      })}

      {/* Edges */}
      {edges.map((edge, index) => {
        const fromIndex = edge.from === hackerAddress ? -1 : addresses.indexOf(edge.from);
        const toIndex = edge.to === hackerAddress ? -1 : addresses.indexOf(edge.to);

        const fromPos = fromIndex === -1 ? new THREE.Vector3(0, 0, 0) : nodePositions[fromIndex];
        const toPos = toIndex === -1 ? new THREE.Vector3(0, 0, 0) : nodePositions[toIndex];
        if (!fromPos || !toPos) return null;

        const points = [fromPos, toPos];
        const value = Number(edge.value) || 0;
        const isHighValue = maxVolume > 0 && value > maxVolume * 0.5;
        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return (
          <line key={`edge-${index}`}>
            <bufferGeometry attach="geometry" {...geometry} />
            <lineBasicMaterial
              color={isHighValue ? '#FF9500' : '#84CC16'}
              transparent
              opacity={isHighValue ? 0.6 : 0.4}
              linewidth={isHighValue ? 2 : 1}
            />
          </line>
        );
      })}
    </group>
  );
};

export default TransactionFlow;