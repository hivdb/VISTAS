import { sortByGeneName, GENE_NAMES_GENERAL } from "./constant/genes";
import difference from 'lodash/difference';
import {splitGenes} from "../alignment/splitGenes";
import { cloneDeep } from "lodash";

const LONG_N_RUN_THRESHOLD = 11;
const PROCESS_LONG_N_RUN_THRESHOLD = 50;
const TERMINAL_AMBIGUOUS_WINDOW_SHORT = 10;
const TERMINAL_AMBIGUOUS_WINDOW_LONG = 50;
const TERMINAL_AMBIGUOUS_RATE_SHORT = 0.5;
const TERMINAL_AMBIGUOUS_RATE_LONG = 0.3;
const MAX_OVERALL_AMBIGUOUS_RATE = 0.5;

function mergeNS5A(isolate) {
  // console.log(isolate);
  let NS5A_parts = {};

  for (const g_name in isolate.genes) {
    if (g_name.startsWith('NS5A')) {
      NS5A_parts[g_name] = isolate.genes[g_name];
      isolate.genes[g_name].ignoreFeature = true;
    }
  }

  let NS5A = null;

  if (Object.keys(NS5A_parts).length != 0) {
    const NTD = NS5A_parts['NS5A_NTD'];
    const CTD = NS5A_parts['NS5A_CTD'];

    if (NTD) {
      NS5A = cloneDeep(NTD);
    } else if (CTD) {
      NS5A = cloneDeep(CTD);
    }

    if (!NS5A) {
      return isolate;
    }

    NS5A['geneName'] = 'NS5A';
    NS5A.ignoreFeature = false;

    if (CTD) {
      // for gen_bankit_files.js, featureGene
      NS5A.alignment.lastNA = CTD.alignment.lastNA;

      // featureGaps
      if (CTD.AdjustedNAgaps) {
        NS5A.AdjustedNAgaps = [
          ...(NS5A.AdjustedNAgaps || []),
          ...CTD.AdjustedNAgaps
        ];
      }

      // featureCDs or nonfunctional
      NS5A.stops += CTD.stops;
      if (!CTD.alignment.translatable) {
        NS5A.alignment.translatable = false;
      }

      // featuressemblyGaps
      NS5A.NAgaps_tailing = CTD.NAgaps_tailing;
      NS5A.NAgaps_tailing_exists = CTD.NAgaps_tailing_exists;
      isolate.genes['NS5A'] = NS5A;
    }

    // console.log(NS5A);
    // console.log(CTD);
  }

  return isolate;
}

function merge_full_genome(isolate) {
  const polyprotine = {
    'geneName': 'polyprotein',
    'geneOrder': 0,
    'stops': (
      Object.values(isolate.genes).reduce((acc, g) => acc + g.stops, [])
    ),
    'alignment': {
      'translatable': (
        Object.values(isolate.genes).map(
          (g) => g.alignment.translatable).every(v => v)
      ),
      'aligned_NA_heading': isolate.genes['CORE'].alignment.aligned_NA_heading,
      'aligned_NA_heading_pos': isolate.genes['CORE'].alignment.aligned_NA_heading_pos,
      'firstNA': Math.min(
        ...Object.values(isolate.genes).map((g) => g.alignment.firstNA)),
      'lastNA': Math.max(
        ...Object.values(isolate.genes).map((g) => g.alignment.lastNA)),
    }
  };

  isolate.genes = {
    'polyprotein': polyprotine
  };
  isolate.use_full_genome = true;

  return isolate;
}

function isolateContainsGap(isolate) {
  return Object.values(isolate.genes).reduce((acc, g) => g.NAgaps + acc, []).length > 0;
}


