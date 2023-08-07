import {
  eqArrays,
  chunksOf,
  buildArray,
  sum,
  scan,
  zip,
  last,
} from './util';

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
  // Add a "plus" gene to the beginning so I can deal with pairs safely.
  const genes: Gene[] = [ [0, 0], ...chromosome];
  const pairs = chunksOf(2, genes);
  return pairs
    .filter(pair => pair.length === 2)
    .filter(([_, num]) => geneValue(num) !== "(junk)")
    .reduce((acc, pair) => [...acc, ...pair], [])
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

// Now to evaluate the fitness of an organism. This part is tricky because I want organisms to have their fitness stored as part of their data. So, I need to evaluate the fitness of an organism-to-be by evaluating its chromosome, relative to the target number.
// The resulting fitness will be a number between 0 and 1, with 1 being perfect fitness.
const evaluateFitness = (chromosome: Chromosome, target: number): number => {
  const mathStr = cleanChromosome(chromosome)
    .map(geneValue)
    .join(" ");
  const n = evaluateMath(mathStr);
  
  if (isNaN(n) || n === Infinity) {
    // This is as far from the target number as it can be, so let's just say the fitness is 0.
    return 0;
  } else {
    return 1 / (Math.abs(target - n) + 1);
  }
};

// Step 2. Setting parameters

// For running the algorithm, I'm going to make a main function whose arguments are the parameters to set. For this specific application, I need a couple extra parameters: the chromosome length for each organism and the target number.
// This part is not linear. I'm going to fill in the steps of the algorithm as needed.
const runAlgorithm = (
  populationSize: number,
  crossoverRate: number,
  mutationRate: number,
  generationLimit: number,
  chromosomeLength: number,
  target: number
): void => {
  console.log('Initializing population...');
  
  // Step 3. Create initial population
  // Since fitness evaluation is to be done in batch, I'm going to create the population as chromosomes (without fitness).
  const initialChromPopulation: Chromosome[] = buildArray(populationSize)
    .map(_ => randomChromosome(chromosomeLength));

  // Here's where the loop begins. One step at a time.
  const generationalStep = (chromPopulation: Chromosome[], generation: number): Chromosome[] => {
    console.log(`Generation: ${generation}`);
    
    // Check for the stopping condition.
    if (generation >= generationLimit) {
      return chromPopulation;
    }

    // Step 4. Fitness evaluation
    const population: Organism[] = chromPopulation.map(chromosome => ({
      chromosome,
      fitness: evaluateFitness(chromosome, target)
    }));

    // Do Steps 5 to 7 (selection, crossover, and mutation) to produce two offspring.
    // The offspring will be chromosomes instead of organisms, since their fitnesses won't be evaluated yet.
    const reproduce = (): [Chromosome, Chromosome] => {
      // Step 5. Selection
      const parent1 = rouletteWheelSelection(population);
      const parent2 = rouletteWheelSelection(population);

      // Step 6. Crossover
      const [chrom1, chrom2] = crossover(parent1.chromosome, parent2.chromosome, crossoverRate);

      // Step 7. Mutation
      const chrom1Mutated = mutate(chrom1, mutationRate);
      const chrom2Mutated = mutate(chrom2, mutationRate);

      return [chrom1Mutated, chrom2Mutated];
    };

    // Step 8. Replace population
    const newChromPopulation: Chromosome[] = buildArray(Math.floor(populationSize / 2))
      .map(reproduce)
      .flat();

    // Step 9. Repeat until the stopping condition is met
    return generationalStep(newChromPopulation, generation + 1);
  };

  // Get the final population of chromosomes from the recursive generational steps.
  const finalChromPopulation: Chromosome[] = generationalStep(initialChromPopulation, 0);

  // Evaluate the fitness of each chromosome so I have a population of organisms.
  const finalPopulation: Organism[] = finalChromPopulation.map(chromosome => ({
    chromosome,
    fitness: evaluateFitness(chromosome, target)
  }));

  // Step 10. Pick the winner
  const winner = finalPopulation.reduce((best, organism) => organism.fitness > best.fitness ? organism : best);

  // Print the winner's details.
  console.log();
  console.log(`The winner is...`);
  console.log(`Phenotype: ${phenotype(winner)}`);
  console.log(`Clean phenotype: ${cleanPhenotype(winner)}`);
  console.log(`Result: ${evaluateMath(cleanPhenotype(winner))}`);
  console.log(`Fitness: ${evaluateFitness(winner.chromosome, target)}`);

};

