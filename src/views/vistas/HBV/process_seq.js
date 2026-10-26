import React, {useState, useEffect} from 'react';
import ProgressBar from 'react-progressbar';
import PropTypes from 'prop-types';

import BigData from 'icosa/utils/big-data';
import {validateNoConflict, validateGeneExist, mergeIsolates} from '../alignment/validate';
import showAlertOverlay from '../alertOverlay';
import QUERY from './query.graphql';
import {DRM_GENES} from './constant/genes_drm';
import {GENE_NAMES} from './constant/genes';
import {getAlignmentReport} from '../alignment/align';
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


export default function Process({sequences, onComplete}) {
  const [progress, setProgress] = useState(0);
  const [progressNum, setProgressNum] = useState(0);

  useEffect(() => {
    const batchSize = 20;
    const numSeqs = sequences.length;
    let processed = 0;

    const fetchData = async () => {
      setProgress(0);
      setProgressNum(0);

      let alignments = [];
      let url = 'https://hivdb.stanford.edu/hbv/graphql';

      for (let i = 0; i < sequences.length; i += batchSize) {
        const querySeqs = sequences.slice(i, i + batchSize);
        const {result, correctionByHeader} = await alignWithFrameshiftCorrection(
          querySeqs,
          url,
          QUERY,
          GENE_NAMES
        );
        let a = getAlignmentReport(
          result,
          GENE_NAMES,
          GENES2DRUGCLASSES,
          sortByGeneName
        );
        a = attachFrameshiftCorrection(a, correctionByHeader);

        alignments = alignments.concat(a);

        processed += querySeqs.length;

        setProgressNum(processed);
        setProgress(parseInt(processed * 100 / numSeqs));
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

      await BigData.clear();
      const key = await BigData.save(alignments);
      onComplete(key);
    };

    fetchData().catch((error) => {
      console.error('HBV sequence processing failed', error);
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
