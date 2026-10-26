import {correctFrameshifts} from './frameshift_correction';

function makeSequenceAnalysis(sequence, genes = []) {
  return {
    inputSequence: {
      header: 'sample',
      sequence
    },
    alignedGeneSequences: genes
  };
}

function makeGene({
  name = 'NS3',
  firstNA,
  lastNA,
  alignedNAsLine,
  positionLine = alignedNAsLine.map((_, index) => ` ${index + 1} `),
  mutationLine = alignedNAsLine.map(() => ' - '),
  frameShifts = [{position: 1, isInsertion: true, size: 1, NAs: 'A'}]
}) {
  return {
    gene: {name},
    firstNA,
    lastNA,
    frameShifts,
    prettyPairwise: {alignedNAsLine, positionLine, mutationLine}
  };
}

test('leaves a sequence without frameshifts unchanged', () => {
  const analysis = makeSequenceAnalysis('AAACCCGGG', [makeGene({
    firstNA: 1,
    lastNA: 9,
    alignedNAsLine: ['AAA', 'CCC', 'GGG'],
    frameShifts: []
  })]);

  const result = correctFrameshifts(analysis);

  expect(result.correctedSequence).toBe('AAACCCGGG');
  expect(result.corrections).toEqual([]);
  expect(result.correctedAnalysis.alignedGeneSequences[0]).toMatchObject({
    firstNA: 1,
    lastNA: 9
  });
});

test('removes frameshift-inserted bases that Sierra left out', () => {
  // Live Sierra drops the inserted 'A' from alignedNAsLine.
  const result = correctFrameshifts(makeSequenceAnalysis(
    'AAACCGAGTTCCC',
    [makeGene({firstNA: 4, lastNA: 10, alignedNAsLine: ['CCG', 'GTT']})]
  ));

  expect(result.correctedSequence).toBe('AAACCGGTTCCC');
  expect(result.corrections[0]).toMatchObject({
    gene: 'NS3',
    firstNA: 4,
    lastNA: 10,
    originalLength: 7,
    correctedLength: 6
  });
  const [gene] = result.correctedAnalysis.alignedGeneSequences;
  expect(gene).toMatchObject({firstNA: 4, lastNA: 9, frameShifts: []});
  expect(result.correctedAnalysis.inputSequence.sequence)
    .toBe('AAACCGGTTCCC');
});

test('removes frameshift insertion entries from local Sierra builds', () => {
  const result = correctFrameshifts(makeSequenceAnalysis(
    'AAACCGAGTTCCC',
    [makeGene({
      firstNA: 4,
      lastNA: 10,
      positionLine: [' 1 ', '   ', ' 2 '],
      alignedNAsLine: ['CCG', 'A  ', 'GTT'],
      mutationLine: [' - ', '^  ', ' - ']
    })]
  ));

  expect(result.correctedSequence).toBe('AAACCGGTTCCC');
  expect(result.correctedAnalysis.alignedGeneSequences[0].prettyPairwise)
    .toMatchObject({
      positionLine: [' 1 ', ' 2 '],
      alignedNAsLine: ['CCG', 'GTT']
    });
});

test('fills bases missing from a partial codon with N', () => {
  const result = correctFrameshifts(makeSequenceAnalysis(
    'AAACCGTTCCC',
    [makeGene({
      firstNA: 4,
      lastNA: 8,
      alignedNAsLine: ['CCG', '-TT'],
      frameShifts: [{position: 2, isDeletion: true, size: 1, NAs: ''}]
    })]
  ));

  expect(result.correctedSequence).toBe('AAACCGNTTCCC');
  expect(
    result.correctedAnalysis.alignedGeneSequences[0].prettyPairwise
      .alignedNAsLine
  ).toEqual(['CCG', 'NTT']);
});

