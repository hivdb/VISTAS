import {
  getPrimaryReferenceRange,
  positionIsInPrimaryRange
} from './primary_reference_range';

export async function Alignment(sequences, url, QUERY, geneNames) {
  const seqs = sequences.map(item => {
    delete item['size'];
    return item;
  });

  const request = new Request(
    url,
    {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        operationName: 'align',
        query: QUERY,
        variables: {
          sequences: seqs,
          geneNames: geneNames
        }
      })
    }
  );

  const resp = await fetch(request);
  const {data} = await resp.json();
  return data;
}


export function getAlignmentReport(
  data,
  geneNames, GENES2DRUGCLASSES, sortByGeneName,
  GeneSelector={}) {

  const seqs = data.viewer.sequenceAnalysis;
  const alignment = getAlignmentForSeqs(
    seqs, geneNames, GENES2DRUGCLASSES, sortByGeneName);
  return CutShortGene(alignment, GeneSelector);
}


function getAlignmentForSeqs(seqs, geneNames, GENES2DRUGCLASSES, sortByGeneName) {
  const alignment = seqs.map((seq) => {
    const originalSeq = seq.inputSequence.sequence;
    const geneSeqs = seq.alignedGeneSequences;
    const genesDRMs = get_genes_DRMs(seq, GENES2DRUGCLASSES);

    const records = geneSeqs.map((gene, index) => {
      const primaryRange = getPrimaryReferenceRange(gene);
      const geneMutations = gene.mutations.filter(
        ({position}) => positionIsInPrimaryRange(position, primaryRange)
      );
      const geneName = gene.gene.name;

      const mutations = geneMutations.map(
        (mut) => {
          return mut.shortText;
        }
      );

      const ambiMutations = geneMutations.filter(
        (mut) => {
          return mut.isAmbiguous;
        }
      ).map(
        (mut) => {
          return mut.shortText;
        }
      );

      const unusualMutations = geneMutations.filter(
        (mut) => {
          return mut.isUnusual;
        }
      ).map(
        (mut) => {
          return mut.shortText;
        }
      );

      const DRMs = genesDRMs[geneName];

      const APOBECs = geneMutations.filter(
        (mut) => {
          return mut.isApobecMutation;
        }
      ).map(
        (mut) => {
          return mut.shortText;
        }
      );

      const insertions = geneMutations.filter(
        (mut) => {
          return mut.isInsertion;
        }
      ).map(
        (mut) => {
          return mut.shortText;
        }
      );

      const deletions = geneMutations.filter(
        (mut) => {
          return mut.isDeletion;
        }
      ).map(
        (mut) => {
          return mut.position;
        }
      );

      const stops = geneMutations.filter(
        (mut) => {
          return mut.hasStop;
        }
      ).map(
        (mut) => {
          return mut.shortText;
        }
      );

      const gaps = getGaps(deletions);

      const tailing_gaps = [
          (primaryRange.lastAA < gene.gene.length) ?
            primaryRange.lastAA * 3 + 1 : gene.gene.length * 3,
          gene.gene.length * 3,
          (gene.gene.length - primaryRange.lastAA) * 3,
      ];
      const has_tailing_gaps = (gene.gene.length > primaryRange.lastAA);

      let record = {
        geneName: geneName,

        geneOrder: geneNames.indexOf(geneName),

        mutations: mutations.join(', '),
        'num_mutations': mutations.length,

        DRMs: DRMs,

        unusuals: unusualMutations.join(', '),
        'num_unusual': unusualMutations.length,

        apobecs: APOBECs.join(', '),
        'num_apobecs': APOBECs?.length || '',

        'num_ambiguous': ambiMutations.length,

        apobec_unusual: [APOBECs.join(', '), unusualMutations.join(', ')].join(' / ') || '',

        insertions: insertions.join(', '),
        num_insertions: insertions.length,
        deletions: deletions.join(', '),
        num_deletions: deletions.length,

        gaps: gaps.map(
          ([start, stop, length]) => `[${start}-${stop}] (${length})`
        ).join('\n'),
        NAgaps_tailing: tailing_gaps,
        NAgaps_tailing_exists: has_tailing_gaps,
        AAgaps: gaps,
        NAgaps: getNAGaps(gaps), // gaps within a gene
        stops: stops.join(', '),

        alignment: getNASeq(gene, originalSeq)
      };

      if (record.NAgaps.filter((g) => (g.slice(-1) % 3 != 0)).length > 0) {
        record.alignment.translatable = false;
        record.alignment.untrans_reason = 'untranslatable';
      }

      return record;

    });

    const geneInfo = records.reduce((acc, item) => {
      acc[item.geneName] = item;
      return acc;
    }, {});

    const seqInfo = {
      IsolateID: seq.inputSequence.header,
      originalSeq: originalSeq,
      virus: seq.strain.name,
      subtype: seq.bestMatchingSubtype?.displayWithoutDistance || '',
      strain: seq.strain.display || '',
      genes: geneInfo
    };

    return seqInfo;
  });

  return alignment;
}

