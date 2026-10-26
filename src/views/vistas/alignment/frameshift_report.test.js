import {getGeneAlignments} from './frameshift_correction';
import {
  makeInitialAlignmentFiles,
  makeFinalReportFiles,
  getDRMRanges
} from './frameshift_report';

function makeAnalysis() {
  return {
    inputSequence: {header: 'sample', sequence: ''},
    alignedGeneSequences: [{
      gene: {name: 'PR', length: 5},
      firstAA: 2,
      lastAA: 4,
      frameShifts: [{position: 2, text: '2ins1bp_A'}],
      mutations: [
        {position: 3, hasStop: false, shortText: 'I3ins'},
        {position: 4, hasStop: true, shortText: 'W4*'}
      ],
      prettyPairwise: {
        // Codon insertion after 3 and a frameshift insertion after 2 have
        // blank positions, as in Sierra's PrettyPairwise.
        positionLine: [' 2 ', '    ', ' 3 ', '   ', ' 4 '],
        alignedNAsLine: ['CCG', 'A  ', 'ATA', 'GGG', 'TAG']
      }
    }]
  };
}

test('aligns initial codons by reference position', () => {
  const [pr] = getGeneAlignments(makeAnalysis());

  expect(pr.alignedNAs).toBe('---CCGATATAG---');
  expect(pr.stopCodons).toEqual([{position: 4, text: 'W4*'}]);
  expect(pr.frameShifts).toEqual([{position: 2, text: '2ins1bp_A'}]);
});

test('writes one HTML report per gene', () => {
  const isolates = [
    {
      IsolateID: 'S1<x>',
      genes: {PR: {}},
      initialGeneAlignments: getGeneAlignments(makeAnalysis())
    },
    {
      IsolateID: 'S2',
      genes: {},
      initialGeneAlignments: getGeneAlignments(makeAnalysis())
    }
  ];

  const files = makeInitialAlignmentFiles(isolates);

  expect(files.map((f) => f.fileName)).toEqual(['PR.html']);
  const html = files[0].data;
  expect(html).toContain('S1&lt;x&gt;');
  expect(html).not.toContain('S2');
  expect(html).toContain('<span class="uncovered" title="Codon 1">---</span>');
  expect(html).toContain(
    '<span class="fs" title="Codon 2; Frameshift: 2ins1bp_A">CCG</span>'
  );
  expect(html).toContain('> ATA <span class="stop"');
  expect(html).toContain('<td>2ins1bp_A</td>');
  expect(html).toContain('<td>W4*</td>');
});

test('final report shows only frameshifts left after correction', () => {
  const [initial] = getGeneAlignments(makeAnalysis());
  const isolates = [{
    IsolateID: 'S1',
    genes: {PR: {}},
    initialGeneAlignments: [initial],
    finalGeneAlignments: [{...initial, frameShifts: []}]
  }];

  const [file] = makeFinalReportFiles(isolates);

  expect(file.folder).toBe('Frameshift_stop_codon_report');
  expect(file.fileName).toBe('PR.html');
  expect(file.data).toContain('PR: frameshift and stop codon report');
  expect(file.data).not.toContain('2ins1bp_A');
  expect(file.data).not.toContain('Frameshift: ');
  expect(file.data).toContain('<td>W4*</td>');
});

test('reports issues only within the primary covered reference block', () => {
  const analysis = makeAnalysis();
  const gene = analysis.alignedGeneSequences[0];
  gene.gene.length = 100;
  gene.firstAA = 1;
  gene.lastAA = 100;
  gene.frameShifts = [{position: 100, text: '100del2bp'}];
  gene.mutations = [
    {position: 3, hasStop: true, shortText: 'I3*'},
    {position: 100, hasStop: true, shortText: 'W100*'}
  ];
  gene.prettyPairwise = {
    positionLine: [' 1 ', ' 2 ', ' 3 ', ' 100 '],
    alignedNAsLine: ['AAA', 'CCC', 'TAG', 'T--']
  };

  const [alignment] = getGeneAlignments(analysis);

  expect(alignment).toMatchObject({firstAA: 1, lastAA: 3});
  expect(alignment.frameShifts).toEqual([]);
  expect(alignment.stopCodons).toEqual([{position: 3, text: 'I3*'}]);
});

test('flags frameshifts within the gene DRM position range', () => {
  const isolates = [
    {
      IsolateID: 'S1',
      genes: {PR: {}},
      initialGeneAlignments: getGeneAlignments(makeAnalysis())
    },
    {
      IsolateID: 'S2',
      genes: {PR: {}},
      initialGeneAlignments: getGeneAlignments(makeAnalysis())
        .map((aln) => ({...aln, frameShifts: []}))
    }
  ];
  const drmRanges = getDRMRanges({PR: {3: 'A', 5: 'T'}});

  expect(drmRanges).toEqual({PR: [3, 5]});
  const [file] = makeInitialAlignmentFiles(isolates, drmRanges);
  expect(file.data).toContain('<th>Frameshift in DRM range (AA 3-5)</th>');
  expect(file.data).toMatch(/<td>2ins1bp_A<\/td>\s*<td>No<\/td>/);
  expect(file.data).toMatch(/<td><\/td>\s*<td><\/td>\s*<td>4<\/td>/);

  const [inRange] = makeInitialAlignmentFiles(isolates, {PR: [1, 3]});
  expect(inRange.data).toMatch(/<td>2ins1bp_A<\/td>\s*<td>Yes<\/td>/);

  const [noRange] = makeInitialAlignmentFiles(isolates);
  expect(noRange.data).not.toContain('DRM range');
});
