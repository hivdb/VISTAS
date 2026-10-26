import {Alignment} from './align';
import {
  getPrimaryReferenceRange,
  positionIsInPrimaryRange
} from './primary_reference_range';
import {countInputAmbiguities} from './sequence_quality';

// How many unaligned input bases may sit between two aligned bases. Sierra
// drops frameshift-inserted bases from prettyPairwise, so they show up here.
const MAX_SKIPPED_BASES = 6;
const START_SEARCH_WINDOW = 9;
const START_ANCHOR_LENGTH = 12;

// Local Sierra builds add each frameshift insertion as its own entry, with a
// blank position and '^' marks in the mutation line.
function isFrameshiftInsertion(prettyPairwise, index) {
  const position = (prettyPairwise.positionLine || [])[index] || '';
  const mutation = (prettyPairwise.mutationLine || [])[index] || '';
  return position.trim() === '' && mutation.includes('^');
}

function isGap(char) {
  return char === '-' || char === '.';
}

function isFullGap(codon) {
  return codon.length > 0 && codon.split('').every(isGap);
}

function findAlignedStart(sequence, lineBases, firstNA) {
  const upperSeq = sequence.toUpperCase();
  for (let size = START_ANCHOR_LENGTH; size >= 3; size -= 3) {
    const anchor = lineBases.slice(0, size).toUpperCase();
    if (anchor.length === 0) {
      return -1;
    }
    for (let offset = 0; offset <= START_SEARCH_WINDOW; offset += 1) {
      for (const start of [firstNA - 1 - offset, firstNA - 1 + offset]) {
        if (start >= 0 && upperSeq.startsWith(anchor, start)) {
          return start;
        }
      }
    }
  }
  return -1;
}

// Map a gene's aligned codons back onto the input sequence. Sierra's
// firstNA/lastNA do not always match the bases in alignedNAsLine, so the
// input range is found by walking the aligned bases.
//
// Returns the input range [start, end), the corrected bases for that range
// (frameshift insertions removed, bases missing from partial codons filled
// with N, whole deleted codons left out), a map from each input position in
// the range to its offset in the corrected bases, and the corrected
// alignedNAsLine. Returns null when the codons cannot be mapped.
export function mapGeneToSequence(sequence, gene) {
  const prettyPairwise = gene.prettyPairwise || {};
  const primaryRange = getPrimaryReferenceRange(gene);
  let currentPosition = null;
  const lineIndexes = (prettyPairwise.alignedNAsLine || [])
    .map((_, index) => index)
    .filter((index) => {
      const position = parseInt((prettyPairwise.positionLine || [])[index], 10);
      if (Number.isInteger(position)) {
        currentPosition = position;
      }
      return (
        positionIsInPrimaryRange(currentPosition, primaryRange) &&
        !isFrameshiftInsertion(prettyPairwise, index)
      );
    });
  const codons = lineIndexes.map(
    (index) => prettyPairwise.alignedNAsLine[index].replace(/\s/g, '')
  );
  const lineBases = codons.join('').replace(/[-.]/g, '');
  const start = findAlignedStart(sequence, lineBases, gene.firstNA);
  if (start < 0) {
    return null;
  }

  const upperSeq = sequence.toUpperCase();
  const offsets = [];
  let corrected = '';
  let pos = start;

  for (const codon of codons) {
    if (isFullGap(codon)) {
      continue;
    }
    for (const char of codon) {
      if (isGap(char)) {
        corrected += 'N';
        continue;
      }
      let skipped = 0;
      while (pos < sequence.length && upperSeq[pos] !== char.toUpperCase()) {
        offsets.push(corrected.length);
        pos += 1;
        skipped += 1;
        if (skipped > MAX_SKIPPED_BASES) {
          return null;
        }
      }
      if (pos >= sequence.length) {
        return null;
      }
      offsets.push(corrected.length);
      corrected += sequence[pos];
      pos += 1;
    }
  }

  const correctedLine = (prettyPairwise.alignedNAsLine || [])
    .map((codon) => (
      isFullGap(codon.trim()) ? codon : codon.replace(/[-.]/g, 'N')
    ))
    .filter((_, index) => !isFrameshiftInsertion(prettyPairwise, index));

  return {start, end: pos, corrected, offsets, correctedLine};
}

// Build a function that maps a 1-based input position to the corrected
// sequence.
function makePositionMapper(replacements) {
  return (position) => {
    const index = position - 1;
    let delta = 0;
    for (const {start, end, corrected, offsets} of replacements) {
      if (index < start) {
        break;
      }
      if (index < end) {
        return start + delta + offsets[index - start] + 1;
      }
      delta += corrected.length - (end - start);
    }
    return position + delta;
  };
}