export function AdjustIsolateGene(isolate) {

  isolate = mergeNS5A(isolate);
  isolate.GenBankLeadingTrimCount = 0;
  isolate.GenBankRejected = false;
  const correctedOutputSeq = isolate.correctedSeq || isolate.originalSeq;

  // any sequence larger than NS3 to NS5B will treated as whole genome
  // otherwise only NS3, NS5A_NTD, NS5B will be included in final BankIt file.
  if (correctedOutputSeq?.length > 6000) {
    isolate.GenBankSeq = correctedOutputSeq;
    const genes = Object.keys(isolate.genes);

    // Some short gap exists in full genome, short one can be ignored.
    // if (difference(GENE_NAMES_GENERAL, genes).length == 0 && !isolateContainsGap(isolate)) {
    if (difference(GENE_NAMES_GENERAL, genes).length == 0) {
      isolate = merge_full_genome(isolate);
    }

    trimHighNRateEdgeTwice(isolate);
    isolate.near_full_length = true;
    return [isolate];
  }

  const genes = Object.keys(isolate.genes);
  if (difference(genes, ['NS3', 'NS5A_NTD', 'NS5B']).length > 0) {
    isolate.GenBankSeq = correctedOutputSeq;
    trimHighNRateEdgeTwice(isolate);
    isolate.full_length = false;
    return [isolate];
  }

  // default
  const splitList = [
    ['NS3'],
    ['NS5A_NTD'],
    ['NS5B']
  ];
  let isolates = splitGenes(isolate, splitList, sortByGeneName);

  isolates = isolates.map((isolate) => {
    return AdjustAlignedDRMGenes(isolate);
  });
  isolate.full_length = false;
  return isolates;
}

export function AdjustAlignedDRMGenes(isolate) {
  // Modify the start position for each gene, depends on the first gene start position.

  const sortedGeneNames = Object.keys(isolate.genes).sort(sortByGeneName);
  isolate.GenBankLeadingTrimCount = 0;
  isolate.GenBankRejected = false;

  isolate.GenBankSeq = sortedGeneNames.map((geneName) => {
      const gene = isolate.genes[geneName];
      return gene.alignment.aligned_NA;
    }).join('');
  isolate.GenBankSeq = reformatSequence(isolate.GenBankSeq);

  let startOffset = 0; // Heading Ns will be removed
  sortedGeneNames.forEach((geneName, idx) => {
    const gene = isolate.genes[geneName];
    if (idx === 0) {
      startOffset = -(gene.alignment.start_NA_pos - 1);
    }

    gene.AdjustedNAgaps = gene.NAgaps.map(([start, stop, length]) => {
      return [
        start + startOffset,
        stop + startOffset,
        length];
    });

    gene.adjustedNATailing = [
      gene.NAgaps_tailing[0] + startOffset,
      gene.NAgaps_tailing[1] + startOffset,
      gene.NAgaps_tailing[2]
    ];

    gene.alignment.AdjustedfirstNA = gene.alignment.start_NA_pos + startOffset;
    gene.alignment.AdjustedlastNA = gene.alignment.stop_NA_pos + startOffset;
    startOffset += gene.alignment.aligned_NA.length;
  });

  trimHighNRateEdgeTwice(isolate, sortedGeneNames);

  return isolate;
}

function reformatSequence(seqNA) {
  seqNA = seqNA.replace(/^\.*/, '').replace(/\.*$/, '');
  seqNA = seqNA.replace(/\./g, 'N');
  seqNA = seqNA.replace(/-/g, 'N');
  return seqNA;
}

function findLongNRuns(seq) {
  const longNRuns = [];
  const regex = new RegExp(`[Nn]{${LONG_N_RUN_THRESHOLD},}`, 'g');
  let match;

  while ((match = regex.exec(seq)) !== null) {
    longNRuns.push([match.index, match.index + match[0].length]);
  }

  return longNRuns;
}

function hasProcessableLongNRun(longNRuns) {
  return longNRuns.some(([start, end]) => (end - start) >= PROCESS_LONG_N_RUN_THRESHOLD);
}

function getProcessableLongNRuns(longNRuns) {
  return longNRuns.filter(([start, end]) => (end - start) >= PROCESS_LONG_N_RUN_THRESHOLD);
}

function selectAnchorRuns(longNRuns) {
  const processableLongNRuns = getProcessableLongNRuns(longNRuns);

  const anchorRuns = processableLongNRuns.length > 0 ?
    processableLongNRuns :
    longNRuns;

  return {
    beginningLongNRun: anchorRuns[0],
    tailingLongNRun: anchorRuns[anchorRuns.length - 1]
  };
}

function getLeadingTrimRange(seq, longNRuns) {
  if (longNRuns.length === 0) {
    return null;
  }

  return [0, longNRuns[0][1]];
}

function getTrailingTrimRange(seq, longNRuns) {
  if (longNRuns.length === 0) {
    return null;
  }

  return [longNRuns[longNRuns.length - 1][0], seq.length];
}

function getLeadingNonLongNLength(longNRuns) {
  if (longNRuns.length === 0) {
    return 0;
  }

  return longNRuns[0][0];
}

