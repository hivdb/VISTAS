import { sortByGeneName } from "./constant/genes";
import difference from 'lodash/difference';
import {splitGenes} from "../alignment/splitGenes";

export function AdjustIsolateGene(isolate) {
  const correctedOutputSeq = isolate.correctedSeq || isolate.originalSeq;
  // any sequence contains gag + pol + start of env will treated as whole genome
  // otherwise only CA, PR, RT, IN will be included in final BankIt file.
  if (correctedOutputSeq?.length > 5500) {
    isolate.GenBankSeq = correctedOutputSeq;
    isolate.near_full_length = true;
    return [isolate];
  }

  if (isolate.genes.gag) {
    delete isolate.genes.gag;
  }

  if (isolate.genes.vif) {
    delete isolate.genes.vif;
  }

  let isolates = [];
  let splitList = [
    ['CA'],
    ['PR', 'RT', 'IN']
  ];
  if (isolate.genes.RT?.alignment.stop_AA_pos < 500 || !isolate.genes.RT) {
    splitList = [
      ['CA'],
      ['PR', 'RT'],
      ['IN']
    ];
  }

  isolates = splitGenes(isolate, splitList, sortByGeneName);

  isolates = isolates.map((isolate) => {

    if (!Object.keys(isolate.genes).includes('RT') && Object.keys(isolate.genes).includes('PR') && Object.keys(isolate.genes).includes('IN')) {
      let RT_gene = {};
      RT_gene.alignment = {};
      RT_gene.alignment.aligned_NA = 'N'.repeat(560 * 3);
      RT_gene.alignment.start_NA_pos = 1;
      RT_gene.alignment.stop_NA_pos = 560 * 3;
      RT_gene.NAgaps = [];
      RT_gene.NAgaps_tailing = [1, 560 * 3, 560 * 3];
      RT_gene.missing = true;
      isolate.genes.RT = RT_gene;
    }

    return AdjustAlignedDRMGenes(isolate);
  });
  return isolates;
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