function CutShortGene(isolates, GeneSelector={}) {
  isolates = isolates.map((isolate) => {
    isolate.genes = Object.keys(isolate.genes).reduce((acc, gene) => {
      if (Object.keys(GeneSelector).length > 0 && gene in GeneSelector) {
        if (GeneSelector[gene](isolate, gene)) {
          acc[gene] = isolate.genes[gene];
        }
        return acc;
      }

      // If the number of deletion is larger than half length of the gene, the gene will be ignored.
      if (isolate.genes[gene].num_deletions > isolate.genes[gene].alignment.gene_AA_length / 2) {
        // console.log(isolate.genes[gene], isolate.genes[gene].num_deletions, "aa_len");
        return acc;
      }
      // TODO, sierra aligment issue
      // If length of the gene is less than half length of the gene, the gene will be ignored.
      if (isolate.genes[gene].alignment.geneCut.length < isolate.genes[gene].alignment.gene_AA_length / 2) {
        // console.log(isolate.genes[gene], isolate.genes[gene].alignment.geneCut.length, "gene_cut");
        return acc;
      }

      if (isolate.genes[gene].alignment.trimmed_NA.length > 150) {
        acc[gene] = isolate.genes[gene];
      }
      return acc;
    }, {});

    return isolate;
  });
  isolates = isolates.filter((isolate)=>Object.keys(isolate.genes).length > 0);
  return isolates;
}


function get_genes_DRMs(seq, GENES2DRUGCLASSES) {

  if (seq.drugResistance) {
    // drugResistance returns one group per gene in a list
    const drms = seq.drugResistance.reduce((acc, drm) => {
      acc[drm.gene.name] = drm;
      return acc;
    }, {});

    const DRMs = Object.entries(GENES2DRUGCLASSES).reduce((geneDRMs, [geneName, drugClasses]) => {
      geneDRMs[geneName] = drugClasses.reduce((klsDRMs, dc) => {
        const mutationsByTypes = drms[geneName]?.mutationsByTypes.filter(
          (g) => ([dc, 'Major', 'Accessory'].includes(g.mutationType))
        ) || [];

        klsDRMs[dc] = mutationsByTypes.reduce((group, muts) => {
          group = [...group, ...muts.mutations.map((m) => m.shortText)];
          return group;
        }, []);

        return klsDRMs;
      }, {});

      return geneDRMs;

    }, {});
    return DRMs;
  }

  const DRMs = Object.entries(GENES2DRUGCLASSES).reduce((geneDRMs, [geneName, drugClasses]) => {
    const drms = seq.DRMs.filter(
      (drm) => drm.gene.name === geneName).map((drm) => {
        drm.drugClasses = drm.gene.drugClasses.map((d) => d.name);
        return drm;
      });

    geneDRMs[geneName] = drugClasses.reduce((klsDRMs, dc) => {
      const mutationsByTypes = drms.filter((drm) => drm.drugClasses.includes(dc));
      klsDRMs[dc] = mutationsByTypes.map((drm) => drm.shortText);
      return klsDRMs;
    }, {});

    return geneDRMs;
  }, {});

  return DRMs;
}


