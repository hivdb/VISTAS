import React, {useState, useEffect} from 'react';
import ProgressBar from 'react-progressbar';
import PropTypes from 'prop-types';

import BigData from 'icosa/utils/big-data';
import {validateNoConflict, validateGeneExist} from '../alignment/validate';
import showAlertOverlay from '../alertOverlay';

import QUERY from './query.graphql';
import {DRM_GENES} from './constant/genes_drm';
import {GENE_NAMES} from './constant/genes';
import {getAlignmentReport} from '../alignment/align';
import { GENES2DRUGCLASSES } from './constant/genes_drm';
import { DRM_LIST, EASL_DRM_LIST, EASL_EXTEND_DRM_LIST } from './constant/genes_drm';
import { sortByGeneName } from './constant/genes';
import { genotyping } from './genotyping';
import genesRefs from './genes-refs-consensus.json';
import {
  alignWithFrameshiftCorrection,
  attachFrameshiftCorrection
} from '../alignment/frameshift_correction';
import {
  getPrimaryReferenceRange,
  positionIsInPrimaryRange
} from '../alignment/primary_reference_range';
import {mergeInputAmbiguityCounts} from '../alignment/sequence_quality';

Process.propTypes = {
  sequences: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired,
  mode: PropTypes.string,
};

Process.defaultProps = {
  mode: 'easl-extend',
};

