'use client';

import {
  BookOpen,
  Brush,
  CircleDot,
  Focus,
  Lock,
  Mic,
  Palette,
  Plus,
  Printer,
  Sparkles,
  Users,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { io, type Socket } from 'socket.io-client';

import type {
  MindMap,
  MindMapNode,
  MindMapSticker,
  MindMapTheme,
  StoryModeExport,
} from '@a7t/api';

import styles from './page.module.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const WORLD_WIDTH = 1600;
const WORLD_HEIGHT = 1000;

type StickerOption = {
  id: MindMapSticker;
  label: string;
  glyph: string;
};

type ThemeOption = {
  id: MindMapTheme;
  label: string;
};

const STICKERS: StickerOption[] = [
  { id: 'rocket', label: 'Rocket', glyph: '🚀' },
  { id: 'planet', label: 'Planet', glyph: '🪐' },
  { id: 'tree', label: 'Tree', glyph: '🌳' },
  { id: 'leaf', label: 'Leaf', glyph: '🍃' },
  { id: 'sparkle', label: 'Sparkle', glyph: '✨' },
  { id: 'heart', label: 'Heart', glyph: '💛' },
  { id: 'star', label: 'Star', glyph: '⭐' },
  { id: 'book', label: 'Book', glyph: '📚' },
  { id: 'idea', label: 'Idea', glyph: '💡' },
  { id: 'music', label: 'Music', glyph: '🎵' },
];

const THEMES: ThemeOption[] = [
  { id: 'space', label: 'Space' },
  { id: 'jungle', label: 'Jungle' },
  { id: 'candy', label: 'Candy' },
];

type SpeechRecognitionResultEvent = Event & {
  results: { [index: number]: { [index: number]: { transcript: string } } };
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

type DragState = {
  nodeId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
};

export function MindMapStudio() {
  const [mindMap, setMindMap] = useState<MindMap | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [doodleParentId, setDoodleParentId] = useState<string | null>(null);
  const [story, setStory] = useState<StoryModeExport | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [lastAddedNodeId, setLastAddedNodeId] = useState<string | null>(null);
  const [status, setStatus] = useState('Opening a fresh map...');
  const [isListening, setIsListening] = useState(false);
  const worldRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const isBootingRef = useRef(false);

  useEffect(() => {
    void bootMindMap();
  }, []);

  useEffect(() => {
    if (!mindMap?.id) {
      return undefined;
    }

    const socket: Socket = io(`${API_BASE_URL}/mind-maps`, {
      transports: ['websocket'],
    });
    socket.emit('joinMap', mindMap.id);
    socket.on('mapUpdated', (updatedMap: MindMap) => {
      setMindMap(updatedMap);
      setStatus('Playdate update synced');
    });

    return () => {
      socket.disconnect();
    };
  }, [mindMap?.id]);

  const selectedNode = useMemo(
    () => mindMap?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [mindMap, selectedNodeId],
  );

  const visibleFocusIds = useMemo(() => {
    if (!mindMap || !selectedNodeId || !focusMode) {
      return new Set(mindMap?.nodes.map((node) => node.id) ?? []);
    }

    const descendants = new Set<string>([selectedNodeId]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const node of mindMap.nodes) {
        if (
          node.parentId &&
          descendants.has(node.parentId) &&
          !descendants.has(node.id)
        ) {
          descendants.add(node.id);
          changed = true;
        }
      }
    }

    return descendants;
  }, [focusMode, mindMap, selectedNodeId]);

  async function bootMindMap() {
    if (isBootingRef.current) {
      return;
    }

    isBootingRef.current = true;

    try {
      const storedId = window.localStorage.getItem('kids-mind-map-id');
      if (storedId) {
        const existing = await request<MindMap>(`/mind-maps/${storedId}`);
        setMindMap(existing);
        setSelectedNodeId(existing.nodes[0]?.id ?? null);
        setStatus('Ready for ideas');
        return;
      }

      const created = await request<MindMap>('/mind-maps', {
        method: 'POST',
        body: JSON.stringify({ title: 'My Big Idea', theme: 'space' }),
      });
      window.localStorage.setItem('kids-mind-map-id', created.id);
      setMindMap(created);
      setSelectedNodeId(created.nodes[0]?.id ?? null);
      setStatus('Ready for ideas');
    } catch (error) {
      setStatus('API is not reachable yet');
      console.error(error);
    } finally {
      isBootingRef.current = false;
    }
  }

  async function createNode(parentId: string, input: Partial<MindMapNode> = {}) {
    if (!mindMap) {
      return;
    }

    const beforeIds = new Set(mindMap.nodes.map((node) => node.id));
    const updated = await request<MindMap>(`/mind-maps/${mindMap.id}/nodes`, {
      method: 'POST',
      body: JSON.stringify({
        parentId,
        title: input.title,
        icon: input.icon,
        doodleDataUrl: input.doodleDataUrl,
        sticker: input.sticker,
      }),
    });
    const newNode = updated.nodes.find((node) => !beforeIds.has(node.id));
    setMindMap(updated);
    setSelectedNodeId(newNode?.id ?? parentId);
    setLastAddedNodeId(newNode?.id ?? null);
    setStatus('New branch added');
  }

  async function updateNode(nodeId: string, input: Partial<MindMapNode>) {
    if (!mindMap) {
      return;
    }

    const updated = await request<MindMap>(
      `/mind-maps/${mindMap.id}/nodes/${nodeId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
    );
    setMindMap(updated);
  }

  async function applyTheme(theme: MindMapTheme) {
    if (!mindMap) {
      return;
    }

    const updated = await request<MindMap>(`/mind-maps/${mindMap.id}/theme`, {
      method: 'PATCH',
      body: JSON.stringify({ theme }),
    });
    setMindMap(updated);
    setStatus(`${themeLabel(theme)} theme on`);
  }

  async function autoLayout() {
    if (!mindMap) {
      return;
    }

    setStatus('Magic layout is running');
    const updated = await request<MindMap>(`/mind-maps/${mindMap.id}/layout`, {
      method: 'POST',
    });
    setMindMap(updated);
    setStatus('Branches spread out');
  }

  async function openStory() {
    if (!mindMap) {
      return;
    }

    const exportedStory = await request<StoryModeExport>(
      `/mind-maps/${mindMap.id}/story`,
    );
    setStory(exportedStory);
  }

  function startVoice(parentId: string) {
    const SpeechRecognition =
      (window as SpeechWindow).SpeechRecognition ??
      (window as SpeechWindow).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('Speech is unavailable in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      setIsListening(false);
      if (transcript) {
        void createNode(parentId, { title: transcript, icon: 'idea' });
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      setStatus('Voice capture stopped');
    };
    setIsListening(true);
    setStatus('Listening...');
    recognition.start();
  }

  function beginDrag(
    node: MindMapNode,
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (!worldRef.current) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = worldRef.current.getBoundingClientRect();
    setSelectedNodeId(node.id);
    setDragState({
      nodeId: node.id,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left - node.x,
      offsetY: event.clientY - rect.top - node.y,
    });
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState || !mindMap || !worldRef.current) {
      return;
    }

    const rect = worldRef.current.getBoundingClientRect();
    const x = clamp(event.clientX - rect.left - dragState.offsetX, 90, WORLD_WIDTH - 90);
    const y = clamp(event.clientY - rect.top - dragState.offsetY, 70, WORLD_HEIGHT - 70);
    setMindMap({
      ...mindMap,
      nodes: mindMap.nodes.map((node) =>
        node.id === dragState.nodeId ? { ...node, x, y } : node,
      ),
    });
  }

  function endDrag() {
    if (!dragState || !mindMap) {
      return;
    }

    const node = mindMap.nodes.find((candidate) => candidate.id === dragState.nodeId);
    setDragState(null);
    if (node) {
      void updateNode(node.id, { x: node.x, y: node.y });
    }
  }

  function onDoodlePointer(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context || !isDrawingRef.current) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    context.stroke();
  }

  function beginDoodle(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!canvas || !context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    isDrawingRef.current = true;
    context.lineWidth = 8;
    context.lineCap = 'round';
    context.strokeStyle = '#22223b';
    context.beginPath();
    context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  function clearDoodle() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  async function saveDoodle() {
    if (!doodleParentId || !canvasRef.current) {
      return;
    }

    await createNode(doodleParentId, {
      title: 'Doodle idea',
      doodleDataUrl: canvasRef.current.toDataURL('image/png'),
    });
    setDoodleParentId(null);
    clearDoodle();
  }

  function nodeFace(node: MindMapNode) {
    if (node.doodleDataUrl) {
      return (
        <Image
          src={node.doodleDataUrl}
          alt=""
          width={48}
          height={48}
          unoptimized
        />
      );
    }

    const sticker = STICKERS.find((item) => item.id === node.sticker);
    return (
      <span>
        {sticker?.glyph ??
          STICKERS.find((item) => item.id === node.icon)?.glyph ??
          '💡'}
      </span>
    );
  }

  if (!mindMap) {
    return (
      <main className={`${styles.page} ${styles.themeSpace}`}>
        <div className={styles.loadingPanel}>
          <Sparkles size={34} />
          <p>{status}</p>
          <button type="button" onClick={() => void bootMindMap()}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  const themeClass =
    mindMap.theme === 'jungle'
      ? styles.themeJungle
      : mindMap.theme === 'candy'
        ? styles.themeCandy
        : styles.themeSpace;

  return (
    <main className={`${styles.page} ${themeClass}`}>
      <aside className={styles.leftRail} aria-label="Mind map controls">
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>
            <CircleDot size={22} />
          </div>
          <div>
            <h1>{mindMap.title}</h1>
            <p>Level {mindMap.progression.level}</p>
          </div>
        </div>

        <div className={styles.toolGroup}>
          <button
            type="button"
            title="Add idea"
            onClick={() => selectedNode && void createNode(selectedNode.id)}
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            title="Doodle idea"
            onClick={() => selectedNode && setDoodleParentId(selectedNode.id)}
          >
            <Brush size={18} />
          </button>
          <button
            type="button"
            title="Speak idea"
            className={isListening ? styles.activeTool : ''}
            onClick={() => selectedNode && startVoice(selectedNode.id)}
          >
            <Mic size={18} />
          </button>
          <button type="button" title="Magic layout" onClick={() => void autoLayout()}>
            <Wand2 size={18} />
          </button>
          <button
            type="button"
            title="Focus mode"
            className={focusMode ? styles.activeTool : ''}
            onClick={() => setFocusMode((value) => !value)}
          >
            <Focus size={18} />
          </button>
          <button type="button" title="Story mode" onClick={() => void openStory()}>
            <BookOpen size={18} />
          </button>
        </div>

        <section className={styles.panel}>
          <h2>
            <Palette size={16} /> Themes
          </h2>
          <div className={styles.themeGrid}>
            {THEMES.map((theme) => {
              const unlocked = isThemeUnlocked(theme.id, mindMap);
              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`${styles.themeChip} ${themeChipClass(theme.id)}`}
                  disabled={!unlocked}
                  onClick={() => void applyTheme(theme.id)}
                  title={unlocked ? theme.label : 'Locked'}
                >
                  {unlocked ? theme.label : <Lock size={14} />}
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>
            <Sparkles size={16} /> Stickers
          </h2>
          <div className={styles.stickerGrid}>
            {STICKERS.map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                title={sticker.label}
                draggable
                onDragStart={(event) =>
                  event.dataTransfer.setData('text/plain', sticker.id)
                }
                onClick={() =>
                  selectedNode && void updateNode(selectedNode.id, { sticker: sticker.id })
                }
              >
                {sticker.glyph}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.panel}>
          <h2>
            <Users size={16} /> Playdate
          </h2>
          <p>{status}</p>
        </section>
      </aside>

      <section className={styles.stage} aria-label="Mind map canvas">
        <div
          ref={worldRef}
          className={styles.world}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <svg
            className={styles.branches}
            viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
            aria-hidden="true"
          >
            {mindMap.edges.map((edge) => {
              const from = mindMap.nodes.find((node) => node.id === edge.fromNodeId);
              const to = mindMap.nodes.find((node) => node.id === edge.toNodeId);
              const hidden =
                focusMode &&
                (!visibleFocusIds.has(edge.fromNodeId) ||
                  !visibleFocusIds.has(edge.toNodeId));

              if (!from || !to) {
                return null;
              }

              const middleX = (from.x + to.x) / 2;
              return (
                <path
                  key={edge.id}
                  className={`${styles.branch} ${to.id === lastAddedNodeId ? styles.growingBranch : ''} ${hidden ? styles.dimmed : ''}`}
                  d={`M ${from.x} ${from.y} C ${middleX} ${from.y}, ${middleX} ${to.y}, ${to.x} ${to.y}`}
                />
              );
            })}
          </svg>

          {mindMap.nodes.map((node) => {
            const selected = node.id === selectedNodeId;
            const hidden = focusMode && !visibleFocusIds.has(node.id);
            return (
              <div
                key={node.id}
                className={`${styles.nodeWrap} ${selected ? styles.selectedNode : ''} ${hidden ? styles.dimmed : ''}`}
                style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const sticker = event.dataTransfer.getData('text/plain');
                  if (sticker) {
                    void updateNode(node.id, { sticker });
                  }
                }}
              >
                <button
                  type="button"
                  className={`${styles.nodeButton} ${node.id === lastAddedNodeId ? styles.growthNode : ''}`}
                  onPointerDown={(event) => beginDrag(node, event)}
                  onClick={() => setSelectedNodeId(node.id)}
                >
                  <span className={styles.nodeIcon}>{nodeFace(node)}</span>
                  <input
                    value={node.title}
                    aria-label="Idea title"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => {
                      const title = event.target.value;
                      setMindMap({
                        ...mindMap,
                        nodes: mindMap.nodes.map((candidate) =>
                          candidate.id === node.id ? { ...candidate, title } : candidate,
                        ),
                      });
                    }}
                    onBlur={(event) => void updateNode(node.id, { title: event.target.value })}
                  />
                </button>
                <button
                  className={styles.plusButton}
                  type="button"
                  title="Add branch"
                  onClick={() => void createNode(node.id)}
                >
                  <Plus size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <aside className={styles.rightRail} aria-label="Progress">
        <div className={styles.levelOrb}>{mindMap.progression.level}</div>
        <p>{mindMap.progression.nodeCount} ideas</p>
        <div className={styles.progressTrack}>
          <span
            style={{
              width: `${Math.min(
                100,
                (mindMap.progression.nodeCount / mindMap.progression.nextLevelAt) * 100,
              )}%`,
            }}
          />
        </div>
        <div className={styles.rewardList}>
          {mindMap.progression.unlockedRewards.map((reward) => (
            <span key={`${reward.kind}-${reward.id}`}>{reward.label}</span>
          ))}
        </div>
      </aside>

      {doodleParentId ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.doodleModal}>
            <div className={styles.modalHeader}>
              <h2>Doodle</h2>
              <button type="button" title="Close" onClick={() => setDoodleParentId(null)}>
                <X size={18} />
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={320}
              height={220}
              className={styles.doodleCanvas}
              onPointerDown={beginDoodle}
              onPointerMove={onDoodlePointer}
              onPointerUp={() => {
                isDrawingRef.current = false;
              }}
              onPointerLeave={() => {
                isDrawingRef.current = false;
              }}
            />
            <div className={styles.modalActions}>
              <button type="button" onClick={clearDoodle}>
                Clear
              </button>
              <button type="button" onClick={() => void saveDoodle()}>
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {story ? (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.storyModal}>
            <div className={styles.modalHeader}>
              <h2>{story.title}</h2>
              <div>
                <button type="button" title="Print" onClick={() => window.print()}>
                  <Printer size={18} />
                </button>
                <button type="button" title="Close" onClick={() => setStory(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className={styles.storySlides}>
              {story.slides.map((slide, index) => (
                <article key={slide.id} className={styles.storySlide}>
                  <span>{index + 1}</span>
                  <div>
                    {slide.doodleDataUrl ? (
                      <Image
                        src={slide.doodleDataUrl}
                        alt=""
                        width={70}
                        height={70}
                        unoptimized
                      />
                    ) : (
                      stickerGlyph(slide.sticker)
                    )}
                  </div>
                  <h3>{slide.title}</h3>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );

  function themeChipClass(theme: MindMapTheme) {
    if (theme === 'jungle') {
      return styles.chipJungle;
    }
    if (theme === 'candy') {
      return styles.chipCandy;
    }
    return styles.chipSpace;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function themeLabel(theme: MindMapTheme) {
  return THEMES.find((item) => item.id === theme)?.label ?? theme;
}

function stickerGlyph(sticker: string | null) {
  return STICKERS.find((item) => item.id === sticker)?.glyph ?? '💡';
}

function isThemeUnlocked(theme: MindMapTheme, mindMap: MindMap) {
  if (theme === 'space') {
    return true;
  }

  return mindMap.progression.unlockedRewards.some(
    (reward) => reward.kind === 'theme' && reward.id === theme,
  );
}