export function getNASeq(gene, originalSeq) {

  const geneAALength = gene.gene.length;
  const geneNALength = geneAALength * 3;

  // firstNA is based on the original sequence cut
  // firstAA is based on the alignment, the start of aligned original pos
  const firstNA = gene.firstNA;
  const lastNA = gene.lastNA;
  const geneCut = originalSeq.slice(firstNA - 1, lastNA);

  const primaryRange = getPrimaryReferenceRange(gene);
  let currentPosition = null;
  let entries = gene.prettyPairwise.positionLine.reduce(
    (result, rawPosition, index) => {
      const position = parseInt(rawPosition, 10);
      if (Number.isInteger(position)) {
        currentPosition = position;
      }
      if (positionIsInPrimaryRange(currentPosition, primaryRange)) {
        result.push({
          position: Number.isInteger(position) ? position : null,
          codon: gene.prettyPairwise.alignedNAsLine[index]
        });
      }
      return result;
    }, []
  );

  let AAPositions = entries
    .map(({position}) => position)
    .filter(Number.isInteger);
  let trimmedSeqNA = entries.map(({codon}) => codon);

  // Remove heading and tailing untranslatable codon
  if (trimmedSeqNA[0].includes('-')) {
    trimmedSeqNA = trimmedSeqNA.slice(1);
    AAPositions.shift();
  }

  if (trimmedSeqNA[trimmedSeqNA.length - 1].includes('-')) {
    trimmedSeqNA = trimmedSeqNA.slice(0, -1);
    AAPositions.pop();
  }

  trimmedSeqNA = trimmedSeqNA.join('');

  const startAAPos = Math.min(...AAPositions);
  const startNAPos = startAAPos * 3 - 2;

  const stopAAPos = Math.max(...AAPositions);
  const stopNAPos = trimmedSeqNA.length + startNAPos - 1;

  const alignedNALength = trimmedSeqNA.length;

  // Use dot not '-' or 'N', for future trim
  const prepend = '.'.repeat(startNAPos - 1);
  const append = '.'.repeat(Math.max(geneNALength - stopNAPos, 0));
  const alignedNA = prepend + trimmedSeqNA + append;


  let untransReason = '';

  if ((startNAPos % 3) !== 1) {
    untransReason = 'start NA pos not aligned to codon';
  }
  else if (alignedNALength % 3 !== 0) {
    untransReason = 'stop NA pos not aligned to codon';
  }
  else if (trimmedSeqNA.length % 3 !== 0) {
    untransReason = 'untranslatable';
  }

  // TODO: check geneCut is the same as the original sequence. maybe convert to the same length
  // TODO: rename the keys here for clarity

  return {
    // gene basic info
    'gene_AA_length': geneAALength,
    'gene_NA_length': geneNALength,

    // alignment info
    'start_AA_pos': startAAPos,
    'start_NA_pos': startNAPos,
    'stop_AA_pos': stopAAPos,
    'stop_NA_pos': stopNAPos,
    'gene_AA_range': `${startAAPos} ~ ${stopAAPos}`,

    'N in seq': trimmedSeqNA.includes('.') ? 'yes' : '',
    'del in seq': trimmedSeqNA.includes('-') ? 'yes' : '',
    translatable: !untransReason ? 1 : 0,
    'untrans_reason': untransReason,
    'trimmed_NA': trimmedSeqNA,

    'aligned_NA': alignedNA,
    'aligned_NA_heading': (
      alignedNA.length - alignedNA.replace(/^\.*/, '').length),
    'aligned_NA_heading_pos': (
      alignedNA.length - alignedNA.replace(/^\.*/, '').length + 1),
    'aligned_NA_tailing': (
      alignedNA.length - alignedNA.replace(/\.*$/, '').length),
    'aligned_NA_tailing_pos': alignedNA.replace(/\.*$/, '').length,


    'geneCut': geneCut,
    'firstNA': firstNA,
    'lastNA': lastNA,
  };

}

function getGaps(deletions) {
  deletions.sort();
  const gaps = [];
  let group = [];
  let previous = null;

  deletions.forEach((current) => {
    if (previous !== null && current - previous !== 1) {
      if (group.length > 0) {
        const start = group[0];
        const stop = group[group.length - 1];
        gaps.push([start, stop, stop - start + 1]);
      }
      group = [];
    }
    group.push(current);
    previous = current;
  });

  if (group.length > 0) {
    const start = group[0];
    const stop = group[group.length - 1];
    gaps.push([start, stop, stop - start + 1]);
  }

  return gaps;
}

function getNAGaps(AAGaps) {
  return AAGaps.map(([start, stop, gapL]) => {
    start = start * 3 - 2;
    stop = stop * 3;
    gapL = gapL * 3;
    return [start, stop, gapL];
  });
}

function parseGap(gap) {
  const regex = /\[(\d+)-(\d+)\] \((\d+)\)/;
  const match = gap.match(regex);

  const start = parseInt(match[1]);
  const stop = parseInt(match[2]);
  const length = parseInt(match[3]);

  return [start, stop, length];
}

function getBetweenGaps(seqs) {
  const gapList = [];
  let seqLengthAcc = 0;
  let indexA = 0;
  while (indexA < seqs.length) {
    const indexB = indexA + 1;
    if (indexB === seqs.length) {
      break;
    }

    const g1 = seqs[indexA];
    const g2 = seqs[indexB];
    const gapL = g1.aligned_NA_tailing + g2.aligned_NA_heading;

    if (gapL) {
      const start = seqLengthAcc + g1['aligned_NA_tailing_pos'] + 1;
      const stop = (
        seqLengthAcc + g1['gene_NA_length'] + g2['aligned_NA_heading_pos'] - 1);
      gapList.push([start, stop, gapL]);
    }

    seqLengthAcc += g1.gene_NA_length;

    indexA += 1;
  }

  return gapList;
}