function getTrailingNonLongNLength(seq, longNRuns) {
  if (longNRuns.length === 0) {
    return 0;
  }

  return seq.length - longNRuns[longNRuns.length - 1][1];
}

function getRunLength([start, end]) {
  return end - start;
}

function chooseTrimRange(seq) {
  if (!seq) {
    return null;
  }

  const longNRuns = findLongNRuns(seq);
  if (longNRuns.length === 0) {
    return null;
  }

  const {beginningLongNRun, tailingLongNRun} = selectAnchorRuns(longNRuns);
  const leading = getLeadingTrimRange(seq, [beginningLongNRun]);
  const trailing = getTrailingTrimRange(seq, [tailingLongNRun]);
  const leadingNonLongNLength = getLeadingNonLongNLength(longNRuns);
  const trailingNonLongNLength = getTrailingNonLongNLength(seq, longNRuns);

  const sameLongNRun = (
    beginningLongNRun[0] === tailingLongNRun[0] &&
    beginningLongNRun[1] === tailingLongNRun[1]
  );

  if (sameLongNRun && leading && trailing) {
    return (leadingNonLongNLength <= trailingNonLongNLength) ?
      leading :
      trailing;
  }

  const nextTrimRanges = [];

  if (leading && getRunLength(beginningLongNRun) >= leadingNonLongNLength) {
    nextTrimRanges.push(leading);
  }
  if (trailing && getRunLength(tailingLongNRun) >= trailingNonLongNLength) {
    nextTrimRanges.push(trailing);
  }

  return nextTrimRanges;
}

function normalizeTrimRanges(trimRangeOrRanges) {
  if (!trimRangeOrRanges) {
    return [];
  }

  const ranges = Array.isArray(trimRangeOrRanges[0]) ?
    trimRangeOrRanges :
    [trimRangeOrRanges];

  return ranges
    .filter(Boolean)
    .sort((a, b) => a[0] - b[0])
    .reduce((acc, [start, end]) => {
      const last = acc[acc.length - 1];
      if (!last || last[1] < start) {
        acc.push([start, end]);
      } else {
        last[1] = Math.max(last[1], end);
      }
      return acc;
    }, []);
}

function isAmbiguousBase(base) {
  return !/[ATGCatgc]/.test(base);
}

function countAmbiguousBases(seq) {
  return [...seq].reduce(
    (count, base) => count + (isAmbiguousBase(base) ? 1 : 0),
    0
  );
}

function getLeadingTerminalAmbiguousRunTrimRange(seq) {
  if (!seq) {
    return null;
  }

  const match = seq.match(/^[^ATGCatgc]+/);
  if (!match) {
    return null;
  }

  return [0, match[0].length];
}

function getTrailingTerminalAmbiguousRunTrimRange(seq) {
  if (!seq) {
    return null;
  }

  const match = seq.match(/[^ATGCatgc]+$/);
  if (!match) {
    return null;
  }

  return [seq.length - match[0].length, seq.length];
}

function getLeadingAmbiguousTrimRange(seq, windowSize, threshold) {
  if (!seq) {
    return null;
  }

  const window = seq.slice(0, windowSize);
  if (!window) {
    return null;
  }

  const ambiguousIndexes = [...window].reduce((acc, base, idx) => {
    if (isAmbiguousBase(base)) {
      acc.push(idx);
    }
    return acc;
  }, []);

  if (
    ambiguousIndexes.length > 0 &&
    (ambiguousIndexes.length / window.length) > threshold
  ) {
    return [0, ambiguousIndexes[ambiguousIndexes.length - 1] + 1];
  }

  return null;
}

function getTrailingAmbiguousTrimRange(seq, windowSize, threshold) {
  if (!seq) {
    return null;
  }

  const windowStart = Math.max(seq.length - windowSize, 0);
  const window = seq.slice(windowStart);
  if (!window) {
    return null;
  }

  const ambiguousIndexes = [...window].reduce((acc, base, idx) => {
    if (isAmbiguousBase(base)) {
      acc.push(idx);
    }
    return acc;
  }, []);

  if (
    ambiguousIndexes.length > 0 &&
    (ambiguousIndexes.length / window.length) > threshold
  ) {
    return [windowStart + ambiguousIndexes[0], seq.length];
  }

  return null;
}

