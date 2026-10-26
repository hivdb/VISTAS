const OTHER_AMBIGUOUS_NUCLEOTIDES = /[RYKMSWBDHV]/g;

export function countInputAmbiguities(sequence = '') {
  const bases = sequence.toUpperCase();
  return {
    nCount: (bases.match(/N/g) || []).length,
    otherAmbiguousCount: (bases.match(OTHER_AMBIGUOUS_NUCLEOTIDES) || []).length
  };
}

export function mergeInputAmbiguityCounts(isolates) {
  return isolates.reduce((total, isolate) => {
    const counts = isolate.inputAmbiguityCounts ||
      countInputAmbiguities(isolate.originalSeq);
    total.nCount += counts.nCount;
    total.otherAmbiguousCount += counts.otherAmbiguousCount;
    return total;
  }, {nCount: 0, otherAmbiguousCount: 0});
}

export function formatStopMutations(genes, sortByGeneName) {
  return Object.keys(genes).sort(sortByGeneName).reduce((text, geneName) => {
    const stops = genes[geneName].stops || '';
    return stops.length > 0 ? `${text}${geneName}: ${stops}\n` : text;
  }, '');
}

function formatGenePositions(alignments, getPositions) {
  return alignments.map((alignment) => {
    const positions = [...new Set(getPositions(alignment))]
      .sort((a, b) => a - b);
    return positions.length ? `${alignment.gene}: ${positions.join(', ')}` : '';
  }).filter(Boolean).join('; ');
}

function getNContainingAAPositions({alignedNAs = '', firstAA, lastAA}) {
  const positions = [];
  for (let pos = 1; pos <= alignedNAs.length / 3; pos += 1) {
    if (pos < firstAA || pos > lastAA) {
      continue;
    }
    if (alignedNAs.slice((pos - 1) * 3, pos * 3).toUpperCase().includes('N')) {
      positions.push(pos);
    }
  }
  return positions;
}

export function getSequenceQualityColumns(isolate) {
  const alignments = (isolate.initialGeneAlignments || []).filter(
    ({gene}) => gene in (isolate.genes || {})
  );
  const counts = isolate.inputAmbiguityCounts ||
    countInputAmbiguities(isolate.originalSeq);

  return {
    'Frameshift positions': formatGenePositions(
      alignments, ({frameShifts = []}) => frameShifts.map(({position}) => position)
    ),
    'N nucleotide count': counts.nCount,
    'Non-N ambiguous nucleotide count': counts.otherAmbiguousCount,
    'AA positions with N': formatGenePositions(
      alignments, getNContainingAAPositions
    )
  };
}
