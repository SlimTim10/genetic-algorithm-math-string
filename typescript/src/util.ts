// JavaScript/TypeScript's standard library is lacking in basic utility functions.

// Check for array equality by comparing their values.
export const eqArrays = (xs: any[], ys: any[]): boolean => {
  return (xs.length === ys.length) && xs.every((_, i) => {
    if (Array.isArray(xs[i]) && Array.isArray(ys[i])) {
      return eqArrays(xs[i], ys[i]);
    } else {
      return xs[i] === ys[i];
    }
  });
};

// Make a new array of a given size.
export const buildArray = (size: number): undefined[] => [...Array(size)];

// Make an array of an element repeated n times.
export const repeat = <A>(x: A, n: number): A[] => [...Array(n)].map(_ => x);

// Split an array into chunks of a given size.
export const chunksOf = <A>(n: number, xs: A[]): A[][] => {
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

// Sum an array of numbers.
export const sum = (ns: number[]): number => ns.reduce((acc, n) => acc + n, 0);

// Zip two arrays together.
// For example:
//   [1, 2, 3, 4], ["one", "two", "three", "four"]
//   -> [ [1, "one"], [2, "two"], [3, "three"], [4, "four"] ]
export const zip = <A, B>(xs: A[], ys: B[]): [A, B][] => {
  if (xs.length <= ys.length) {
    return xs.reduce((acc: [A, B][], _, i) => (
      [
        ...acc,
        [ xs[i], ys[i] ]
      ]
    ), []);
  } else {
    return ys.reduce((acc: [A, B][], _, i) => (
      [
        ...acc,
        [ xs[i], ys[i] ]
      ]
    ), []);
  }
};

// Returns the last element of the given list.
export const last = <A>(xs: A[]): A => xs[xs.length - 1];

// Scan is similar to reduce, but returns a list of successively reduced values from the left.
export const scan = <A, B>(
  fn: (acc: A, value: B) => A,
  initial: A,
  values: B[]
): A[] => {
  return values.reduce((acc, x) => {
    return [...acc, fn(last(acc), x)];
  }, [initial]);
};