function getGenotypeFromSubtype(subtype, fallbackDisplay = '') {
  const sources = [subtype, fallbackDisplay];

  for (const source of sources) {
    const match = (source || '').match(/Genotype\s+(\d+[a-zA-Z]*)/i);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function getReferenceSequence(subtype, geneName, fallbackDisplay = '') {
  const genotype = getGenotypeFromSubtype(subtype, fallbackDisplay);
  if (!genotype) {
    return null;
  }

  const normalizedGenotype = genotype.toLowerCase();
  if (normalizedGenotype === '1a' || normalizedGenotype === '1b') {
    const subtypeStrain = `hcv${normalizedGenotype}`;
    const subtypeGeneRef = genesRefs.find(
      ({strain: refStrain, gene}) => refStrain.toLowerCase() === subtypeStrain && gene === geneName
    );
    if (subtypeGeneRef?.refSequence) {
      return subtypeGeneRef.refSequence;
    }
  }

  const genotypeNumber = genotype.match(/^(\d+)/)?.[1];
  if (!genotypeNumber) {
    return null;
  }

  const strain = `HCV${genotypeNumber}`;
  const geneRef = genesRefs.find(
    ({strain: refStrain, gene}) => refStrain === strain && gene === geneName
  );

  return geneRef?.refSequence || null;
}

function getReferenceAA(referenceSequence, position, fallbackRefAA = '') {
  if (!referenceSequence || !Number.isInteger(position) || position < 1) {
    return fallbackRefAA;
  }

  const referenceAA = referenceSequence[position - 1];
  return referenceAA || fallbackRefAA;
}

function getGroupedPrettyPairwiseMutations(gene) {
  const positionLine = gene.prettyPairwise.positionLine || [];
  const refAALine = gene.prettyPairwise.refAALine || [];
  const mutationLine = gene.prettyPairwise.mutationLine || [];
  const groupedMutations = [];
  let currentGroup = null;
  let lastPosition = null;

  for (let i = 0; i < positionLine.length; i++) {
    const rawPosition = String(positionLine[i] ?? '').trim();
    const parsedPosition = rawPosition ? parseInt(rawPosition, 10) : lastPosition;

    if (!Number.isInteger(parsedPosition)) {
      continue;
    }

    lastPosition = parsedPosition;

    if (!currentGroup || currentGroup.position !== parsedPosition) {
      if (currentGroup) {
        groupedMutations.push(currentGroup);
      }
      currentGroup = {
        position: parsedPosition,
        mutationParts: [],
        refAAParts: []
      };
    }

    const mutationAA = String(mutationLine[i] ?? '').trim();
    const refAA = String(refAALine[i] ?? '').trim();

    if (mutationAA) {
      currentGroup.mutationParts.push(mutationAA);
    }
    if (refAA) {
      currentGroup.refAAParts.push(refAA);
    }
  }

  if (currentGroup) {
    groupedMutations.push(currentGroup);
  }

  const primaryRange = getPrimaryReferenceRange(gene);
  return groupedMutations.filter(
    ({position}) => positionIsInPrimaryRange(position, primaryRange)
  ).map(({position, mutationParts, refAAParts}) => {
    const mutAA = mutationParts.join('');
    const fallbackRefAA = refAAParts.join('').match(/[A-Za-z*]/)?.[0] || '';

    return {
      position,
      mutAA,
      fallbackRefAA
    };
  });
}

function hasSpecialNS3DRM(position, mutAA, refAA) {
  if (position == 36) {
    return mutAA.includes('L') && refAA != 'L';
  }

  if (position == 56) {
    return mutAA.includes('F') && refAA != 'F';
  }

  if (position == 80) {
    return mutAA.includes('Q') && refAA == 'L';
  }

  if (position == 166) {
    return mutAA.includes('S') && refAA == 'A';
  }

  if (position == 168) {
    return mutAA.includes('Q') && refAA != 'Q';
  }

  if (position == 175) {
    return mutAA.includes('L') && refAA == 'M';
  }

  return false;
}

function hasSpecialNS5ANTDDRM(position, mutAA, refAA) {
  if (position == 24) {
    return (
      (mutAA.includes('K') && refAA == 'Q') ||
      (mutAA.includes('S') && refAA != 'S') ||
      (mutAA.includes('Q') && refAA == 'K')
    );
  }

  if (position == 28) {
    return (
      (mutAA.includes('V') && refAA != 'V') ||
      (mutAA.includes('M') && refAA != 'M') ||
      (mutAA.includes('L') && refAA == 'F')
    );
  }

  if (position == 30) {
    return (
      (mutAA.includes('Q') && refAA != 'Q') ||
      (mutAA.includes('R') && refAA != 'R') ||
      (mutAA.includes('S') && refAA != 'S') ||
      (mutAA.includes('K') && refAA != 'K')
    );
  }

  if (position == 31) {
    return mutAA.includes('M') && refAA != 'M';
  }

  if (position == 58) {
    return (
      (mutAA.includes('P') && refAA == 'T') ||
      (mutAA.includes('H') && refAA == 'T')
    );
  }

  if (position == 93) {
    return mutAA.includes('T') && refAA == 'Y';
  }

  return false;
}

function hasSpecialDRM(geneName, position, mutAA, refAA) {
  if (geneName === 'NS3') {
    return hasSpecialNS3DRM(position, mutAA, refAA);
  }

  if (geneName === 'NS5A_NTD') {
    return hasSpecialNS5ANTDDRM(position, mutAA, refAA);
  }

  return false;
}

function getNormalizedIsolateID(isolateID) {
  return isolateID.split(' ')[0];
}

function mergeSequenceAnalysis(mainIso, isoList) {
  if (!mainIso.sequenceAnalysis) {
    return;
  }

  const mergedAlignedGeneSequences = [];
  const seenGenes = new Set();

  isoList.forEach((iso) => {
    const alignedGeneSequences = iso.sequenceAnalysis?.alignedGeneSequences || [];
    alignedGeneSequences.forEach((geneSeq) => {
      const geneName = geneSeq.gene?.name;
      if (!geneName || seenGenes.has(geneName)) {
        return;
      }
      seenGenes.add(geneName);
      mergedAlignedGeneSequences.push(geneSeq);
    });
  });

  mainIso.sequenceAnalysis = {
    ...mainIso.sequenceAnalysis,
    alignedGeneSequences: mergedAlignedGeneSequences
  };
}

function getMostCommonValue(values) {
  const counts = values.reduce((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

function getMergedIsolateTextValue(isoList, fieldName) {
  const values = isoList
    .map((iso) => (iso[fieldName] || '').trim())
    .filter((value) => value !== '');

  const preferredValues = values.filter((value) => value.toLowerCase() !== 'unknown');
  if (preferredValues.length > 0) {
    return getMostCommonValue(preferredValues);
  }

  return getMostCommonValue(values);
}

function mergeIsolates(isolates) {
  let isolateGroupList = isolates.reduce((acc, iso) => {
    const isoID = getNormalizedIsolateID(iso.IsolateID);
    if (isoID in acc) {
      acc[isoID].push(iso);
    } else {
      acc[isoID] = [iso];
    }
    return acc;
  }, {});

  isolateGroupList = Object.values(isolateGroupList).map((isoList) => {
    const mainIso = isoList[0];
    const frameshiftCorrections = isoList.flatMap(
      (iso) => iso.frameshiftCorrections || []
    );
    const initialGeneAlignments = isoList.flatMap(
      (iso) => iso.initialGeneAlignments || []
    );
    const finalGeneAlignments = isoList.flatMap(
      (iso) => iso.finalGeneAlignments || []
    );
    mainIso.IsolateID = getNormalizedIsolateID(mainIso.IsolateID);
    if (isoList.length === 1) {
      return [mainIso];
    }

    isoList.forEach((iso) => {
      Object.keys(iso.genes).forEach((geneName) => {
        mainIso.genes[geneName] = iso.genes[geneName];
      });
    });
    mainIso.subtype = getMergedIsolateTextValue(isoList, 'subtype');
    mainIso.strain = getMergedIsolateTextValue(isoList, 'strain');
    mergeSequenceAnalysis(mainIso, isoList);

    mainIso.originalSeq = '';
    mainIso.correctedSeq = '';
    mainIso.frameshiftCorrections = frameshiftCorrections;
    mainIso.initialGeneAlignments = initialGeneAlignments;
    mainIso.finalGeneAlignments = finalGeneAlignments;
    mainIso.inputAmbiguityCounts = mergeInputAmbiguityCounts(isoList);

    return [mainIso];
  });
  return isolateGroupList.flat();
}

function attachSequenceAnalysisToReport(seqAnalysisList, a_report) {
  const isolate2seqAnalysis = seqAnalysisList.reduce((acc, seq) => {
    acc[seq.inputSequence.header] = seq;
    return acc;
  }, {});

  return a_report.map((entry) => ({
    ...entry,
    sequenceAnalysis: isolate2seqAnalysis[entry.IsolateID]
  }));
}

function getGeneDRMs(seq, DRM_LIST, mode= "default", subtype) {
  const genesDRMs = {};
  const geneSeqs = seq.alignedGeneSequences;
  const fallbackDisplay = seq.strain?.display?.replace('Hepatitis C', '').trim() || '';

  geneSeqs.forEach((gene) => {
    const geneName = gene.gene.name;
    const drmList = DRM_LIST[geneName]; // Get the corresponding DRM list for the gene

    if (!drmList) {
      genesDRMs[geneName] = '';
      return;
    }

    const referenceSequence = getReferenceSequence(subtype, geneName, fallbackDisplay);
    const groupedMutations = getGroupedPrettyPairwiseMutations(gene);
    let matchedDRMs = new Set();

    groupedMutations.forEach(({position, fallbackRefAA, mutAA}) => {
      const refAA = getReferenceAA(referenceSequence, position, fallbackRefAA);

      if (hasSpecialDRM(geneName, position, mutAA, refAA)) {
        matchedDRMs.add(`${refAA}${position}${mutAA}`);
      }

      if (drmList[position]) {
        // Check if ANY character in mutAA is in drmDatabase[position]
        if ([...mutAA].some((char) => drmList[position].includes(char))) {
          matchedDRMs.add(`${refAA}${position}${mutAA}`);
        }

        // // Case: If mut is same as ref, check if refAA is a known DRM, if so, add
        if (mutAA === "-" && drmList[position].includes(refAA) && mode != "default") {
          matchedDRMs.add(`${refAA}${position}${refAA}`);
        }

        // Special Case: If mutAA is "Del", check if drmDatabase[position] includes "-"
        if (mutAA === "Del" && drmList[position].includes("#")) {
          matchedDRMs.add(`${refAA}${position}Del`);
        }
      }
    });

    // Store the results for this gene
    genesDRMs[geneName] =
      matchedDRMs.size > 0
        ? Array.from(matchedDRMs)
            .sort((a, b) => {
              const posA = parseInt(a.match(/\d+/)[0]);
              const posB = parseInt(b.match(/\d+/)[0]);
              return posA - posB; // Sort numerically
            })
            .join(", ")
        : "";
  });

  return genesDRMs;
}

export function update_DRM(a_report, DRM_LIST, mode= "default") {
  a_report.forEach((reportEntry) => {
    const seq = reportEntry.sequenceAnalysis;
    if (!seq) {
      return;
    }

    const genesDRMs = getGeneDRMs(seq, DRM_LIST, mode, reportEntry.subtype);

    Object.keys(genesDRMs).forEach((gene) => {
      if (reportEntry.genes?.[gene]) {
        reportEntry.genes[gene].DRMs = genesDRMs[gene];
      }
      // else {console.log(reportEntry.genes);}
    });
  });

  return a_report;
}

function normalizeGenotype(genotype) {
  const validWithLetters = ['1a', '1b']; // Keep these as-is

  if (validWithLetters.includes(genotype)) {
    return genotype; // Return full genotype
  }

  // Strip the letter (e.g., "5a" -> "5")
  const match = genotype.match(/^(\d+)/);
  return match ? match[1] : genotype; // Returns "5", "6", etc.
}

function getStrictGeneDRMs(seq, subtype, strictDrmList) {
  const genesDRMs = {};
  const geneSeqs = seq.alignedGeneSequences;

  const fallbackDisplay = seq.strain?.display?.replace('Hepatitis C', '').trim() || '';
  const normalizedGenotype = getGenotypeFromSubtype(subtype, fallbackDisplay);

  if (!normalizedGenotype) {
    geneSeqs.forEach((gene) => {
      genesDRMs[gene.gene.name] = '';
    });
    return genesDRMs;
  }

  let simple_geno = normalizeGenotype(normalizedGenotype);

  geneSeqs.forEach((gene) => {
    const geneName = gene.gene.name;
    const drmListKey = `${geneName}_${simple_geno}`; // e.g., NS5A_NTD_5
    const drmList = strictDrmList[drmListKey];
    if (!drmList) {
      genesDRMs[geneName] = '';
      return;
    }

    const referenceSequence = getReferenceSequence(subtype, geneName, fallbackDisplay);
    const groupedMutations = getGroupedPrettyPairwiseMutations(gene);

    let matchedDRMs = new Set();

    groupedMutations.forEach(({position, fallbackRefAA, mutAA}) => {
      const refAA = getReferenceAA(referenceSequence, position, fallbackRefAA);

      if (drmList[position]) {
        // Check if ANY character in mutAA is in drmlist[position]
        if ([...mutAA].some((char) => drmList[position].includes(char))) {
          matchedDRMs.add(`${refAA}${position}${mutAA}`);
        }

        // Special Case: If mutAA is "Del", check if drmDatabase[position] includes "#",
        // special char used to signal deletion since '-' is used for alignment where ref = mut
        if (mutAA === "Del" && drmList[position].includes("#")) {
          matchedDRMs.add(`${refAA}${position}Del`);
        }
      }
    });

    // Store the results for this gene
    genesDRMs[geneName] =
      matchedDRMs.size > 0
        ? Array.from(matchedDRMs)
            .sort((a, b) => {
              const posA = parseInt(a.match(/\d+/)[0]);
              const posB = parseInt(b.match(/\d+/)[0]);
              return posA - posB; // Sort numerically
            })
            .join(", ")
        : "";
  });

  return genesDRMs;
}


export function update_DRM_EASL(a_report, strictDrmList = EASL_DRM_LIST) {
  a_report.forEach((reportEntry) => {
    const seq = reportEntry.sequenceAnalysis;
    if (!seq) {
      return;
    }

    const genesDRMs = getStrictGeneDRMs(
      seq,
      reportEntry.subtype,
      strictDrmList
    );

    Object.keys(genesDRMs).forEach((gene) => {
      if (reportEntry.genes?.[gene]) {
        reportEntry.genes[gene].DRMs = genesDRMs[gene];
      }
      // else {console.log(reportEntry.genes);}
    });
  });

  return a_report;
}

export default function Process({sequences, onComplete, mode}) {
  const [progress, setProgress] = useState(0);
  const [progressNum, setProgressNum] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressLabel, setProgressLabel] = useState('Aligning');

  useEffect(() => {
    const batchSize = 20;
    const numSeqs = sequences.length;

    const fetchData = async () => {
      setProgress(0);
      setProgressNum(0);
      setProgressTotal(numSeqs);
      setProgressLabel('Aligning');

      let alignments = [];
      let url = 'https://hivdb.stanford.edu/hcv/graphql';
      let processed = 0;

      for (let i = 0; i < sequences.length; i += batchSize) {
        const querySeqs = sequences.slice(i, i + batchSize);
        const {result: a, correctionByHeader} = await alignWithFrameshiftCorrection(
          querySeqs,
          url,
          QUERY,
          GENE_NAMES
        );
        let a_report = getAlignmentReport(
          a, GENE_NAMES, GENES2DRUGCLASSES, sortByGeneName,
          {'NS3': (isolate, gene) => {
            if (isolate.genes[gene].alignment.trimmed_NA.length <= 200) {
              return false;
            } else {
              return true;
            }
          }});
        a_report = attachSequenceAnalysisToReport(a.viewer.sequenceAnalysis, a_report);
        a_report = attachFrameshiftCorrection(a_report, correctionByHeader);
        alignments = alignments.concat(a_report);

        processed += querySeqs.length;
        setProgressNum(processed);
        setProgress(parseInt(processed * 50 / numSeqs));
      }

      if (!validateGeneExist(alignments, DRM_GENES)) {
        onComplete(null);
        return;
      }

      if (!validateNoConflict(alignments)) {
        onComplete(null);
        return;
      }

      alignments = mergeIsolates(alignments);

      let alignments_with_drm = [];
      processed = 0;
      setProgressNum(0);
      setProgressTotal(alignments.length);
      setProgressLabel('Genotyping');

      for (let i = 0; i < alignments.length; i += batchSize) {
        const batchReport = alignments.slice(i, i + batchSize);
        // One sample genotyping, not per gene genotyping
        // Should do it before EASL analysis
        // Sierra HCV genotyping only by NS3, NS5A NTD and NS5B
        // If the sequences contains other genes, the genotyping would fail.
        let a_report = await genotyping(batchReport, url);

        let a_report_drm_updated;
        if (mode === "easl") {
          a_report_drm_updated = update_DRM_EASL(a_report, EASL_DRM_LIST);
        } else if (mode === "easl-extend") {
          a_report_drm_updated = update_DRM_EASL(a_report, EASL_EXTEND_DRM_LIST);
        } else {
          a_report_drm_updated = update_DRM(a_report, DRM_LIST, mode);
        }
        alignments_with_drm = alignments_with_drm.concat(a_report_drm_updated);

        processed += batchReport.length;
        setProgressNum(processed);
        setProgress(parseInt(50 + processed * 50 / alignments.length));
      }

      await BigData.clear();
      const key = await BigData.save(alignments_with_drm);
      onComplete(key);
    };

    fetchData().catch((error) => {
      console.error('HCV sequence processing failed', error);
      showAlertOverlay(`Sequence processing failed: ${error.message}`);
      onComplete(null);
    });
  }, [sequences, onComplete]);

  return (
    <div>
      <p>{progressLabel}: {progressNum} / {progressTotal} is processed</p>
      <ProgressBar
       completed={progress}
       color="#2563eb"
       height={14}
       className="sequence-progress-bar" />
    </div>
  );
}
