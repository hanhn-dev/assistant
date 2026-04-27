import { Injectable } from '@nestjs/common';
import type { MindMapNode } from '@a7t/api';

interface LayoutPoint {
  id: string;
  parentId: string | null;
  x: number;
  y: number;
}

@Injectable()
export class AutoLayoutService {
  arrange(nodes: MindMapNode[]): Pick<MindMapNode, 'id' | 'x' | 'y'>[] {
    if (nodes.length === 0) {
      return [];
    }

    const points = this.seedFromTree(nodes);
    const width = 1600;
    const height = 1000;
    const centerX = width / 2;
    const centerY = height / 2;
    const velocities = new Map<string, { x: number; y: number }>();

    for (const point of points) {
      velocities.set(point.id, { x: 0, y: 0 });
    }

    for (let iteration = 0; iteration < 90; iteration += 1) {
      for (let i = 0; i < points.length; i += 1) {
        for (let j = i + 1; j < points.length; j += 1) {
          const first = points[i]!;
          const second = points[j]!;
          const dx = first.x - second.x;
          const dy = first.y - second.y;
          const distance = Math.max(60, Math.hypot(dx, dy));
          const force = 2800 / (distance * distance);
          const pushX = (dx / distance) * force;
          const pushY = (dy / distance) * force;
          velocities.get(first.id)!.x += pushX;
          velocities.get(first.id)!.y += pushY;
          velocities.get(second.id)!.x -= pushX;
          velocities.get(second.id)!.y -= pushY;
        }
      }

      for (const point of points) {
        if (!point.parentId) {
          const velocity = velocities.get(point.id)!;
          velocity.x += (centerX - point.x) * 0.025;
          velocity.y += (centerY - point.y) * 0.025;
          continue;
        }

        const parent = points.find((candidate) => candidate.id === point.parentId);
        if (!parent) {
          continue;
        }

        const dx = parent.x - point.x;
        const dy = parent.y - point.y;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const spring = (distance - 230) * 0.018;
        const pullX = (dx / distance) * spring;
        const pullY = (dy / distance) * spring;
        velocities.get(point.id)!.x += pullX;
        velocities.get(point.id)!.y += pullY;
        velocities.get(parent.id)!.x -= pullX * 0.35;
        velocities.get(parent.id)!.y -= pullY * 0.35;
      }

      for (const point of points) {
        const velocity = velocities.get(point.id)!;
        point.x = Math.min(width - 120, Math.max(120, point.x + velocity.x));
        point.y = Math.min(height - 100, Math.max(100, point.y + velocity.y));
        velocity.x *= 0.74;
        velocity.y *= 0.74;
      }
    }

    return points.map((point) => ({
      id: point.id,
      x: Math.round(point.x),
      y: Math.round(point.y),
    }));
  }

  private seedFromTree(nodes: MindMapNode[]): LayoutPoint[] {
    const root = nodes.find((node) => node.parentId === null) ?? nodes[0]!;
    const byParent = new Map<string | null, MindMapNode[]>();

    for (const node of nodes) {
      const siblings = byParent.get(node.parentId) ?? [];
      siblings.push(node);
      byParent.set(node.parentId, siblings);
    }

    return nodes.map((node, index) => {
      if (node.id === root.id) {
        return { id: node.id, parentId: null, x: 800, y: 500 };
      }

      const siblings = byParent.get(node.parentId) ?? [node];
      const siblingIndex = siblings.findIndex((sibling) => sibling.id === node.id);
      const angle =
        (Math.PI * 2 * Math.max(0, siblingIndex)) / Math.max(1, siblings.length) +
        node.depth * 0.72;
      const radius = 210 + node.depth * 145 + index * 4;

      return {
        id: node.id,
        parentId: node.parentId,
        x: 800 + Math.cos(angle) * radius,
        y: 500 + Math.sin(angle) * radius,
      };
    });
  }
}