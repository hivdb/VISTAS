import {getNASeq} from './align';
import {getPrimaryReferenceRange} from './primary_reference_range';

function makeDisconnectedGene() {
  const positionLine = [];
  const alignedNAsLine = [];
  for (let position = 1; position <= 631; position += 1) {
    positionLine.push(String(position));
    alignedNAsLine.push(
      position <= 173 ? 'AAA' : position >= 630 ? 'G--' : '---'
    );
  }
  return {
    gene: {name: 'NS3', length: 631},
    firstAA: 1,
    lastAA: 631,
    firstNA: 118,
    lastNA: 640,
    prettyPairwise: {positionLine, alignedNAsLine}
  };
}

test('selects the main NS3 coverage over a detached terminal island', () => {
  expect(getPrimaryReferenceRange(makeDisconnectedGene()))
    .toEqual({firstAA: 1, lastAA: 173});
});

test('uses the primary coverage for the CSV amino-acid range', () => {
  const alignment = getNASeq(makeDisconnectedGene(), 'A'.repeat(640));

  expect(alignment.gene_AA_range).toBe('1 ~ 173');
  expect(alignment.start_AA_pos).toBe(1);
  expect(alignment.stop_AA_pos).toBe(173);
  expect(alignment.trimmed_NA).toHaveLength(519);
});