function getLeadingTerminalAmbiguousTrimRange(seq) {
  if (!seq) {
    return null;
  }

  const leadingTerminalAmbiguousRun = getLeadingTerminalAmbiguousRunTrimRange(seq);
  if (leadingTerminalAmbiguousRun) {
    return leadingTerminalAmbiguousRun;
  }

  const leadingShort = getLeadingAmbiguousTrimRange(
    seq,
    TERMINAL_AMBIGUOUS_WINDOW_SHORT,
    TERMINAL_AMBIGUOUS_RATE_SHORT
  );
  if (leadingShort) {
    return leadingShort;
  }

  const leadingLong = getLeadingAmbiguousTrimRange(
    seq,
    TERMINAL_AMBIGUOUS_WINDOW_LONG,
    TERMINAL_AMBIGUOUS_RATE_LONG
  );

  return leadingLong;
}

function getTrailingTerminalAmbiguousTrimRange(seq) {
  if (!seq) {
    return null;
  }

  const trailingTerminalAmbiguousRun = getTrailingTerminalAmbiguousRunTrimRange(seq);
  if (trailingTerminalAmbiguousRun) {
    return trailingTerminalAmbiguousRun;
  }

  const trailingShort = getTrailingAmbiguousTrimRange(
    seq,
    TERMINAL_AMBIGUOUS_WINDOW_SHORT,
    TERMINAL_AMBIGUOUS_RATE_SHORT
  );
  if (trailingShort) {
    return trailingShort;
  }

  const trailingLong = getTrailingAmbiguousTrimRange(
    seq,
    TERMINAL_AMBIGUOUS_WINDOW_LONG,
    TERMINAL_AMBIGUOUS_RATE_LONG
  );

  return trailingLong;
}

function getRemovedBasesBefore(pos, trimRanges) {
  if (!trimRanges.length || pos <= 0) {
    return 0;
  }

  return trimRanges.reduce((acc, [start, end]) => {
    const startPos = start + 1;
    const endPos = end;

    if (endPos < pos) {
      return acc + (end - start);
    }
    if (startPos < pos) {
      return acc + (pos - startPos);
    }
    return acc;
  }, 0);
}

function remapPosition(pos, trimRanges, newSeqLength) {
  if (pos <= 0) {
    return pos;
  }

  const mapped = pos - getRemovedBasesBefore(pos, trimRanges);
  return Math.min(Math.max(mapped, 1), Math.max(newSeqLength, 0));
}

function trimInterval([start, stop], trimRanges) {
  let nextStart = start;
  let nextStop = stop;

  for (const [trimStart0, trimEnd0] of trimRanges) {
    const trimStart = trimStart0 + 1;
    const trimStop = trimEnd0;

    if (trimStop < nextStart || trimStart > nextStop) {
      continue;
    }

    if (trimStart <= nextStart && trimStop >= nextStop) {
      return null;
    }

    if (trimStart <= nextStart) {
      nextStart = trimStop + 1;
    }

    if (trimStop >= nextStop) {
      nextStop = trimStart - 1;
    }
  }

  return nextStart <= nextStop ? [nextStart, nextStop] : null;
}

function shiftAndTrimGap([start, stop], trimRanges, maxStop) {
  const keptInterval = trimInterval([start, stop], trimRanges);
  if (!keptInterval) {
    return null;
  }

  const [keptStart, keptStop] = keptInterval;
  const nextStart = remapPosition(keptStart, trimRanges, maxStop);
  const nextStop = remapPosition(keptStop, trimRanges, maxStop);

  if (nextStop < 1 || nextStart > maxStop || nextStart > nextStop) {
    return null;
  }

  return [nextStart, nextStop, nextStop - nextStart + 1];
}