test('keeps whole deleted codons as deletions', () => {
  const result = correctFrameshifts(makeSequenceAnalysis(
    'AAACCGTTCCC',
    [makeGene({
      firstNA: 4,
      lastNA: 8,
      alignedNAsLine: ['CCG', '---', '-TT'],
      frameShifts: [{position: 3, isDeletion: true, size: 1, NAs: ''}]
    })]
  ));

  expect(result.correctedSequence).toBe('AAACCGNTTCCC');
  expect(
    result.correctedAnalysis.alignedGeneSequences[0].prettyPairwise
      .alignedNAsLine
  ).toEqual(['CCG', '---', 'NTT']);
});

test('keeps codon insertions', () => {
  const result = correctFrameshifts(makeSequenceAnalysis(
    'CCGAAAAGTT',
    [makeGene({
      firstNA: 1,
      lastNA: 10,
      positionLine: [' 1 ', '   ', ' 2 '],
      alignedNAsLine: ['CCG', 'AAA', 'GTT'],
      mutationLine: ['P_K', ' K ', ' - ']
    })]
  ));

  expect(result.correctedSequence).toBe('CCGAAAGTT');
});

test('finds the aligned bases when firstNA is off', () => {
  const result = correctFrameshifts(makeSequenceAnalysis(
    'AAACCGAGTTCCC',
    [makeGene({firstNA: 6, lastNA: 10, alignedNAsLine: ['CCG', 'GTT']})]
  ));

  expect(result.correctedSequence).toBe('AAACCGGTTCCC');
  expect(result.corrections[0].firstNA).toBe(4);
});

test('shifts the positions of genes after a corrected gene', () => {
  const result = correctFrameshifts(makeSequenceAnalysis(
    'CCGAGTTAAACCC',
    [
      makeGene({
        name: 'NS3', firstNA: 1, lastNA: 7, alignedNAsLine: ['CCG', 'GTT']
      }),
      makeGene({
        name: 'NS4A',
        firstNA: 8,
        lastNA: 13,
        alignedNAsLine: ['AAA', 'CCC'],
        frameShifts: []
      })
    ]
  ));

  const [, ns4a] = result.correctedAnalysis.alignedGeneSequences;
  expect(ns4a).toMatchObject({firstNA: 7, lastNA: 12});
  expect(result.correctedSequence.slice(6, 12)).toBe('AAACCC');
});

test('leaves a gene uncorrected when its codons cannot be mapped', () => {
  const result = correctFrameshifts(makeSequenceAnalysis(
    'AAACCCGGG',
    [makeGene({firstNA: 1, lastNA: 9, alignedNAsLine: ['TTT', 'TTT']})]
  ));

  expect(result.correctedSequence).toBe('AAACCCGGG');
  expect(result.uncorrectedGenes).toEqual(['NS3']);
  expect(result.correctedAnalysis.alignedGeneSequences[0].frameShifts)
    .toHaveLength(1);
});

test('leaves the later of two overlapping genes uncorrected', () => {
  const result = correctFrameshifts(makeSequenceAnalysis('AAACCCGGGTTT', [
    makeGene({
      name: 'NS3', firstNA: 1, lastNA: 6, alignedNAsLine: ['AAA', 'CCC']
    }),
    makeGene({
      name: 'NS4A', firstNA: 6, lastNA: 12, alignedNAsLine: ['CGG', 'GTT']
    })
  ]));

  expect(result.corrections.map((c) => c.gene)).toEqual(['NS3']);
  expect(result.uncorrectedGenes).toEqual(['NS4A']);
});

test('ignores a frameshift in a remote short alignment island', () => {
  const result = correctFrameshifts(makeSequenceAnalysis(
    'AAACCCGGG',
    [makeGene({
      firstNA: 1,
      lastNA: 9,
      positionLine: [' 1 ', ' 2 ', ' 3 ', ' 100 '],
      alignedNAsLine: ['AAA', 'CCC', 'GGG', 'T--'],
      frameShifts: [{position: 100, isDeletion: true, size: 2, NAs: ''}]
    })]
  ));

  expect(result.correctedSequence).toBe('AAACCCGGG');
  expect(result.corrections).toEqual([]);
});
