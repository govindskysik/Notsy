import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CodeBracketIcon, DocumentTextIcon, LightBulbIcon, Squares2X2Icon, BookOpenIcon } from '@heroicons/react/24/outline';
import { goTo, writePageCache } from '../../utils/navigation';

const nodeTypes = {
  notebook: { label: 'Notebook', className: 'knowledge-node-orange', icon: Squares2X2Icon },
  topic: { label: 'Topic', className: 'knowledge-node-cool', icon: CodeBracketIcon },
  resource: { label: 'Resource', className: 'knowledge-node-gold', icon: DocumentTextIcon },
};

const KnowledgeMap = ({ notebooks = [], topics = [], resources = [], compact = false, fullPage = false }) => {
  const [view, setView] = useState('concepts');
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [nodePositions, setNodePositions] = useState({});
  const visualRef = useRef(null);
  const dragRef = useRef(null);
  const didDragRef = useRef(false);

  const mapNodes = useMemo(() => {
    const notebookList = (notebooks || []).slice(0, 8);
    const topicList = topics || [];
    const resourceList = resources || [];
    const nodes = [];
    const clamp = (value) => Math.min(93, Math.max(7, value));
    const pointAt = (x, y, angle, radius) => ({ x: clamp(x + Math.cos(angle) * radius), y: clamp(y + Math.sin(angle) * radius) });
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const notebookRadius = (index) => index === 0 ? 0 : Math.min(15, 5 + Math.sqrt(index) * 5.5);

    notebookList.forEach((notebook, notebookIndex) => {
      const notebookAngle = -Math.PI / 2 + notebookIndex * goldenAngle;
      const notebookPoint = pointAt(50, 50, notebookAngle, notebookRadius(notebookIndex));
      nodes.push({ ...notebook, mapType: 'notebook', depth: 0, clusterId: notebook._id, label: notebook.name, target: `/dashboard/notebook/${notebook._id}`, ...notebookPoint });

      const childTopics = topicList.filter((topic) => String(topic.folderId?._id || topic.folderId) === String(notebook._id)).slice(0, 8);
      childTopics.forEach((topic, topicIndex) => {
        const topicAngle = notebookAngle + topicIndex * goldenAngle + (notebookIndex % 2 ? .45 : 0);
        const topicRadius = 17 + (topicIndex % 3) * 6 + Math.min(8, notebookIndex * 1.5);
        const topicPoint = pointAt(notebookPoint.x, notebookPoint.y, topicAngle, topicRadius);
        nodes.push({ ...topic, mapType: 'topic', depth: 1, clusterId: notebook._id, parentId: notebook._id, label: topic.title, target: `/dashboard/topic/${topic._id}`, ...topicPoint });

        const childResources = resourceList.filter((resource) => String(resource.topicId?._id || resource.topicId) === String(topic._id)).slice(0, 5);
        childResources.forEach((resource, resourceIndex) => {
          const resourceAngle = topicAngle + .5 + resourceIndex * goldenAngle;
          const resourcePoint = pointAt(topicPoint.x, topicPoint.y, resourceAngle, 9 + (resourceIndex % 3) * 4);
          nodes.push({ ...resource, mapType: 'resource', depth: 2, clusterId: notebook._id, parentId: topic._id, label: resource.title || 'Resource', target: `/dashboard/resource/${resource._id}`, ...resourcePoint });
        });
      });
    });
    // A deterministic mini force simulation gives the map a constellation feel without
    // changing position every time the component renders.
    const graphNodes = nodes.slice(0, 70).map((node, index) => {
      const seed = [...String(node._id)].reduce((total, character) => total + character.charCodeAt(0), index * 19 + 7);
      const angle = (seed % 360) * (Math.PI / 180);
      const radius = node.depth === 0 ? (index === 0 ? 0 : 8 + (index % 3) * 3) : 18 + (seed % 24);
      return { ...node, x: clamp(50 + Math.cos(angle) * radius), y: clamp(50 + Math.sin(angle) * radius) };
    });

    for (let iteration = 0; iteration < 110; iteration += 1) {
      const force = graphNodes.map(() => ({ x: 0, y: 0 }));
      graphNodes.forEach((node, index) => {
        if (node.parentId) {
          const parentIndex = graphNodes.findIndex((candidate) => String(candidate._id) === String(node.parentId));
          if (parentIndex >= 0) {
            const parent = graphNodes[parentIndex];
            const deltaX = parent.x - node.x;
            const deltaY = parent.y - node.y;
            const distance = Math.max(1, Math.hypot(deltaX, deltaY));
            const idealDistance = node.depth === 1 ? 24 : 13;
            const pull = (distance - idealDistance) * .018;
            force[index].x += (deltaX / distance) * pull;
            force[index].y += (deltaY / distance) * pull;
            force[parentIndex].x -= (deltaX / distance) * pull * .28;
            force[parentIndex].y -= (deltaY / distance) * pull * .28;
          }
        } else {
          force[index].x += (50 - node.x) * .012;
          force[index].y += (50 - node.y) * .012;
        }
      });
      for (let first = 0; first < graphNodes.length; first += 1) {
        for (let second = first + 1; second < graphNodes.length; second += 1) {
          const deltaX = graphNodes[first].x - graphNodes[second].x;
          const deltaY = graphNodes[first].y - graphNodes[second].y;
          const distance = Math.max(1.5, Math.hypot(deltaX, deltaY));
          const repel = Math.min(.75, 7 / (distance * distance));
          force[first].x += (deltaX / distance) * repel;
          force[first].y += (deltaY / distance) * repel;
          force[second].x -= (deltaX / distance) * repel;
          force[second].y -= (deltaY / distance) * repel;
        }
      }
      graphNodes.forEach((node, index) => {
        node.x = clamp(node.x + force[index].x);
        node.y = clamp(node.y + force[index].y);
      });
    }

    const densityScale = Math.max(.28, 1 - Math.max(0, graphNodes.length - 6) * .026);
    return graphNodes.map((node) => ({ ...node, scale: Math.max(.25, densityScale * (node.depth === 0 ? 1 : node.depth === 1 ? .68 : .46)) }));
  }, [notebooks, topics, resources]);

  useEffect(() => {
    setNodePositions((previous) => Object.fromEntries(mapNodes.map((node) => [node._id, previous[node._id] || { x: node.x, y: node.y }])));
  }, [mapNodes]);

  const positionedNodes = mapNodes.map((node) => ({ ...node, ...(nodePositions[node._id] || {}) }));
  const visibleNodes = positionedNodes.filter((node) => {
    if (view === 'notebooks') return node.depth === 0;
    if (view === 'topics') return node.depth <= 1;
    return true;
  });

  const pathFor = (node) => {
    const parent = positionedNodes.find((candidate) => String(candidate._id) === String(node.parentId));
    if (!parent) return '';
    return `M ${parent.x} ${parent.y} L ${node.x} ${node.y}`;
  };

  const handleNodeClick = (node) => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    setSelected(node._id);
    setSelectedCluster(node.clusterId);
    if (!fullPage && node.target) {
      if (node.mapType === 'resource') writePageCache(`notsy-resource:${node._id}`, node);
      goTo(node.target);
    }
  };

  const openNode = (node) => {
    if (!node.target) return;
    if (node.mapType === 'resource') writePageCache(`notsy-resource:${node._id}`, node);
    goTo(node.target);
  };

  const handleMapWheel = (event) => {
    event.preventDefault();
    const direction = event.deltaY < 0 ? 1 : -1;
    setZoom((value) => Math.min(1.3, Math.max(.72, value + direction * .08)));
  };

  const handlePointerDown = (event, node) => {
    if (!fullPage) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = { id: node._id, clusterId: node.clusterId, pointerId: event.pointerId };
    didDragRef.current = false;
    setSelected(node._id);
    setSelectedCluster(node.clusterId);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    const canvas = visualRef.current;
    if (!fullPage || !drag || drag.pointerId !== event.pointerId || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(94, Math.max(6, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(90, Math.max(10, ((event.clientY - rect.top) / rect.height) * 100));
    didDragRef.current = true;
    setNodePositions((previous) => {
      const current = previous[drag.id];
      if (!current) return previous;
      const deltaX = x - current.x;
      const deltaY = y - current.y;
      const next = { ...previous };
      mapNodes.filter((node) => String(node.clusterId) === String(drag.clusterId)).forEach((node) => {
        const position = previous[node._id] || { x: node.x, y: node.y };
        next[node._id] = { x: Math.min(94, Math.max(6, position.x + deltaX)), y: Math.min(90, Math.max(10, position.y + deltaY)) };
      });
      return next;
    });
  };

  const handlePointerUp = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

  return (
    <section className={`knowledge-map-shell ${compact ? 'is-compact' : ''} ${fullPage ? 'is-full-page' : ''}`}>
      {!compact && <div className="knowledge-map-editorial">
        <div className="knowledge-map-heading">
          <p className="dashboard-eyebrow">Knowledge map</p>
          <h2>See how it<br /><em>connects.</em></h2>
          <p className="knowledge-map-copy">Your notes aren&apos;t just isolated thoughts. Explore how your ideas, topics and notebooks are related.</p>
        </div>
        <div className="knowledge-map-controls">
          <h3>Map View</h3>
          <div className="knowledge-map-tabs">
            {[['concepts', LightBulbIcon, 'Concepts'], ['notebooks', BookOpenIcon, 'Notebooks'], ['topics', CodeBracketIcon, 'Topics']].map(([id, Icon, label]) => <button key={id} type="button" className={view === id ? 'is-active' : ''} onClick={() => setView(id)}>{React.createElement(Icon)}{label}</button>)}
          </div>
          <div className="knowledge-map-hint"><LightBulbIcon /><span>Click a node to explore related notes and topics.</span></div>
        </div>
      </div>}
      <div ref={visualRef} className="knowledge-map-visual" onWheel={fullPage ? handleMapWheel : undefined} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <div className="knowledge-map-glow knowledge-map-glow-orange" />
        <div className="knowledge-map-glow knowledge-map-glow-cool" />
        <div className="knowledge-map-stage" style={{ transform: `scale(${zoom})` }}>
          <svg className="knowledge-map-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {visibleNodes.filter((node) => node.parentId && visibleNodes.some((candidate) => String(candidate._id) === String(node.parentId))).map((node) => <path key={node._id} d={pathFor(node)} className={`knowledge-path depth-${node.depth} ${selectedCluster && String(selectedCluster) !== String(node.clusterId) ? 'is-dim' : ''} ${selected === node._id ? 'is-selected' : ''}`} />)}
          </svg>
          {visibleNodes.map((node) => {
            const type = nodeTypes[node.mapType];
            return <button type="button" key={node._id} className={`knowledge-node ${type.className} knowledge-node-depth-${node.depth} ${selectedCluster && String(selectedCluster) !== String(node.clusterId) ? 'is-dim' : ''} ${String(selectedCluster) === String(node.clusterId) ? 'is-cluster-active' : ''} ${selected === node._id ? 'is-selected' : ''} ${fullPage ? 'is-draggable' : ''}`} style={{ left: `${node.x}%`, top: `${node.y}%`, '--node-scale': node.scale, '--node-hover-scale': node.scale * 1.14, '--node-selected-scale': node.scale * 1.35 }} onPointerDown={(event) => handlePointerDown(event, node)} onClick={() => handleNodeClick(node)} onDoubleClick={() => openNode(node)} aria-label={`${fullPage ? 'Drag or select' : 'Open'} ${node.label}`}><span className="knowledge-node-icon" /><span className="knowledge-node-name">{node.label}</span></button>;
          })}
          {!mapNodes.length && <div className="knowledge-map-empty">Create a notebook to begin your map.</div>}
        </div>
        {fullPage && <p className="knowledge-map-zoom-hint">Scroll or pinch to zoom</p>}
      </div>
    </section>
  );
};

export default KnowledgeMap;
