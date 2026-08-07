export const DIMS: Dim[] = ['R', 'I', 'A', 'S', 'E', 'C', 'V'];

export type Dim = 'R' | 'I' | 'A' | 'S' | 'E' | 'C' | 'V';

export interface PreparedVector {
  vector: Record<Dim, number>;
  normalized: Record<Dim, number>;
  magnitude: number;
}

export const DIM_LABELS: Record<Dim, string> = {
  R: "현장형", I: "탐구형", A: "예술형", S: "사회형", E: "진취형", C: "사무형", V: "가치형"
};

export function clamp(value: number | undefined | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function prepareVector(source: Partial<Record<Dim, number>> | undefined): PreparedVector {
  const vector = {} as Record<Dim, number>;
  let sumSquares = 0;

  DIMS.forEach((dim) => {
    const value = clamp(source?.[dim]);
    vector[dim] = value;
    sumSquares += value * value;
  });

  const magnitude = Math.sqrt(sumSquares);
  const normalized = {} as Record<Dim, number>;

  if (magnitude === 0) {
    DIMS.forEach((dim) => {
      normalized[dim] = 0;
    });
    return { vector, normalized, magnitude: 0 };
  }

  DIMS.forEach((dim) => {
    normalized[dim] = vector[dim] / magnitude;
  });

  return { vector, normalized, magnitude };
}

export function getSortedDims(vector: Record<Dim, number>) {
  return [...DIMS].sort((a, b) => vector[b] - vector[a]);
}

export function cosineSimilarity(a: Record<Dim, number>, b: Record<Dim, number>) {
  let dot = 0;
  DIMS.forEach((dim) => {
    dot += a[dim] * b[dim];
  });
  return dot;
}
