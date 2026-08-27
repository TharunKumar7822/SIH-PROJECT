import { EarlyFeatures } from '../types';

interface IsolationTreeNode {
  splitFeature?: number;
  splitValue?: number;
  left?: IsolationTreeNode;
  right?: IsolationTreeNode;
  size: number;
}

export class IsolationTree {
  root: IsolationTreeNode | null = null;
  maxHeight: number;

  constructor(maxHeight: number = 10) {
    this.maxHeight = maxHeight;
  }

  fit(data: number[][], currentHeight: number = 0): IsolationTreeNode {
    const numSamples = data.length;
    if (currentHeight >= this.maxHeight || numSamples <= 1) {
      return { size: numSamples };
    }

    const numFeatures = data[0].length;
    const splitFeature = Math.floor(Math.random() * numFeatures);

    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let i = 0; i < numSamples; i++) {
      const val = data[i][splitFeature];
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }

    if (minVal === maxVal) {
      return { size: numSamples };
    }

    const splitValue = minVal + Math.random() * (maxVal - minVal);
    const leftData: number[][] = [];
    const rightData: number[][] = [];

    for (let i = 0; i < numSamples; i++) {
      if (data[i][splitFeature] < splitValue) {
        leftData.push(data[i]);
      } else {
        rightData.push(data[i]);
      }
    }

    return {
      splitFeature,
      splitValue,
      left: this.fit(leftData, currentHeight + 1),
      right: this.fit(rightData, currentHeight + 1),
      size: numSamples
    };
  }

  pathLength(x: number[], node: IsolationTreeNode | null, currentHeight: number = 0): number {
    if (!node || node.splitFeature === undefined || !node.left || !node.right) {
      return currentHeight + this.c(node ? node.size : 1);
    }

    if (x[node.splitFeature] < node.splitValue!) {
      return this.pathLength(x, node.left, currentHeight + 1);
    } else {
      return this.pathLength(x, node.right, currentHeight + 1);
    }
  }

  c(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    // Euler-Mascheroni constant
    return 2.0 * (Math.log(n - 1) + 0.5772156649) - (2.0 * (n - 1)) / n;
  }
}

export class IsolationForestModel {
  trees: IsolationTree[] = [];
  numTrees: number;
  subsampleSize: number;
  fittedSubsampleC: number = 1;

  constructor(numTrees: number = 50, subsampleSize: number = 256) {
    this.numTrees = numTrees;
    this.subsampleSize = subsampleSize;
  }

  fit(data: number[][]) {
    this.trees = [];
    const n = Math.min(data.length, this.subsampleSize);
    const maxHeight = Math.ceil(Math.log2(Math.max(n, 2)));
    const tempTree = new IsolationTree();
    this.fittedSubsampleC = tempTree.c(n);

    // Deterministic pseudo-random seed mechanism for stable builds
    for (let t = 0; t < this.numTrees; t++) {
      const tree = new IsolationTree(maxHeight);
      const subsample: number[][] = [];
      for (let i = 0; i < n; i++) {
        const randIdx = Math.floor(Math.random() * data.length);
        subsample.push(data[randIdx]);
      }
      tree.root = tree.fit(subsample, 0);
      this.trees.push(tree);
    }
  }

  computeAnomalyScore(x: number[]): number {
    if (this.trees.length === 0) return 0.5;
    let totalPathLength = 0;
    for (const tree of this.trees) {
      totalPathLength += tree.pathLength(x, tree.root, 0);
    }
    const avgPathLength = totalPathLength / this.trees.length;
    const cFactor = this.fittedSubsampleC || 1;
    // Standard isolation forest anomaly score formula s = 2 ^ (-E(h) / c(n))
    const exponent = - (avgPathLength / cFactor);
    const rawScore = Math.pow(2, exponent);
    return Math.min(1.0, Math.max(0.0, rawScore));
  }
}

export function earlyFeaturesToVector(feat: EarlyFeatures, val0: number, val24: number): number[] {
  return [
    val0,
    val24,
    feat.delta_0_24h,
    feat.drift_rate_0_24h,
    feat.lot_deviation_24h,
    feat.lot_robust_zscore_24h,
    feat.pct_change_0_24h
  ];
}

export function calculateStatisticalAnomalyScore(feat: EarlyFeatures): number {
  const z24 = Math.abs(feat.lot_robust_zscore_24h);
  const z0 = Math.abs(feat.lot_robust_zscore_0h);
  const driftRate = Math.abs(feat.drift_rate_0_24h);

  // Severe lot deviation score
  const lotDevScore = Math.min(1.0, Math.max(0.0, (z24 - 1.5) / 3.5));
  // Abnormal drift rate score (normal is ~0.02 - 0.08 µA/h)
  const driftScore = Math.min(1.0, Math.max(0.0, (driftRate - 0.08) / 0.15));
  // Sensor negative offset or drastic baseline jump
  const baselineJumpScore = Math.min(1.0, Math.max(0.0, (z0 - 2.0) / 4.0));

  const combined = 0.45 * lotDevScore + 0.40 * driftScore + 0.15 * baselineJumpScore;
  return Math.min(1.0, Math.max(0.0, combined));
}
