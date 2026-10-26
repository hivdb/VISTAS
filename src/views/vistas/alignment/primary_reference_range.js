const MAX_DISCONNECTED_GAP = 30;

// Sierra can occasionally attach a very short alignment island to the far
// end of a gene reference. Use the largest covered block so that the island
// does not expand ranges or contribute mutations and frameshifts to reports.
export function getPrimaryReferenceRange(gene) {
  const {positionLine = [], alignedNAsLine = []} = gene.prettyPairwise || {};
  const coveredPositions = [];
  positionLine.forEach((rawPosition, index) => {
    const position = parseInt(rawPosition, 10);
    const codon = String(alignedNAsLine[index] || '').replace(/\s/g, '');
    if (Number.isInteger(position) && /[^.-]/.test(codon)) {
      coveredPositions.push(position);
    }
  });

  if (coveredPositions.length === 0) {
    return {firstAA: gene.firstAA, lastAA: gene.lastAA};
  }

  const blocks = [];
  let block = [coveredPositions[0]];
  for (let index = 1; index < coveredPositions.length; index += 1) {
    if (
      coveredPositions[index] - coveredPositions[index - 1] >
      MAX_DISCONNECTED_GAP
    ) {
      blocks.push(block);
      block = [];
    }
    block.push(coveredPositions[index]);
  }
  blocks.push(block);

  const primary = blocks.reduce(
    (best, candidate) => candidate.length > best.length ? candidate : best,
    blocks[0]
  );
  return {firstAA: primary[0], lastAA: primary[primary.length - 1]};
}

export function positionIsInPrimaryRange(position, range) {
  return position >= range.firstAA && position <= range.lastAA;
}