// Correct frameshifts locally from a single Sierra alignment. The returned
// `correctedAnalysis` is the same Sierra result rewritten to match the
// corrected sequence, so no second alignment is needed.
export function correctFrameshifts(sequenceAnalysis) {
  const originalSequence = sequenceAnalysis.inputSequence.sequence;
  const genes = sequenceAnalysis.alignedGeneSequences || [];
  const replacements = [];
  const uncorrected = [];

  genes
    .filter((gene) => {
      const primaryRange = getPrimaryReferenceRange(gene);
      return (gene.frameShifts || []).some(
        ({position}) => positionIsInPrimaryRange(position, primaryRange)
      );
    })
    .forEach((gene) => {
      const mapped = mapGeneToSequence(originalSequence, gene);
      if (!mapped) {
        uncorrected.push(gene.gene.name);
        return;
      }
      replacements.push({gene, ...mapped});
    });

  replacements.sort((a, b) => a.start - b.start);
  for (let i = 1; i < replacements.length; i += 1) {
    if (replacements[i].start < replacements[i - 1].end) {
      uncorrected.push(replacements[i].gene.gene.name);
      replacements.splice(i, 1);
      i -= 1;
    }
  }

  let correctedSequence = '';
  let cursor = 0;
  replacements.forEach(({start, end, corrected}) => {
    correctedSequence += originalSequence.slice(cursor, start) + corrected;
    cursor = end;
  });
  correctedSequence += originalSequence.slice(cursor);

  const mapPosition = makePositionMapper(replacements);
  const replacementByGene = new Map(
    replacements.map((replacement) => [replacement.gene, replacement])
  );

  const correctedAnalysis = {
    ...sequenceAnalysis,
    inputSequence: {
      ...sequenceAnalysis.inputSequence,
      sequence: correctedSequence
    },
    alignedGeneSequences: genes.map((gene) => {
      const replacement = replacementByGene.get(gene);
      if (!replacement) {
        return {
          ...gene,
          firstNA: mapPosition(gene.firstNA),
          lastNA: mapPosition(gene.lastNA)
        };
      }
      const newStart = mapPosition(replacement.start + 1);
      return {
        ...gene,
        firstNA: newStart,
        lastNA: newStart + replacement.corrected.length - 1,
        frameShifts: [],
        prettyPairwise: {
          ...gene.prettyPairwise,
          alignedNAsLine: replacement.correctedLine,
          positionLine: (gene.prettyPairwise.positionLine || []).filter(
            (_, index) => !isFrameshiftInsertion(gene.prettyPairwise, index)
          ),
          refAALine: (gene.prettyPairwise.refAALine || []).filter(
            (_, index) => !isFrameshiftInsertion(gene.prettyPairwise, index)
          ),
          mutationLine: (gene.prettyPairwise.mutationLine || []).filter(
            (_, index) => !isFrameshiftInsertion(gene.prettyPairwise, index)
          )
        }
      };
    })
  };

  return {
    originalSequence,
    correctedSequence,
    correctedAnalysis,
    uncorrectedGenes: uncorrected,
    corrections: replacements.map(({gene, start, end, corrected}) => ({
      gene: gene.gene.name,
      firstNA: start + 1,
      lastNA: end,
      originalLength: end - start,
      correctedLength: corrected.length,
      frameShifts: gene.frameShifts
    }))
  };
}

// Place each codon of a Sierra alignment at its reference position.
// Codon and frameshift insertions have a blank position and are skipped, so
// every sequence of the same gene has the same length.
export function getReferenceAlignedNAs(gene) {
  const geneLength = gene.gene.length;
  const {positionLine = [], alignedNAsLine = []} = gene.prettyPairwise || {};
  const primaryRange = getPrimaryReferenceRange(gene);
  const codons = new Array(geneLength).fill('---');

  positionLine.forEach((pos, index) => {
    const aaPos = parseInt(pos, 10);
    if (
      !Number.isInteger(aaPos) || aaPos < 1 || aaPos > geneLength ||
      !positionIsInPrimaryRange(aaPos, primaryRange)
    ) {
      return;
    }
    codons[aaPos - 1] = (alignedNAsLine[index] || '')
      .replace(/\s/g, '')
      .padEnd(3, '-')
      .slice(0, 3);
  });

  return codons.join('');
}

export function getGeneAlignments(sequenceAnalysis) {
  return (sequenceAnalysis.alignedGeneSequences || []).map((gene) => {
    const primaryRange = getPrimaryReferenceRange(gene);
    return {
      gene: gene.gene.name,
      firstAA: primaryRange.firstAA,
      lastAA: primaryRange.lastAA,
      alignedNAs: getReferenceAlignedNAs(gene),
      frameShifts: (gene.frameShifts || []).filter(
        ({position}) => positionIsInPrimaryRange(position, primaryRange)
      ),
      stopCodons: (gene.mutations || [])
        .filter(
          (mut) => mut.hasStop &&
            positionIsInPrimaryRange(mut.position, primaryRange)
        )
        .map(({position, shortText}) => ({position, text: shortText}))
    };
  });
}

// Align once with Sierra and correct frameshifts locally. The result is
// rewritten to match the corrected sequences, so everything downstream reads
// one consistent alignment.
export async function alignWithFrameshiftCorrection(
  querySeqs,
  url,
  query,
  geneNames
) {
  const result = await Alignment(querySeqs, url, query, geneNames);
  const correctionByHeader = {};

  result.viewer.sequenceAnalysis = result.viewer.sequenceAnalysis.map(
    (seq) => {
      const correction = correctFrameshifts(seq);
      correctionByHeader[seq.inputSequence.header] = {
        ...correction,
        initialGeneAlignments: getGeneAlignments(seq),
        finalGeneAlignments: getGeneAlignments(correction.correctedAnalysis)
      };
      return correction.correctedAnalysis;
    }
  );

  return {result, correctionByHeader};
}

export function attachFrameshiftCorrection(report, correctionByHeader) {
  return report.map((entry) => {
    const correction = correctionByHeader[entry.IsolateID];
    if (!correction) {
      return entry;
    }

    return {
      ...entry,
      originalSeq: correction.originalSequence,
      correctedSeq: correction.correctedSequence,
      inputAmbiguityCounts: countInputAmbiguities(correction.originalSequence),
      frameshiftCorrections: correction.corrections,
      initialGeneAlignments: correction.initialGeneAlignments,
      finalGeneAlignments: correction.finalGeneAlignments
    };
  });
}
