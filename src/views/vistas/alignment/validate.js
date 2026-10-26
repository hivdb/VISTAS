import difference from 'lodash/difference';
import showAlertOverlay from '../alertOverlay';
import {mergeInputAmbiguityCounts} from './sequence_quality';

function getNormalizedIsolateID(isolateID) {
  return isolateID.split(' ')[0];
}


export function validateNoConflict(isolates) {
  // TODO rename to `validateIsolateGeneNameConflict`
  const isoGroup = isolates.reduce((acc, iso) => {

    Object.keys(iso.genes).forEach((geneName) => {
      const gene = iso.genes[geneName];
      const isolate_gene = `${getNormalizedIsolateID(iso.IsolateID)}_${gene.geneName}`;
      if (isolate_gene in acc) {
        acc[isolate_gene].push(iso);
      } else {
        acc[isolate_gene] = [iso];
      }
    });
    return acc;
  }, {});

  const dupSeqIsolate = Object.keys(isoGroup).reduce((dup, key) => {
    if (isoGroup[key].length > 1) {
      dup[key] = isoGroup[key];
    }
    return dup;
  }, {});

  if (Object.keys(dupSeqIsolate).length > 0) {
    let dupGene = Object.keys(dupSeqIsolate).reduce((acc, name) => {
      const [isolateName, gene] = name.split('_');
      if (isolateName in acc) {
        acc[isolateName].push(gene);
      } else {
        acc[isolateName] = [gene];
      }
      return acc;
    }, {});

    dupGene = Object.entries(dupGene).map(([isolateName, genes]) => {
      genes = [...new Set(genes)];
      return `${isolateName} (${genes.join(', ')})`;
    }).join('; ');
    showAlertOverlay(`Isolate: ${dupGene} have duplicated genes`);
    return false;
  }
  return true;
}

export function mergeIsolates(isolates, mergeGenes) {
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

    delete mainIso.originalSeq;
    delete mainIso.correctedSeq;
    mainIso.frameshiftCorrections = frameshiftCorrections;
    mainIso.initialGeneAlignments = initialGeneAlignments;
    mainIso.finalGeneAlignments = finalGeneAlignments;
    mainIso.inputAmbiguityCounts = mergeInputAmbiguityCounts(isoList);

    return [mainIso];
  });
  return isolateGroupList.flat();
}

// TODO: may be not need, or check PR, RT, IN only
export function validateGeneExist(isolates, geneNameList) {

  isolates = isolates.filter((iso) => {
    return geneNameList.some(name => name in iso.genes);
  });

  if (isolates.length === 0) {
    showAlertOverlay(`${geneNameList.join(', ')} genes are not found, or they're too short, please check your FASTA file.`);
    return false;
  }

  return true;
}
