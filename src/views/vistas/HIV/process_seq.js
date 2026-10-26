import React, {useState, useEffect} from 'react';
import ProgressBar from 'react-progressbar';
import {getAlignmentReport} from '../alignment/align';
import PropTypes from 'prop-types';

import BigData from 'icosa/utils/big-data';
import {validateNoConflict, validateGeneExist, mergeIsolates} from '../alignment/validate';
import showAlertOverlay from '../alertOverlay';
import { GENE_NAMES, GENE_NAMES_HIV2 } from './constant/genes';
import { DRM_GENES } from './constant/genes_drm';
import QUERY from './query.graphql';
import {GENES2DRUGCLASSES} from './constant/genes_drm';
import { sortByGeneName } from './constant/genes';
import {
  alignWithFrameshiftCorrection,
  attachFrameshiftCorrection
} from '../alignment/frameshift_correction';


Process.propTypes = {
  sequences: PropTypes.array.isRequired,
  onComplete: PropTypes.func.isRequired
};


// TODO rename to ProcessSequence
export default function Process({sequences, organism, onComplete}) {
  const [progress, setProgress] = useState(0);
  const [progressNum, setProgressNum] = useState(0);

  let url = 'https://hivdb.stanford.edu/graphql';
  let geneNames = GENE_NAMES;

  if (organism === 'HIV2') {
    url = 'https://hivdb.stanford.edu/hiv2/graphql';
    geneNames = GENE_NAMES_HIV2;
  }

  useEffect(() => {
    const batchSize = 20;
    const numSeqs = sequences.length;
    let processed = 0;

    const fetchData = async () => {
      setProgress(0);
      setProgressNum(0);

      let alignments = [];

      for (let i = 0; i < sequences.length; i += batchSize) {
        const querySeqs = sequences.slice(i, i + batchSize);

        const {result, correctionByHeader} = await alignWithFrameshiftCorrection(
          querySeqs,
          url,
          QUERY,
          geneNames
        );
        let a = getAlignmentReport(
          result,
          geneNames,
          GENES2DRUGCLASSES,
          sortByGeneName
        );
        a = attachFrameshiftCorrection(a, correctionByHeader);

        alignments = alignments.concat(a);

        processed += querySeqs.length;

        setProgressNum(processed);
        setProgress(parseInt(processed * 100 / numSeqs));
      }

      // Require the submission contains PR or RT or IN for drug resistance analysis, at least

      if (!validateGeneExist(alignments, DRM_GENES)) {
        onComplete(null);
        return;
      }

      if (!validateNoConflict(alignments)) {
        onComplete(null);
        return;
      }

      alignments = mergeIsolates(alignments);

      await BigData.clear();
      const key = await BigData.save(alignments);
      onComplete(key);
    };

    fetchData().catch((error) => {
      console.error('HIV sequence processing failed', error);
      showAlertOverlay(`Sequence processing failed: ${error.message}`);
      onComplete(null);
    });
  }, [sequences, onComplete]);

  return (
    <div>
      <p>{progressNum} / {sequences.length} is processed</p>
      <ProgressBar
       completed={progress}
       color="#2563eb"
       height={14}
       className="sequence-progress-bar" />
    </div>
  );
}
