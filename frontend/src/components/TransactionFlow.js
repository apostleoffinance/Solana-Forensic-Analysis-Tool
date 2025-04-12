'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';

const TransactionFlow = ({ 
  transactions, 
  width = '1000px',
  height = '1000px',
  className = ''
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const transactionSystemRef = useRef(null);
  const hackerNodeRef = useRef(null);
  const addressNodesRef = useRef({});
  const transactionLinesRef = useRef([]);
  const tooltipRef = useRef(null);
  const infoCardRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !transactions) return;

    // Scene Setup
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.z = 8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Tooltip and Info Card Setup
    const tooltip = document.createElement('div');
    tooltip.className = 'address-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    tooltipRef.current = tooltip;

    const infoCard = document.createElement('div');
    infoCard.className = 'address-info-card';
    infoCard.style.display = 'none';
    container.appendChild(infoCard);
    infoCardRef.current = infoCard;

    // Transaction System Setup
    const transactionSystem = new THREE.Group();
    transactionSystemRef.current = transactionSystem;
    scene.add(transactionSystem);

    // Find Hacker Address
    let hackerAddress = null;
    const hackerTx = transactions.find(tx => tx.entity === 'Hacker');
    if (hackerTx) {
      hackerAddress = hackerTx.target;
    } else {
      const criticalAddresses = new Map();
      transactions.filter(tx => tx.critical).forEach(tx => {
        criticalAddresses.set(tx.source, (criticalAddresses.get(tx.source) || 0) + 1);
        criticalAddresses.set(tx.target, (criticalAddresses.get(tx.target) || 0) + 1);
      });
      let maxCount = 0;
      criticalAddresses.forEach((count, address) => {
        if (count > maxCount) {
          maxCount = count;
          hackerAddress = address;
        }
      });
    }
    if (!hackerAddress && transactions.some(tx => tx.critical)) {
      hackerAddress = transactions.find(tx => tx.critical).target;
    }
    if (!hackerAddress && transactions.length > 0) {
      hackerAddress = transactions[0].target;
    }

    const addresses = new Set();
    transactions.forEach(tx => {
      addresses.add(tx.source);
      addresses.add(tx.target);
    });
    if (hackerAddress) addresses.delete(hackerAddress);
    const addressList = [...addresses];

    // Hacker Node (Sphere)
    const hackerGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const hackerMaterial = new THREE.MeshPhongMaterial({
      color: 0xE11D48,
      emissive: 0xE11D48,
      emissiveIntensity: 0.5,
      shininess: 100,
    });
    const hackerNode = new THREE.Mesh(hackerGeometry, hackerMaterial);
    hackerNode.userData = { 
      address: hackerAddress, 
      isHacker: true,
      entity: 'Hacker',
      transactions: transactions.filter(tx => tx.source === hackerAddress || tx.target === hackerAddress)
    };
    hackerNodeRef.current = hackerNode;
    transactionSystem.add(hackerNode);

    const createTextSprite = (text, position, color = 0xffffff, scale = 0.5) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 128;
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.font = '24px Arial';
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.fillText(text.substring(0, 10) + '...', canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(position.x, position.y + 1.2, position.z);
      sprite.scale.set(scale * 3, scale * 1.5, scale);
      return sprite;
    };

    if (hackerAddress) {
      const hackerLabel = createTextSprite(hackerAddress, new THREE.Vector3(0, 0, 0), 0xE11D48, 0.6);
      transactionSystem.add(hackerLabel);
    }

    // Address Nodes (Points)
    const addressNodes = {};
    addressNodesRef.current = addressNodes;

    addressList.forEach((address, index) => {
      const angleStep = (Math.PI * 2) / Math.min(addressList.length, 12);
      const angle = angleStep * (index % 12);
      const layer = Math.floor(index / 12);
      const radius = 3 + layer * 1.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (layer * 0.5) - 1;
      const isCritical = transactions.some(tx => (tx.source === address || tx.target === address) && tx.critical);
      const entityTx = transactions.find(tx => (tx.source === address || tx.target === address) && tx.entity);
      const entity = entityTx ? entityTx.entity : 'Unknown';

      const nodeGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array([x, y, z]);
      nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const nodeMaterial = new THREE.PointsMaterial({
        color: isCritical ? 0xFF9500 : 0x84CC16,
        size: 0.2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });

      const node = new THREE.Points(nodeGeometry, nodeMaterial);
      node.userData = { 
        address, 
        isCritical,
        entity,
        transactions: transactions.filter(tx => tx.source === address || tx.target === address)
      };
      transactionSystem.add(node);

      const label = createTextSprite(address, new THREE.Vector3(x, y, z), isCritical ? 0xFF9500 : 0x84CC16);
      transactionSystem.add(label);

      addressNodes[address] = { 
        node, 
        label, 
        position: new THREE.Vector3(x, y, z), 
        connections: [],
        material: nodeMaterial
      };
    });

    // Transaction Lines
    const transactionLines = [];
    transactionLinesRef.current = transactionLines;
    transactions.forEach(tx => {
      const createConnection = (sourcePos, targetPos, critical) => {
        const points = [sourcePos, targetPos];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: critical ? 0xFF9500 : 0x84CC16,
          transparent: true,
          opacity: 0.6,
          linewidth: critical ? 2 : 1
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        line.userData = { transaction: tx };
        transactionSystem.add(line);
        transactionLines.push(line);
        return line;
      };

      const source = tx.source;
      const target = tx.target;
      if (source === hackerAddress && addressNodes[target]) {
        const connection = createConnection(new THREE.Vector3(0, 0, 0), addressNodes[target].position, tx.critical);
        addressNodes[target].connections.push(connection);
      } else if (target === hackerAddress && addressNodes[source]) {
        const connection = createConnection(addressNodes[source].position, new THREE.Vector3(0, 0, 0), tx.critical);
        addressNodes[source].connections.push(connection);
      } else if (addressNodes[source] && addressNodes[target]) {
        const connection = createConnection(addressNodes[source].position, addressNodes[target].position, tx.critical);
        addressNodes[source].connections.push(connection);
        addressNodes[target].connections.push(connection);
      }
    });

    // Orbital Rings
    const createOrbitalRing = (radius, color, opacity) => {
      const ringGeometry = new THREE.TorusGeometry(radius, 0.05, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 3;
      transactionSystem.add(ring);
      return ring;
    };
    const orbitalRings = [
      createOrbitalRing(3, 0x84CC16, 0.3),
      createOrbitalRing(4.5, 0x84CC16, 0.2),
      createOrbitalRing(6, 0x84CC16, 0.1),
    ];

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Animation
    let time = 0;
    let isSpinning = true; // Flag to control spinning

    const animate = () => {
      time += 0.01;

      // Spin only if not hovering
      if (isSpinning) {
        transactionSystem.rotation.y += 0.005; // Match speed from HTML example
      }

      if (hackerNodeRef.current) {
        hackerNodeRef.current.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
      }
      orbitalRings.forEach((ring, i) => {
        ring.rotation.z += 0.005 * (i + 1);
        ring.rotation.x = Math.PI / 3 + Math.sin(time * 0.5) * 0.1;
      });
      renderer.render(scene, camera);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    gsap.from(transactionSystem.scale, { x: 0, y: 0, z: 0, duration: 2, ease: "elastic.out(1, 0.5)" });
    animate();

    // Mouse Interaction
    let mouseX = 0, mouseY = 0;
    let hoveredAddress = null;
    let selectedAddress = null;

    const onMouseMove = (event) => {
      const containerRect = container.getBoundingClientRect();
      if (
        event.clientX >= containerRect.left &&
        event.clientX <= containerRect.right &&
        event.clientY >= containerRect.top &&
        event.clientY <= containerRect.bottom
      ) {
        const relativeX = ((event.clientX - containerRect.left) / containerRect.width) * 2 - 1;
        const relativeY = -((event.clientY - containerRect.top) / containerRect.height) * 2 + 1;
        mouseX = relativeX;
        mouseY = relativeY;

        const raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = 0.1;
        const mouse = new THREE.Vector2(relativeX, relativeY);
        raycaster.setFromCamera(mouse, camera);

        const allNodes = [hackerNodeRef.current, ...Object.values(addressNodes).map(n => n.node)];
        const intersects = raycaster.intersectObjects(allNodes);

        if (intersects.length > 0) {
          const hoveredNode = intersects[0].object;
          const address = hoveredNode.userData.address;
          if (address !== hoveredAddress) {
            hoveredAddress = address;
            isSpinning = false; // Stop spinning on hover

            const entity = hoveredNode.userData.entity || 'Unknown';
            const isCritical = hoveredNode.userData.isCritical;
            const isHacker = hoveredNode.userData.isHacker;
            tooltipRef.current.innerHTML = `
              <div style="padding: 10px;">
                <strong>Address:</strong> ${address}<br>
                <strong>Type:</strong> ${isHacker ? 'Hacker' : (entity !== 'Unknown' ? entity : (isCritical ? 'Critical' : 'Normal'))}
              </div>
            `;
            tooltipRef.current.style.display = 'block';
            tooltipRef.current.style.left = `${event.clientX + 10}px`;
            tooltipRef.current.style.top = `${event.clientY + 10}px`;

            if (!isHacker) {
              const nodeData = addressNodes[address];
              gsap.to(nodeData.material, { size: 0.3, opacity: 1, duration: 0.3 });
            }

            transactionLines.forEach(line => {
              const tx = line.userData.transaction;
              if (tx.source === address || tx.target === address) {
                gsap.to(line.material, { opacity: 1, duration: 0.3 });
                line.material.color.set(tx.critical ? 0xFF9500 : 0x84CC16);
              } else {
                gsap.to(line.material, { opacity: 0.2, duration: 0.3 });
              }
            });
          }
        } else if (hoveredAddress) {
          const prevHoveredNode = addressNodes[hoveredAddress] || hackerNodeRef.current;
          if (prevHoveredNode && !prevHoveredNode.userData.isHacker) {
            gsap.to(prevHoveredNode.material, { size: 0.2, opacity: 0.8, duration: 0.3 });
          }
          hoveredAddress = null;
          isSpinning = true; // Resume spinning when hover ends
          tooltipRef.current.style.display = 'none';
          transactionLines.forEach(line => {
            gsap.to(line.material, { opacity: line.userData.transaction.critical ? 0.6 : 0.4, duration: 0.3 });
          });
        }
      } else if (hoveredAddress) {
        const prevHoveredNode = addressNodes[hoveredAddress] || hackerNodeRef.current;
        if (prevHoveredNode && !prevHoveredNode.userData.isHacker) {
          gsap.to(prevHoveredNode.material, { size: 0.2, opacity: 0.8, duration: 0.3 });
        }
        hoveredAddress = null;
        isSpinning = true; // Resume spinning when mouse leaves container
        tooltipRef.current.style.display = 'none';
      }
    };

    const onClick = (event) => {
      const containerRect = container.getBoundingClientRect();
      if (
        event.clientX >= containerRect.left &&
        event.clientX <= containerRect.right &&
        event.clientY >= containerRect.top &&
        event.clientY <= containerRect.bottom
      ) {
        const relativeX = ((event.clientX - containerRect.left) / containerRect.width) * 2 - 1;
        const relativeY = -((event.clientY - containerRect.top) / containerRect.height) * 2 + 1;
        const raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = 0.1;
        const mouse = new THREE.Vector2(relativeX, relativeY);
        raycaster.setFromCamera(mouse, camera);

        const allNodes = [hackerNodeRef.current, ...Object.values(addressNodes).map(n => n.node)];
        const intersects = raycaster.intersectObjects(allNodes);

        if (intersects.length > 0) {
          const clickedNode = intersects[0].object;
          const address = clickedNode.userData.address;
          selectedAddress = address;

          const entity = clickedNode.userData.entity || 'Unknown';
          const isCritical = clickedNode.userData.isCritical;
          const isHacker = clickedNode.userData.isHacker;
          const txs = clickedNode.userData.transactions || [];
          let transactionsHTML = '';
          txs.slice(0, 5).forEach(tx => {
            transactionsHTML += `
              <div class="transaction ${tx.critical ? 'critical' : ''}">
                <div>${tx.source.substring(0, 8)}... → ${tx.target.substring(0, 8)}...</div>
                <div>Amount: ${tx.amount} SOL</div>
                <div>Date: ${tx.date}</div>
              </div>
            `;
          });

          infoCardRef.current.innerHTML = `
            <div class="info-card-header ${isHacker ? 'hacker' : (isCritical ? 'critical' : '')}">
              <h3>${isHacker ? 'Hacker' : (entity !== 'Unknown' ? entity : 'Address')}</h3>
              <button class="close-btn">×</button>
            </div>
            <div class="info-card-content">
              <div class="address-details">
                <div><strong>Address:</strong> ${address}</div>
                <div><strong>Type:</strong> ${isHacker ? 'Hacker' : (entity !== 'Unknown' ? entity : (isCritical ? 'Critical' : 'Normal'))}</div>
                <div><strong>Transactions:</strong> ${txs.length}</div>
              </div>
              <div class="transactions-list">
                <h4>Recent Transactions</h4>
                ${transactionsHTML}
                ${txs.length > 5 ? `<div class="more-tx">+ ${txs.length - 5} more transactions</div>` : ''}
              </div>
            </div>
          `;
          infoCardRef.current.style.display = 'block';

          const closeBtn = infoCardRef.current.querySelector('.close-btn');
          closeBtn.addEventListener('click', () => {
            infoCardRef.current.style.display = 'none';
            selectedAddress = null;
            allNodes.forEach(node => {
              if (!node.userData.isHacker) {
                gsap.to(node.material, { size: 0.2, opacity: 0.8, duration: 0.3 });
              }
            });
          });

          if (!isHacker) {
            gsap.to(clickedNode.material, { size: 0.4, opacity: 1, duration: 0.3 });
          }
          allNodes.forEach(node => {
            if (node !== clickedNode && !node.userData.isHacker) {
              gsap.to(node.material, { size: 0.2, opacity: 0.8, duration: 0.3 });
            }
          });
        } else if (selectedAddress && infoCardRef.current) {
          const infoCardRect = infoCardRef.current.getBoundingClientRect();
          if (
            event.clientX < infoCardRect.left ||
            event.clientX > infoCardRect.right ||
            event.clientY < infoCardRect.top ||
            event.clientY > infoCardRect.bottom
          ) {
            infoCardRef.current.style.display = 'none';
            selectedAddress = null;
            allNodes.forEach(node => {
              if (!node.userData.isHacker) {
                gsap.to(node.material, { size: 0.2, opacity: 0.8, duration: 0.3 });
              }
            });
          }
        }
      }
    };

    const updateRotation = () => {
      gsap.to(transactionSystem.rotation, {
        x: mouseY * 0.2,
        y: mouseX * 0.5,
        duration: 2,
        ease: "power2.out",
      });
      requestAnimationFrame(updateRotation);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('click', onClick);
    updateRotation();

    // Resize Handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          const { width, height } = entry.contentRect;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId.current);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('click', onClick);
      resizeObserver.disconnect();

      if (tooltipRef.current) document.body.removeChild(tooltipRef.current);
      if (infoCardRef.current && containerRef.current) containerRef.current.removeChild(infoCardRef.current);
      if (rendererRef.current) {
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.traverse(object => {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) object.material.forEach(mat => mat.dispose());
            else object.material.dispose();
          }
        });
        sceneRef.current.clear();
      }
    };
  }, [transactions]);

  return (
    <div className={`solana-transaction-flow ${className}`} style={{ width, height, position: 'relative' }}>
      <div ref={containerRef} className="transaction-canvas w-full h-full" />
      <style jsx>{`
        .solana-transaction-flow {
          background-color: rgba(26, 32, 44, 0.8);
          border-radius: 8px;
          overflow: hidden;
        }
        .transaction-canvas {
          position: relative;
        }
      `}</style>
      <style jsx global>{`
        .address-tooltip {
          position: absolute;
          background-color: rgba(26, 32, 44, 0.9);
          color: white;
          padding: 5px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 10000;
          pointer-events: none;
          border: 1px solid #84cc16;
          max-width: 250px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .address-info-card {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 300px;
          background-color: rgba(26, 32, 44, 0.95);
          color: white;
          border-radius: 8px;
          overflow: hidden;
          z-index: 9999;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        }
        .info-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 15px;
          background-color: #3B82F6;
          color: white;
        }
        .info-card-header.hacker {
          background-color: #E11D48;
        }
        .info-card-header.critical {
          background-color: #FF9500;
        }
        .info-card-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .close-btn:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
        .info-card-content {
          padding: 15px;
        }
        .address-details {
          margin-bottom: 15px;
          line-height: 1.6;
        }
        .transactions-list h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #A1A1AA;
        }
        .transaction {
          padding: 8px;
          border-radius: 4px;
          background-color: rgba(255, 255, 255, 0.05);
          margin-bottom: 8px;
          font-size: 12px;
          line-height: 1.4;
        }
        .transaction.critical {
          border-left: 3px solid #FF9500;
        }
        .more-tx {
          text-align: center;
          color: #A1A1AA;
          font-size: 12px;
          padding: 5px;
        }
      `}</style>
    </div>
  );
};

export default TransactionFlow;