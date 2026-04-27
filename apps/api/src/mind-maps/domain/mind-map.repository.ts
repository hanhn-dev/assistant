import type {
  MindMap,
  MindMapNode,
  MindMapTheme,
} from '@a7t/api';

export interface CreateMindMapInput {
  title: string;
  ownerName?: string;
  theme: MindMapTheme;
}

export interface CreateMindMapNodeInput {
  mindMapId: string;
  parentId: string;
  title: string;
  icon?: string | null;
  doodleDataUrl?: string | null;
  sticker?: string | null;
}

export interface UpdateMindMapNodeInput {
  title?: string;
  icon?: string | null;
  doodleDataUrl?: string | null;
  sticker?: string | null;
  x?: number;
  y?: number;
}

export abstract class MindMapRepository {
  abstract create(input: CreateMindMapInput): Promise<MindMap>;
  abstract findById(id: string): Promise<MindMap | null>;
  abstract addNode(input: CreateMindMapNodeInput): Promise<MindMap>;
  abstract updateNode(
    mindMapId: string,
    nodeId: string,
    input: UpdateMindMapNodeInput,
  ): Promise<MindMap>;
  abstract updateTheme(
    mindMapId: string,
    theme: MindMapTheme,
  ): Promise<MindMap>;
  abstract updateNodePositions(
    mindMapId: string,
    nodes: Pick<MindMapNode, 'id' | 'x' | 'y'>[],
  ): Promise<MindMap>;
}
