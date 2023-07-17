import {
  eqArrays,
  chunksOf,
} from './util';

// This presents a linear approach to solving this problem, but real programming is rarely done in a linear fashion. I would normally create functions with gaps to be filled, going back and forth between them a lot. However, the first step of planning the types is something that I do.

// Planning types first.

// An organism is made up of one chromosome and has a fitness number.
type Organism = {
  chromosome: Chromosome;
  fitness: number;
};

// A chromosome is a collection of genes, so I'm going to make it an array. I could define it as a tuple of genes if I wanted to hard-code the length of each chromosome, but I want their length to be variable so I can tweak it on different runs of the algorithm.
type Chromosome = Gene[];

// A gene is a container for information. But for this problem, a gene can either be a number gene or an operator gene. So I'm going to use a union type.
type Gene = NumberGene | OperatorGene;

// For the single-digit numbers, 0 through 9, I know how to represent those with bits (binary):
// 0 = 0
// 1 = 1
// 2 = 10
// 3 = 11
// 4 = 100
// 5 = 101
// 6 = 110
// 7 = 111
// 8 = 1000
// 9 = 1001
// Looks like I'm going to need four bits for the number gene.
type NumberGene = [Bit, Bit, Bit, Bit];

// For the four basic math operators (+, -, *, /), I only need two bits.
type OperatorGene = [Bit, Bit];

// Bits, of course, are either 1 or 0.
type Bit = 0 | 1;

// I'm going to encode all the possible number alleles for the digits 0 through 9.
const numberAlleles: NumberGene[] = [
  [0, 0, 0, 0], // 0
  [0, 0, 0, 1], // 1
  [0, 0, 1, 0], // 2
  [0, 0, 1, 1], // 3
  [0, 1, 0, 0], // 4
  [0, 1, 0, 1], // 5
  [0, 1, 1, 0], // 6
  [0, 1, 1, 1], // 7
  [1, 0, 0, 0], // 8
  [1, 0, 0, 1], // 9
];

// And now the same for operators.
const operatorAlleles: OperatorGene[] = [
  [0, 0], // +
  [0, 1], // -
  [1, 0], // *
  [1, 1], // /
];

// Now I need a way to convert any allele to its corresponding value. For this, I'll collect the possible values with a union type and then make a function that takes a gene's allele and returns its represented value.
type Value
  = "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "+"
  | "-"
  | "*"
  | "/"
  | "(junk)";

// Predicate for number genes.
const isNumber = (gene: Gene): gene is NumberGene => {
  return numberAlleles.some((x: NumberGene) => eqArrays(x, gene));
};

// Predicate for operator genes.
const isOperator = (gene: Gene): gene is OperatorGene => {
  return operatorAlleles.some((x: OperatorGene) => eqArrays(x, gene));
};

// Take a gene and return its represented value.
const geneValue = (gene: Gene): Value => {
  // Numbers
  if (isNumber(gene)) {
    if (eqArrays(gene, [0, 0, 0, 0])) return "0";
    if (eqArrays(gene, [0, 0, 0, 1])) return "1";
    if (eqArrays(gene, [0, 0, 1, 0])) return "2";
    if (eqArrays(gene, [0, 0, 1, 1])) return "3";
    if (eqArrays(gene, [0, 1, 0, 0])) return "4";
    if (eqArrays(gene, [0, 1, 0, 1])) return "5";
    if (eqArrays(gene, [0, 1, 1, 0])) return "6";
    if (eqArrays(gene, [0, 1, 1, 1])) return "7";
    if (eqArrays(gene, [1, 0, 0, 0])) return "8";
    if (eqArrays(gene, [1, 0, 0, 1])) return "9";
  }

  // Operators
  if (isOperator(gene)) {
    if (eqArrays(gene, [0, 0])) return "+";
    if (eqArrays(gene, [0, 1])) return "-";
    if (eqArrays(gene, [1, 0])) return "*";
    if (eqArrays(gene, [1, 1])) return "/";
  }

  // Any other value is junk
  return "(junk)";
};

// To get an organism's phenotype, I can convert each gene to its value and join them into a string.
const phenotype = (organism: Organism): string => {
  return organism.chromosome
    .map(geneValue)
    .join(" ");
};

// I also want a way to get an organism's cleaned-up phenotype, which is safe to be evaluated. That means I first need a way to clean the genes of a chromosome, in accordance with the plan: remove any junk genes (along with their preceeding operators).
const cleanChromosome = (chromosome: Chromosome): Chromosome => {
  // Add a "plus" gene to the beginning so we can deal with pairs safely.
  const genes: Gene[] = [ [0, 0], ...chromosome];
  const pairs = chunksOf(2, genes);
  return pairs
    .filter(pair => pair.length === 2)
    .filter(([_, num]) => geneValue(num) !== "(junk)")
    .reduce((acc, pair) => [...acc, ...pair])
    .slice(1); // Remove the initial "plus" gene.
};

// Apply the chromosome cleaning operation to an organism as a whole.
const cleanPhenotype = (organism: Organism): string => {
  return phenotype({
    ...organism,
    chromosome: cleanChromosome(organism.chromosome)
  });
};

// To evaluate the phenotype of an organism as a math string, I'm going to take the easy route and use the built-in eval function, given the assumption that the string is already cleaned.
// I have to be careful here. For one, I need to be aware that using this evaluation method means the standard order of operations is being applied. Also, it's possible for the result to be NaN or infinity, if a division by 0 happens. I'll have to remember to handle these special cases when doing fitness evaluation.
const evaluateMath = (mathStr: string): number => Number(eval(mathStr));

// Now to evaluate the fitness of an organism. This part is tricky because I want organisms to have their fitness stored as part of their data. So, I need to evaluate the fitness of a future organism by evaluating its chromosome-to-be, relative to the target number.
// The resulting fitness will be a number between 0 and 1, with 1 being perfect fitness.
const evaluateFitness = (chromosome: Chromosome, target: number): number => {
  const mathStr = cleanChromosome(chromosome)
    .map(geneValue)
    .join(" ");
  const n = evaluateMath(mathStr);
  
  if (isNaN(n) || n === Infinity) {
    // This is as far from the target number as it can get, so let's just say the fitness is 0.
    return 0;
  } else {
    return 1 / Math.abs((target - n) + 1);
  }
};

const chrom1: Chromosome = [
  [0, 1, 1, 0], // 6
  [0, 0], // +
  [0, 1, 0, 1], // 5
  [1, 0], // *
  [0, 1, 0, 0], // 4
  [1, 1], // /
  [0, 0, 1, 0], // 2
  [0, 1], // -
  [1, 1, 1, 1], // (junk)
  [0, 0], // +
  [0, 0, 0, 1], // 1
];
const organism1: Organism = {
  chromosome: chrom1,
  fitness: 0
};
console.log('organism1');
console.log('phenotype:', phenotype(organism1));
console.log('cleanPhenotype:', cleanPhenotype(organism1));
console.log('result:', evaluateMath(cleanPhenotype(organism1)));
console.log('fitness:', evaluateFitness(organism1.chromosome, 42));
