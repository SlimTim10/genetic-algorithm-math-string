// JavaScript/TypeScript's standard library is lacking in basic utility functions.

export const eqArrays = (xs: any[], ys: any[]): boolean => {
  return (xs.length === ys.length) && xs.every((_, i) => {
    if (Array.isArray(xs[i]) && Array.isArray(ys[i])) {
      return eqArrays(xs[i], ys[i]);
    } else {
      return xs[i] === ys[i];
    }
  });
};

export const buildArray = (size: number): undefined[] => [...Array(size)];

export const range = (from: number, to: number): number[] => {
  return [...Array(to - from + 1)].map((_, idx) => idx + from);
};

export const repeat = <T>(x: T, n: number): T[] => [...Array(n)].map(_ => x);

export const chunksOf = <T>(n: number, xs: T[]): T[][] => {
  const size = Math.floor(xs.length / n);
  const initialChunks: number[][] = buildArray(size).map((_, idx) => repeat(idx, n));
  const extraChunks: number[] = repeat(initialChunks.length, xs.length % n);
  const chunks: number[][] = extraChunks.length > 0
    ? [...initialChunks, extraChunks]
    : initialChunks;
  const indexes: number[][] = chunks.map(chunk =>
    chunk.map((chunkNum, idx) =>
      (chunkNum * n) + idx));
  return indexes.map(chunk => chunk.map(idx => xs[idx]));
};