// Create a randomized chromosome of a desired length.
const randomChromosome = (length: number): Chromosome => {
  const numberGenes: Gene[] = buildArray(Math.floor(length / 2))
    .map(_ => randomGene("number"));
  const operatorGenes: Gene[] = buildArray(Math.floor(length / 2 - 1))
    .map(_ => randomGene("operator"));
  return zip(numberGenes, operatorGenes)
    .flat()
    .concat([last(numberGenes)]);
};

type NumberOrOperator = "number" | "operator";

// Create a randomized number or operator gene.
const randomGene = (numberOrOperator: NumberOrOperator): Gene => {
  switch (numberOrOperator) {
    case "number":
      return [randomBit(), randomBit(), randomBit(), randomBit()];
    case "operator":
      return [randomBit(), randomBit()];
  }
};

// Generate a random bit (0 or 1).
const randomBit = (): Bit => (Math.random() < 0.5) ? 0 : 1;

// Select an organism from a population using the roulette wheel strategy.
const rouletteWheelSelection = (population: Organism[]): Organism => {
  const fitnesses: number[] = population.map(({fitness}) => fitness);
  const totalFitness: number = sum(fitnesses);
  const cumulFitnesses: number[] = scan((x: number, y: number) => x + y, fitnesses[0], fitnesses);
  const withCumulativeFitnesses: [Organism, number][] = zip(population, cumulFitnesses);
  const r: number = Math.random() * totalFitness;
  const found: [Organism, number] | undefined = withCumulativeFitnesses.find(([_, cf]) => cf >= r);
  if (found === undefined) {
    // In case an organism is not found, return the last one.
    return population[population.length - 1];
  } else {
    const [organism, _] = found;
    return organism;
  }
};

// Crossover (or clone) two chromosomes.
const crossover = (x: Chromosome, y: Chromosome, crossoverRate: number): [Chromosome, Chromosome] => {
  const r: number = Math.random();
  if (r <= crossoverRate) {
    const position: number = Math.floor(Math.random() * x.length);
    const xNew = [...x.slice(0, position), ...y.slice(position)];
    const yNew = [...y.slice(0, position), ...x.slice(position)];
    return [xNew, yNew];
  } else {
    return [x, y];
  }
};

// Flip a bit from 0 to 1, or 1 to 0.
const flipBit = (bit: Bit): Bit => bit === 0 ? 1 : 0;

// Mutate a chromosome.
const mutate = (chromosome: Chromosome, mutationRate: number): Chromosome => {
  // Mutate a bit.
  const mutateBit = (bit: Bit): Bit => {
    const r: number = Math.random();
    return r <= mutationRate
      ? flipBit(bit)
      : bit;
  };

  // Mutate each gene.
  return chromosome.map(gene => {
    if (isNumber(gene)) {
      const [a, b, c, d] = gene;
      return [mutateBit(a), mutateBit(b), mutateBit(c), mutateBit(d)];
    }

    if (isOperator(gene)) {
      const [a, b] = gene;
      return [mutateBit(a), mutateBit(b)];
    }

    return gene;
  });
};

// After playing with the parameters, I found that these values gave pretty consistently interesting results, and relatively fast.
const populationSize = 200;
const crossoverRate = 0.6;
const mutationRate = 0.05;
const generationLimit = 20;
const chromosomeLength = 20;
const target = 42;
runAlgorithm(populationSize, crossoverRate, mutationRate, generationLimit, chromosomeLength, target);
