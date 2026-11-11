/**
 * Page 03 / Graph Explorer
 * Full-screen graph exploration with community text filtering, node search,
 * and inspector side panel with hairline divider floating above warm light ash canvas.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { apiClient } from '../api/client';
import Reveal from '../components/Reveal';
import GraphView from '../components/GraphView';
import ErrorBanner from '../components/ErrorBanner';

export default function GraphExplorer() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState(null); // null = all

  // Load graph data
  useEffect(() => {
    async function fetchGraph() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const url = selectedCommunity !== null
          ? `/graph?community=${selectedCommunity}`
          : '/graph';
        const resp = await apiClient.get(url);
        setGraphData(resp.data);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchGraph();
  }, [selectedCommunity]);

  // Extract unique communities
  const communities = useMemo(() => {
    const commSet = new Set();
    graphData.nodes.forEach((n) => {
      if (n.community !== undefined && n.community >= 0) {
        commSet.add(n.community);
      }
    });
    return Array.from(commSet).sort((a, b) => a - b);
  }, [graphData.nodes]);

  // Node neighbors lookup for inspector side panel
  const nodeNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    const neighbors = [];
    graphData.links.forEach((l) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      if (srcId === selectedNode.id) {
        neighbors.push({ id: tgtId, relation: l.relation });
      } else if (tgtId === selectedNode.id) {
        neighbors.push({ id: srcId, relation: l.relation });
      }
    });
    return neighbors;
  }, [selectedNode, graphData.links]);

  // Search filter
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) return;
    const match = graphData.nodes.find((n) =>
      (n.label || n.id).toLowerCase().includes(q.toLowerCase().trim())
    );
    if (match) {
      setSelectedNode(match);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <section style={{ marginBottom: '32px' }}>
        <Reveal delay={0}>
          <div className="numbered-section">
            <span className="num">03</span> / <span>Topological Cartography</span>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h1 style={{ fontSize: '42px', marginBottom: '8px' }}>Graph Explorer</h1>
        </Reveal>
        <Reveal delay={120}>
          <p style={{ color: 'var(--ash-600)', fontSize: '15.5px' }}>
            Interactive topology showing Louvain community clusters, entity classifications, and semantic relationship edges.
          </p>
        </Reveal>
      </section>

      {/* Error Callout */}
      {errorMsg && (
        <Reveal delay={0}>
          <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg(null)} />
        </Reveal>
      )}

      {/* Floating Filter and Search Bar */}
      <Reveal delay={160}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #D3D0CA',
            boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
            borderRadius: 'var(--radius-xs)',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
            marginBottom: '28px',
          }}
        >
          {/* Community Filter as Text List */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <span className="meta-label">Communities:</span>
            <button
              type="button"
              onClick={() => setSelectedCommunity(null)}
              style={{
                background: 'none',
                border: 'none',
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: selectedCommunity === null ? 'var(--accent)' : 'var(--ash-600)',
                textDecoration: selectedCommunity === null ? 'underline' : 'none',
              }}
            >
              All ({graphData.nodes.length})
            </button>
            {communities.slice(0, 8).map((cid) => (
              <button
                key={cid}
                type="button"
                onClick={() => setSelectedCommunity(cid)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: selectedCommunity === cid ? 'var(--accent)' : 'var(--ash-600)',
                  textDecoration: selectedCommunity === cid ? 'underline' : 'none',
                }}
              >
                C{cid}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '240px' }}>
            <Search size={15} strokeWidth={1.25} color="var(--ash-600)" />
            <input
              type="text"
              placeholder="Locate entity..."
              value={searchQuery}
              onChange={handleSearch}
              className="input-editorial"
              style={{ padding: '6px 4px', fontSize: '13px' }}
            />
          </div>
        </div>
      </Reveal>

      {/* Main Graph View & Inspector Panel */}
      <Reveal delay={200}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selectedNode ? '1fr 340px' : '1fr',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          {/* Graph Canvas */}
          <div>
            {graphData.nodes.length === 0 && !loading ? (
              <div className="empty-state">
                No indexed knowledge graph detected. Upload documents on the Upload page to generate entities.
              </div>
            ) : (
              <GraphView
                data={graphData}
                selectedNode={selectedNode}
                onNodeClick={(node) => setSelectedNode(node)}
                height={620}
              />
            )}
          </div>

          {/* Right Side Inspector Panel floating with 1px border and neutral shadow */}
          {selectedNode && (
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D3D0CA',
                boxShadow: '0 30px 60px -34px rgba(0, 0, 0, 0.18)',
                borderRadius: 'var(--radius-xs)',
                padding: '24px',
                height: '620px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #D3D0CA',
                  paddingBottom: '14px',
                  marginBottom: '18px',
                }}
              >
                <div>
                  <span className="meta-label" style={{ color: 'var(--accent)' }}>
                    Entity Inspector
                  </span>
                  <h3 style={{ fontSize: '22px', marginTop: '4px' }}>
                    {selectedNode.label || selectedNode.id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  aria-label="Close inspector"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ash-600)',
                    padding: '4px',
                  }}
                >
                  <X size={16} strokeWidth={1.25} />
                </button>
              </div>

              {/* Entity Type & Community */}
              <div style={{ marginBottom: '20px' }}>
                <div className="meta-label" style={{ marginBottom: '4px' }}>
                  Category
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {selectedNode.type || 'CONCEPT'}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span className="meta-label">Community: </span>
                  <span style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
                    {selectedNode.community !== undefined ? `Cluster #${selectedNode.community}` : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <div className="meta-label" style={{ marginBottom: '6px' }}>
                  Synthesized Description
                </div>
                <p style={{ fontSize: '13.5px', lineHeight: '1.6', color: 'var(--ash-900)' }}>
                  {selectedNode.description || 'No direct description extracted.'}
                </p>
              </div>

              {/* Connected Neighbors & Relations */}
              <div>
                <div className="meta-label" style={{ marginBottom: '10px' }}>
                  Connected Relationships ({nodeNeighbors.length})
                </div>
                {nodeNeighbors.length === 0 ? (
                  <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--ash-400)' }}>
                    No incident relations recorded.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {nodeNeighbors.map((nb, i) => (
                      <div
                        key={nb.id + i}
                        className="clickable-row"
                        onClick={() => {
                          const target = graphData.nodes.find((n) => n.id === nb.id);
                          if (target) setSelectedNode(target);
                        }}
                        style={{
                          padding: '10px 12px',
                          border: '1px solid #D3D0CA',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#FAF9F7',
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{nb.id}</span>
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--accent)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                          }}
                        >
                          {nb.relation}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}
