import { ModelComparisonMetrics } from '../types';

export interface TrainingSample {
  val0: number;
  val24: number;
  delta0_24: number;
  driftRate0_24: number;
  target168h: number; // Actual Value_168h for training/eval ONLY
}

// 1. Ridge Linear Regression
export class LinearDriftModel {
  weights: number[] = [0, 0, 0, 0];
  bias: number = 0;

  fit(samples: TrainingSample[]) {
    // Normal equations with L2 regularization
    // Features: [1, val0, val24, delta0_24, driftRate0_24]
    const n = samples.length;
    if (n === 0) return;

    // Direct closed-form multivariate linear fit
    let sum0 = 0, sum24 = 0, sumDelta = 0, sumRate = 0, sumY = 0;
    for (const s of samples) {
      sum0 += s.val0;
      sum24 += s.val24;
      sumDelta += s.delta0_24;
      sumRate += s.driftRate0_24;
      sumY += s.target168h;
    }

    const mean0 = sum0 / n;
    const mean24 = sum24 / n;
    const meanDelta = sumDelta / n;
    const meanRate = sumRate / n;
    const meanY = sumY / n;

    // Fit weights via gradient descent with Ridge penalty for numerical stability
    const epochs = 400;
    const lr = 0.005;
    const l2 = 0.01;
    let w0 = 0.5, w24 = 1.8, wDelta = 2.5, wRate = 10.0, b = 0.0;

    for (let ep = 0; ep < epochs; ep++) {
      let grad0 = 0, grad24 = 0, gradDelta = 0, gradRate = 0, gradB = 0;
      for (const s of samples) {
        const pred = b + w0 * s.val0 + w24 * s.val24 + wDelta * s.delta0_24 + wRate * s.driftRate0_24;
        const err = pred - s.target168h;
        grad0 += err * s.val0;
        grad24 += err * s.val24;
        gradDelta += err * s.delta0_24;
        gradRate += err * s.driftRate0_24;
        gradB += err;
      }
      w0 -= lr * ((grad0 / n) + l2 * w0);
      w24 -= lr * ((grad24 / n) + l2 * w24);
      wDelta -= lr * ((gradDelta / n) + l2 * wDelta);
      wRate -= lr * ((gradRate / n) + l2 * wRate);
      b -= lr * (gradB / n);
    }

    this.weights = [w0, w24, wDelta, wRate];
    this.bias = b;
  }

  predict(val0: number, val24: number): number {
    const delta = val24 - val0;
    const rate = delta / 24.0;
    return this.bias + this.weights[0] * val0 + this.weights[1] * val24 + this.weights[2] * delta + this.weights[3] * rate;
  }
}

// 2. Decision Tree Node for Regression
interface RegTreeNode {
  featureIdx?: number;
  splitVal?: number;
  predVal?: number;
  left?: RegTreeNode;
  right?: RegTreeNode;
}

export class DecisionTreeRegressor {
  root: RegTreeNode | null = null;
  maxDepth: number;

  constructor(maxDepth: number = 4) {
    this.maxDepth = maxDepth;
  }

  fit(data: number[][], targets: number[], depth: number = 0): RegTreeNode {
    const n = data.length;
    const meanTarget = targets.reduce((a, b) => a + b, 0) / Math.max(n, 1);

    if (depth >= this.maxDepth || n <= 6) {
      return { predVal: meanTarget };
    }

    let bestVar = Infinity;
    let bestFeature = 0;
    let bestSplit = 0;
    let bestLeftIdx: number[] = [];
    let bestRightIdx: number[] = [];

    const numFeatures = data[0].length;
    for (let f = 0; f < numFeatures; f++) {
      const vals = data.map(d => d[f]);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      if (min === max) continue;

      const numSplits = 10;
      for (let s = 1; s < numSplits; s++) {
        const threshold = min + (s / numSplits) * (max - min);
        const leftIdx: number[] = [];
        const rightIdx: number[] = [];
        for (let i = 0; i < n; i++) {
          if (data[i][f] < threshold) leftIdx.push(i);
          else rightIdx.push(i);
        }
        if (leftIdx.length === 0 || rightIdx.length === 0) continue;

        const meanL = leftIdx.reduce((acc, idx) => acc + targets[idx], 0) / leftIdx.length;
        const meanR = rightIdx.reduce((acc, idx) => acc + targets[idx], 0) / rightIdx.length;
        const varL = leftIdx.reduce((acc, idx) => acc + Math.pow(targets[idx] - meanL, 2), 0);
        const varR = rightIdx.reduce((acc, idx) => acc + Math.pow(targets[idx] - meanR, 2), 0);
        const totalVar = varL + varR;

        if (totalVar < bestVar) {
          bestVar = totalVar;
          bestFeature = f;
          bestSplit = threshold;
          bestLeftIdx = leftIdx;
          bestRightIdx = rightIdx;
        }
      }
    }

    if (bestLeftIdx.length === 0 || bestRightIdx.length === 0) {
      return { predVal: meanTarget };
    }

    const leftData = bestLeftIdx.map(i => data[i]);
    const leftTargets = bestLeftIdx.map(i => targets[i]);
    const rightData = bestRightIdx.map(i => data[i]);
    const rightTargets = bestRightIdx.map(i => targets[i]);

    return {
      featureIdx: bestFeature,
      splitVal: bestSplit,
      left: this.fit(leftData, leftTargets, depth + 1),
      right: this.fit(rightData, rightTargets, depth + 1)
    };
  }

