import { Injectable, NotFoundException } from '@nestjs/common';

import type { MindMap, MindMapTheme } from '@a7t/api';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateMindMapInput,
  CreateMindMapNodeInput,
  MindMapRepository,
  UpdateMindMapNodeInput,
} from '../domain/mind-map.repository';
import { ProgressionService } from '../domain/progression.service';
import { mapStoredMindMap } from './mind-map.mapper';

const includeNodes = {
  nodes: {
    orderBy: [{ depth: 'asc' as const }, { createdAt: 'asc' as const }],
  },
};

const WORLD_BOUNDS = {
  minX: 90,
  maxX: 1510,
  minY: 70,
  maxY: 930,
};

@Injectable()
export class PrismaMindMapRepository extends MindMapRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progression: ProgressionService,
  ) {
    super();
  }

  async create(input: CreateMindMapInput): Promise<MindMap> {
    const map = await this.prisma.mindMap.create({
      data: {
        title: input.title,
        ownerName: input.ownerName,
        theme: input.theme,
        nodes: {
          create: {
            title: input.title,
            icon: 'idea',
            sticker: 'sparkle',
            x: 800,
            y: 500,
            depth: 0,
          },
        },
      },
      include: includeNodes,
    });

    return mapStoredMindMap(map, this.progression);
  }

  async findById(id: string): Promise<MindMap | null> {
    const map = await this.prisma.mindMap.findUnique({
      where: { id },
      include: includeNodes,
    });

    return map ? mapStoredMindMap(map, this.progression) : null;
  }

  async addNode(input: CreateMindMapNodeInput): Promise<MindMap> {
    const parent = await this.prisma.mindMapNode.findFirst({
      where: { id: input.parentId, mindMapId: input.mindMapId },
    });

    if (!parent) {
      throw new NotFoundException('Parent node not found');
    }

    const siblingCount = await this.prisma.mindMapNode.count({
      where: { parentId: input.parentId },
    });
    const angle = siblingCount * 0.9 - 0.8;
    const distance = 210;
    const nextX = clamp(parent.x + Math.cos(angle) * distance, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX);
    const nextY = clamp(parent.y + Math.sin(angle) * distance, WORLD_BOUNDS.minY, WORLD_BOUNDS.maxY);

    await this.prisma.mindMapNode.create({
      data: {
        mindMapId: input.mindMapId,
        parentId: input.parentId,
        title: input.title,
        icon: input.icon,
        doodleDataUrl: input.doodleDataUrl,
        sticker: input.sticker,
        x: nextX,
        y: nextY,
        depth: parent.depth + 1,
      },
    });

    return this.requireMap(input.mindMapId);
  }

  async updateNode(
    mindMapId: string,
    nodeId: string,
    input: UpdateMindMapNodeInput,
  ): Promise<MindMap> {
    await this.ensureNode(mindMapId, nodeId);
    await this.prisma.mindMapNode.update({
      where: { id: nodeId },
      data: input,
    });

    return this.requireMap(mindMapId);
  }

  async updateTheme(mindMapId: string, theme: MindMapTheme): Promise<MindMap> {
    await this.prisma.mindMap.update({
      where: { id: mindMapId },
      data: { theme },
    });

    return this.requireMap(mindMapId);
  }

  async updateNodePositions(
    mindMapId: string,
    nodes: Array<{ id: string; x: number; y: number }>,
  ): Promise<MindMap> {
    await this.prisma.$transaction(
      nodes.map((node) =>
        this.prisma.mindMapNode.update({
          where: { id: node.id },
          data: { x: node.x, y: node.y },
        }),
      ),
    );

    return this.requireMap(mindMapId);
  }

  private async requireMap(id: string): Promise<MindMap> {
    const map = await this.findById(id);

    if (!map) {
      throw new NotFoundException('Mind map not found');
    }

    return map;
  }

  private async ensureNode(mindMapId: string, nodeId: string) {
    const node = await this.prisma.mindMapNode.findFirst({
      where: { id: nodeId, mindMapId },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}