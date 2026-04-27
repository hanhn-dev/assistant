export type MindMapTheme = 'space' | 'jungle' | 'candy';

export type MindMapSticker =
  | 'rocket'
  | 'planet'
  | 'tree'
  | 'leaf'
  | 'sparkle'
  | 'heart'
  | 'star'
  | 'book'
  | 'idea'
  | 'music';

export interface MindMapNode {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  doodleDataUrl: string | null;
  sticker: MindMapSticker | string | null;
  x: number;
  y: number;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export interface MindMapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface ProgressionReward {
  kind: 'sticker' | 'theme';
  id: string;
  label: string;
}

export interface MindMapProgression {
  level: number;
  nodeCount: number;
  nextLevelAt: number;
  unlockedRewards: ProgressionReward[];
}

export interface MindMap {
  id: string;
  title: string;
  theme: MindMapTheme;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  progression: MindMapProgression;
}

export interface StorySlide {
  id: string;
  title: string;
  icon: string | null;
  doodleDataUrl: string | null;
  sticker: MindMapSticker | string | null;
  depth: number;
  childrenCount: number;
}

export interface StoryModeExport {
  mindMapId: string;
  title: string;
  theme: MindMapTheme;
  slides: StorySlide[];
}