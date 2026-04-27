import { Injectable } from '@nestjs/common';
import type { MindMapProgression, ProgressionReward } from '@a7t/api';

const REWARDS: Array<{ at: number; reward: ProgressionReward }> = [
  { at: 3, reward: { kind: 'sticker', id: 'star', label: 'Star sticker' } },
  { at: 6, reward: { kind: 'theme', id: 'jungle', label: 'Jungle theme' } },
  { at: 9, reward: { kind: 'sticker', id: 'music', label: 'Music sticker' } },
  { at: 12, reward: { kind: 'theme', id: 'candy', label: 'Candy theme' } },
];

@Injectable()
export class ProgressionService {
  calculate(nodeCount: number): MindMapProgression {
    const level = Math.max(1, Math.floor(nodeCount / 3) + 1);
    const nextLevelAt = level * 3;
    const unlockedRewards = REWARDS.filter((item) => nodeCount >= item.at).map(
      (item) => item.reward,
    );

    return {
      level,
      nodeCount,
      nextLevelAt,
      unlockedRewards,
    };
  }
}
