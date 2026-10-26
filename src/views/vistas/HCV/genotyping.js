import {GENOTYPGING_GENE_NAMES} from './constant/genes';
import {Alignment} from '../alignment/align';
import QUERY from './genotyping.graphql';

export async function genotyping(seqReport, url) {
    const partialGene = [];
    for (const seq1 of seqReport) {
        let new_seq = [];
        for (const g1 of ['NS3', 'NS4A', 'NS4B', 'NS5A_NTD', 'NS5A_CTD', 'NS5B']) {
        if (!(Object.keys(seq1.genes).includes(g1))) {
            new_seq.push('.'.repeat(100));
            continue;
        }
        let geneCut = seq1.genes[g1].alignment.geneCut;
        if (GENOTYPGING_GENE_NAMES.includes(g1)) {
            new_seq.push(geneCut);
        } else {
            new_seq.push('.'.repeat(geneCut.length));
        }
        }
        partialGene.push({
        header: seq1.IsolateID,
        sequence: new_seq.join('')
        });
    }
    let genotypingResult = await Alignment(partialGene, url, QUERY, GENOTYPGING_GENE_NAMES);
    genotypingResult = getSimpleGeneInfo(genotypingResult);

    const isolate2genotyping = genotypingResult.reduce((acc, i) => {
        acc[i.IsolateID] = {
            subtype: i.subtype,
            strain: i.strain
        };
        return acc;
    }, {});
    seqReport.forEach((i) => {
        if (Object.keys(isolate2genotyping).includes(i.IsolateID)) {
            const nextSubtype = isolate2genotyping[i.IsolateID].subtype;
            const nextStrain = isolate2genotyping[i.IsolateID].strain;
            const hasValidSubtype = (
                nextSubtype &&
                nextSubtype.trim() !== '' &&
                nextSubtype.toLowerCase() !== 'unknown'
            );
            const hasValidStrain = (
                nextStrain &&
                nextStrain.trim() !== '' &&
                nextStrain.toLowerCase() !== 'unknown'
            );

            if (hasValidSubtype) {
                i.subtype = nextSubtype;
            }
            if (hasValidStrain) {
                i.strain = nextStrain;
            }
        }
        const subtype = i.subtype || '';
        const genotypeMatch = subtype.match(/^Genotype\s+\d+/i);
        i.genotype = genotypeMatch ?
            genotypeMatch[0] :
            i.strain.replace('Hepatitis C', '').trim();
    });
    return seqReport;
}

function getSimpleGeneInfo(data) {
  const seqs = data.viewer.sequenceAnalysis;
  const alignment = seqs.map((seq) => {
    const originalSeq = seq.inputSequence.sequence;
    const bestSubtype = seq.bestMatchingSubtype?.displayWithoutDistance || '';
    const genotypeMatch = bestSubtype.match(/^(\d+)/);

    const seqInfo = {
      IsolateID: seq.inputSequence.header,
      originalSeq: originalSeq,
      virus: seq.strain.name,
      subtype: bestSubtype,
      strain: seq.strain.display || ''
    };

    return seqInfo;
  });

  return alignment;
}