function applyTrimRanges(isolate, sortedGeneNames, trimRanges) {
  if (trimRanges.length === 0 || sortedGeneNames.length === 0) {
    return false;
  }

  const originalSeq = isolate.GenBankSeq || '';
  const boundedTrimRanges = trimRanges
    .map(([start, end]) => ([
      Math.max(0, start),
      Math.min(originalSeq.length, end)
    ]))
    .filter(([start, end]) => end > start);

  if (boundedTrimRanges.length === 0) {
    return false;
  }

  let cursor = 0;
  let nextSeq = '';
  boundedTrimRanges.forEach(([start, end]) => {
    nextSeq += originalSeq.slice(cursor, start);
    cursor = end;
  });
  nextSeq += originalSeq.slice(cursor);

  if (nextSeq.length >= originalSeq.length) {
    return false;
  }

  const leadingTrimmed = boundedTrimRanges[0]?.[0] === 0 ?
    boundedTrimRanges[0][1] :
    0;
  isolate.GenBankLeadingTrimCount = (
    isolate.GenBankLeadingTrimCount || 0
  ) + leadingTrimmed;

  isolate.GenBankSeq = nextSeq;
  const newSeqLength = isolate.GenBankSeq.length;

  sortedGeneNames.forEach((geneName) => {
    const gene = isolate.genes[geneName];
    const startKey = ('AdjustedfirstNA' in gene.alignment) ? 'AdjustedfirstNA' : 'firstNA';
    const stopKey = ('AdjustedlastNA' in gene.alignment) ? 'AdjustedlastNA' : 'lastNA';

    gene.alignment.AdjustedfirstNA = remapPosition(
      gene.alignment[startKey],
      boundedTrimRanges,
      newSeqLength
    );
    gene.alignment.AdjustedlastNA = remapPosition(
      gene.alignment[stopKey],
      boundedTrimRanges,
      newSeqLength
    );

    const sourceGaps = gene.AdjustedNAgaps || gene.NAgaps || [];
    gene.AdjustedNAgaps = sourceGaps.reduce((acc, gap) => {
      const nextGap = shiftAndTrimGap(gap, boundedTrimRanges, newSeqLength);
      if (nextGap) {
        acc.push(nextGap);
      }
      return acc;
    }, []);

    const sourceTailing = gene.adjustedNATailing || gene.NAgaps_tailing;
    if (sourceTailing) {
      const trimmedTailing = shiftAndTrimGap(sourceTailing, boundedTrimRanges, newSeqLength);
      gene.adjustedNATailing = trimmedTailing || [1, 0, 0];
      gene.NAgaps_tailing_exists = Boolean(
        trimmedTailing &&
        trimmedTailing[0] <= trimmedTailing[1] &&
        trimmedTailing[2] > 0
      );
    }

    if (gene.alignment.AdjustedfirstNA > gene.alignment.AdjustedlastNA) {
      gene.alignment.AdjustedfirstNA = 1;
      gene.alignment.AdjustedlastNA = 0;
    }
  });

  return true;
}

function trimOneSideUntilStable(
  isolate,
  sortedGeneNames,
  getTrimRange
) {
  let hasTrimmed = true;

  while (hasTrimmed) {
    const trimRange = getTrimRange(isolate.GenBankSeq);
    const trimRanges = normalizeTrimRanges(trimRange);
    hasTrimmed = applyTrimRanges(isolate, sortedGeneNames, trimRanges);
  }
}

function trimTerminalAmbiguousUntilStable(isolate, sortedGeneNames = Object.keys(isolate.genes).sort(sortByGeneName)) {
  trimOneSideUntilStable(
    isolate,
    sortedGeneNames,
    getLeadingTerminalAmbiguousTrimRange
  );
  trimOneSideUntilStable(
    isolate,
    sortedGeneNames,
    getTrailingTerminalAmbiguousTrimRange
  );
}

function markRejectedIfTooAmbiguous(isolate) {
  const seq = isolate.GenBankSeq || '';
  if (!seq) {
    return;
  }

  if ((countAmbiguousBases(seq) / seq.length) > MAX_OVERALL_AMBIGUOUS_RATE) {
    isolate.GenBankRejected = true;
  }
}

function trimHighNRateEdge(isolate, sortedGeneNames = Object.keys(isolate.genes).sort(sortByGeneName)) {
  const trimRanges = normalizeTrimRanges(chooseTrimRange(isolate.GenBankSeq));
  applyTrimRanges(isolate, sortedGeneNames, trimRanges);
}

function trimHighNRateEdgeTwice(isolate, sortedGeneNames = Object.keys(isolate.genes).sort(sortByGeneName)) {
  trimTerminalAmbiguousUntilStable(isolate, sortedGeneNames);
  trimHighNRateEdge(isolate, sortedGeneNames);
  trimTerminalAmbiguousUntilStable(isolate, sortedGeneNames);
  trimHighNRateEdge(isolate, sortedGeneNames);
  trimTerminalAmbiguousUntilStable(isolate, sortedGeneNames);
  markRejectedIfTooAmbiguous(isolate);
}
