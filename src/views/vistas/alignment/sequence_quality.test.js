import {
  countInputAmbiguities,
  formatStopMutations,
  getSequenceQualityColumns,
  mergeInputAmbiguityCounts
} from './sequence_quality';

test('counts input N and other IUPAC ambiguous bases separately', () => {
  expect(countInputAmbiguities('acgtnNrykmswbdhv-?')).toEqual({
    nCount: 2,
    otherAmbiguousCount: 10
  });
});

test('reports pre-correction amino acid positions by gene and input counts', () => {
  const isolate = {
    genes: {PR: {}, RT: {}},
    inputAmbiguityCounts: {nCount: 3, otherAmbiguousCount: 2},
    initialGeneAlignments: [
      {
        gene: 'PR', firstAA: 2, lastAA: 4,
        alignedNAs: 'NNNATN---NCG---',
        frameShifts: [{position: 3}, {position: 2}]
      },
      {
        gene: 'RT', firstAA: 1, lastAA: 2,
        alignedNAs: 'TAAANG---',
        frameShifts: []
      },
      {
        gene: 'IN', firstAA: 1, lastAA: 1,
        alignedNAs: 'ANN', frameShifts: []
      }
    ]
  };

  expect(getSequenceQualityColumns(isolate)).toEqual({
    'Frameshift positions': 'PR: 2, 3',
    'N nucleotide count': 3,
    'Non-N ambiguous nucleotide count': 2,
    'AA positions with N': 'PR: 2, 4; RT: 2'
  });
});

test('formats stop mutations as gene-prefixed mutation lists', () => {
  expect(formatStopMutations(
    {RT: {stops: 'W4*'}, PR: {stops: ''}},
    (a, b) => ['PR', 'RT'].indexOf(a) - ['PR', 'RT'].indexOf(b)
  )).toBe('RT: W4*\n');
});

test('adds ambiguity counts when sequences are merged into one isolate', () => {
  expect(mergeInputAmbiguityCounts([
    {inputAmbiguityCounts: {nCount: 2, otherAmbiguousCount: 1}},
    {inputAmbiguityCounts: {nCount: 1, otherAmbiguousCount: 3}}
  ])).toEqual({nCount: 3, otherAmbiguousCount: 4});
});
