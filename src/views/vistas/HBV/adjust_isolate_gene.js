import {sortByGeneName} from "./constant/genes";
import difference from 'lodash/difference';

export function AdjustIsolateGene(isolate) {
  const correctedOutputSeq = isolate.correctedSeq || isolate.originalSeq;
  // HBV feature 2 conditions
  // 1. RT only
  // 2. the sequence is longer than RT NA length 344 * 3 close to 1100

  if (correctedOutputSeq?.length > 1100) {
    isolate.GenBankSeq = correctedOutputSeq;
    isolate.near_full_length = true;
    return [isolate];
  }

  delete isolate.genes.P;
  delete isolate.genes.S;

  isolate = AdjustAlignedDRMGenes(isolate);
  return [isolate];
}


function AdjustAlignedDRMGenes(isolate) {

  isolate.GenBankSeq = Object.keys(isolate.genes)
    .sort(sortByGeneName).map((geneName) => {
      const gene = isolate.genes[geneName];
      return gene.alignment.aligned_NA;
    }).join('');
  isolate.GenBankSeq = reformatSequence(isolate.GenBankSeq);

  let startOffset = 0; // Heading Ns will be removed
  Object.keys(isolate.genes).sort(sortByGeneName).forEach((geneName, idx) => {
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

  return isolate;
}


function reformatSequence(seqNA) {
  seqNA = seqNA.replace(/^\.*/, '').replace(/\.*$/, '');
  seqNA = seqNA.replace(/\./g, 'N');
  seqNA = seqNA.replace(/-/g, 'N');
  return seqNA;
}