  predict(x: number[], node: RegTreeNode | null = this.root): number {
    if (!node) return 0;
    if (node.predVal !== undefined || node.featureIdx === undefined) {
      return node.predVal ?? 0;
    }
    if (x[node.featureIdx] < node.splitVal!) {
      return this.predict(x, node.left);
    } else {
      return this.predict(x, node.right);
    }
  }
}

// 3. Random Forest Regressor
export class RandomForestDriftModel {
  trees: DecisionTreeRegressor[] = [];
  numTrees: number = 20;

  fit(samples: TrainingSample[]) {
    this.trees = [];
    const data = samples.map(s => [s.val0, s.val24, s.delta0_24, s.driftRate0_24]);
    const targets = samples.map(s => s.target168h);
    const n = data.length;

    for (let t = 0; t < this.numTrees; t++) {
      const tree = new DecisionTreeRegressor(4);
      const subData: number[][] = [];
      const subTargets: number[] = [];
      for (let i = 0; i < n; i++) {
        const randIdx = Math.floor(Math.random() * n);
        subData.push(data[randIdx]);
        subTargets.push(targets[randIdx]);
      }
      tree.root = tree.fit(subData, subTargets);
      this.trees.push(tree);
    }
  }

  predict(val0: number, val24: number): number {
    if (this.trees.length === 0) return val24;
    const delta = val24 - val0;
    const rate = delta / 24.0;
    const x = [val0, val24, delta, rate];
    const preds = this.trees.map(tree => tree.predict(x));
    return preds.reduce((a, b) => a + b, 0) / preds.length;
  }
}

// 4. Gradient Boosted Regressor
export class GradientBoostedDriftModel {
  baseVal: number = 0;
  trees: DecisionTreeRegressor[] = [];
  learningRate: number = 0.1;
  numIterations: number = 25;

  fit(samples: TrainingSample[]) {
    this.trees = [];
    const data = samples.map(s => [s.val0, s.val24, s.delta0_24, s.driftRate0_24]);
    const targets = samples.map(s => s.target168h);
    const n = data.length;
    if (n === 0) return;

    this.baseVal = targets.reduce((a, b) => a + b, 0) / n;
    const currentPreds = new Array(n).fill(this.baseVal);

    for (let iter = 0; iter < this.numIterations; iter++) {
      const residuals = targets.map((t, idx) => t - currentPreds[idx]);
      const tree = new DecisionTreeRegressor(3);
      tree.root = tree.fit(data, residuals);
      this.trees.push(tree);

      for (let i = 0; i < n; i++) {
        currentPreds[i] += this.learningRate * tree.predict(data[i]);
      }
    }
  }

  predict(val0: number, val24: number): number {
    const delta = val24 - val0;
    const rate = delta / 24.0;
    const x = [val0, val24, delta, rate];
    let pred = this.baseVal;
    for (const tree of this.trees) {
      pred += this.learningRate * tree.predict(x);
    }
    return pred;
  }
}

export function evaluateRegressionModel(
  model: { predict: (val0: number, val24: number) => number },
  testSamples: TrainingSample[]
): { mae: number; rmse: number; r2: number } {
  if (testSamples.length === 0) return { mae: 0, rmse: 0, r2: 0 };
  let absErrSum = 0;
  let sqErrSum = 0;
  const actuals = testSamples.map(s => s.target168h);
  const meanActual = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  let totVarSum = 0;

  for (const s of testSamples) {
    const pred = model.predict(s.val0, s.val24);
    const err = pred - s.target168h;
    absErrSum += Math.abs(err);
    sqErrSum += err * err;
    totVarSum += Math.pow(s.target168h - meanActual, 2);
  }

  const n = testSamples.length;
  const mae = absErrSum / n;
  const rmse = Math.sqrt(sqErrSum / n);
  const r2 = totVarSum > 0 ? Math.max(0, 1 - (sqErrSum / totVarSum)) : 1;

  return { mae, rmse, r2 };
}

export function trainAndCompareDriftModels(
  trainSamples: TrainingSample[],
  valSamples: TrainingSample[]
): { bestModel: { predict: (val0: number, val24: number) => number }; metrics: ModelComparisonMetrics[] } {
  // 1. Linear Regression
  const linearModel = new LinearDriftModel();
  linearModel.fit(trainSamples);
  const linearMetrics = evaluateRegressionModel(linearModel, valSamples);

  // 2. Random Forest Regressor
  const rfModel = new RandomForestDriftModel();
  rfModel.fit(trainSamples);
  const rfMetrics = evaluateRegressionModel(rfModel, valSamples);

  // 3. Gradient Boosted Regressor
  const gbModel = new GradientBoostedDriftModel();
  gbModel.fit(trainSamples);
  const gbMetrics = evaluateRegressionModel(gbModel, valSamples);

  const modelList = [
    { name: 'Gradient Boosted Regressor', model: gbModel, metrics: gbMetrics },
    { name: 'Random Forest Regressor', model: rfModel, metrics: rfMetrics },
    { name: 'Linear Regression (Ridge)', model: linearModel, metrics: linearMetrics }
  ];

  // Select best model by lowest MAE
  modelList.sort((a, b) => a.metrics.mae - b.metrics.mae);
  const best = modelList[0];

  const comparisonMetrics: ModelComparisonMetrics[] = modelList.map(m => ({
    modelName: m.name,
    mae: parseFloat(m.metrics.mae.toFixed(4)),
    rmse: parseFloat(m.metrics.rmse.toFixed(4)),
    r2: parseFloat(m.metrics.r2.toFixed(4)),
    featuresUsed: ['Value_0h', 'Value_24h', 'Delta_0_24h', 'Drift_Rate_0_24h'],
    isBest: m.name === best.name
  }));

  return {
    bestModel: best.model,
    metrics: comparisonMetrics
  };
}
