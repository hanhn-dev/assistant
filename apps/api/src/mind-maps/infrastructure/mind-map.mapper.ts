import type { MindMap, MindMapNode, MindMapTheme } from '@a7t/api';

import { ProgressionService } from '../domain/progression.service';

type StoredMindMapNode = {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  doodleDataUrl: string | null;
  sticker: string | null;
  x: number;
  y: number;
  depth: number;
  createdAt: Date;
  updatedAt: Date;
};

export type StoredMindMap = {
  id: string;
  title: string;
  theme: string;
  ownerName: string | null;
  createdAt: Date;
  updatedAt: Date;
  nodes: StoredMindMapNode[];
};

const WORLD_BOUNDS = {
  minX: 90,
  maxX: 1510,
  minY: 70,
  maxY: 930,
};

export function mapStoredMindMap(
  storedMap: StoredMindMap,
  progression: ProgressionService,
): MindMap {
  const nodes: MindMapNode[] = storedMap.nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId,
    title: node.title,
    icon: node.icon,
    doodleDataUrl: node.doodleDataUrl,
    sticker: node.sticker,
    x: clamp(node.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
    y: clamp(node.y, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY),
    depth: node.depth,
    createdAt: node.createdAt.toISOString(),
    updatedAt: node.updatedAt.toISOString(),
  }));

  return {
    id: storedMap.id,
    title: storedMap.title,
    theme: storedMap.theme as MindMapTheme,
    ownerName: storedMap.ownerName,
    createdAt: storedMap.createdAt.toISOString(),
    updatedAt: storedMap.updatedAt.toISOString(),
    nodes,
    edges: nodes
      .filter((node) => node.parentId)
      .map((node) => ({
        id: `${node.parentId}-${node.id}`,
        fromNodeId: node.parentId!,
        toNodeId: node.id,
      })),
    progression: progression.calculate(nodes.length),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}