import React, {useState, useEffect} from 'react';
import {routerShape, matchShape} from 'found';
import PropTypes from 'prop-types';

import useLocation from 'found/useLocation';
import {makeZip} from 'icosa/utils/download';

import BigData from 'icosa/utils/big-data';
import localforage from 'localforage';

import DocumentTitle from '../../../components/document-title';
import Intro, {IntroHeader} from 'icosa/components/intro';
import Modal from '../../../components/modal';
import FormsContainer from
  'icosa/components/analyze-forms/container';
import FileInput from 'icosa/components/file-input';
import Button from 'icosa/components/button';

import Instruction from './introduction_step2';

import readFile from 'icosa/utils/read-file';
import {csvParse} from '../../../utils/csv';

import {validateTable, ValidateART} from './editableTable';

import TableView from '../UI/table';
import genBankItFiles from '../bankit/gen_bankit_files';
import DownloadFiles from '../download';
import {
  makeInitialAlignmentFiles,
  makeFinalReportFiles,
  REPORT_FOLDER
} from '../alignment/frameshift_report';

import style from './style.module.scss';
import {buildNote} from './build_notes';
import { AdjustIsolateGene } from './adjust_isolate_gene';

import { sortByGeneName } from './constant/genes';
import { DRM_GENE_FULLNAME } from './constant/genes_drm';

GenBankStep2.propTypes = {
  router: routerShape.isRequired,
  match: matchShape.isRequired
};

export default function GenBankStep2({router, match}) {
  const loc = useLocation();

  const [alignments, setAlignment] = useState([]);

  const [tmpTable, setTmpTable] = useState([]);
  const [descriptions, setDescription] = useState([]);

  const [uploaded, setUploaded] = useState(false);

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {

      const {alignmentKey, tableKey} = loc.state;

      setAlignment(await BigData.load(alignmentKey));
      setDescription(await BigData.load(tableKey));
    };

    fetchData();
  }, []);


  const handleUploadFile = (filelist) => {
    const file = filelist[0];
    if (!file || !(/^text\/.+$|^application\/x-gzip$|^$/.test(file.type))) {
      return;
    }

    readFile(file)
      .then(
        (table) => {
          table += '\n'; // csvParse bug
          table = csvParse(table);
          if (table.length === 0) {
            return;
          }

          setTmpTable(table);
        }
      );
  };

  const onSubmit = async () => {
    if (alignments.length === 0) {

      let {location: {state: _, ...loc}} = match;
      const pathname = '/vistas/';
      loc = {...loc, pathname};
      router.push(loc);

      return;
    }

    if (!validateTable(tmpTable, alignments)) {
      return;
    }

    setDescription(tmpTable);
    setUploaded(true);
  };

  const downloadAlignmentReport = (event) => {
    event.preventDefault();
    const files = makeInitialAlignmentFiles(alignments);
    if (files.length > 0) {
      makeZip(`${REPORT_FOLDER}.zip`, files);
    }
  };

  const onWarning = async () => {

    if (!ValidateART(descriptions)) {
      setShowPopup(true);
      return;
    } else {
      await onNext();
    }
  };

  const onNext = async () => {
    if (alignments.length === 0) {

      let {location: {state: _, ...loc}} = match;
      const pathname = '/vistas/';
      loc = {...loc, pathname};
      router.push(loc);

      return;
    }
    if (descriptions.length === 0) {

      let {location: {state: _, ...loc}} = match;
      const pathname = '/vistas/';
      loc = {...loc, pathname};
      router.push(loc);

      return;
    }

    updateBigData(loc.state.tableKey, descriptions);

    // Build before BankIt generation, which modifies isolate genes.
    const finalReportFiles = makeFinalReportFiles(alignments);

    const [bankitSeqs, bankitFeatures] = genBankItFiles(
      alignments, descriptions, buildNote, AdjustIsolateGene,
      sortByGeneName, DRM_GENE_FULLNAME
    );

    DownloadFiles(bankitSeqs, bankitFeatures, [], finalReportFiles);

    let {location} = match;
    const pathname = '/vistas/hiv/step3';
    location = {...location, pathname};
    router.push(location);
  };

  return (<>
    <DocumentTitle pageTitle="HIVDB GenBank Submission Tool">
      <Intro>
        <IntroHeader>
          {!uploaded ?
            <h1>Preview and Edit the Descriptive Data CSV File</h1> :
            <h1>Submit the Reviewed Descriptive Data CSV file</h1>
          }
        </IntroHeader>
      </Intro>

      <Instruction uploaded={uploaded} />

      {alignments.length > 0 && <div
       id="alignment-report"
       style={{marginBottom: '1rem'}}>
        <a href="#alignment-report" onClick={downloadAlignmentReport}>
          Download alignment report
        </a>
      </div>}

      <FormsContainer className={style['form-container']}>
        <div
         className={style['analyze-base-form']}
         style={{flexDirection: 'row'}}>
          <div className={style['input-group']} style={{marginBottom: 0}}>
            <label
             className={style['input-label']}
             style={{fontSize: '1.2rem'}}
             htmlFor="desc-file">
              Upload edited CSV file:
            </label>
            <FileInput
             onChange={handleUploadFile}
             name="desc-file"
             accept={
              "text/csv," +
              ".csv"
              }
            />
            <Button
             onClick={onSubmit}
             type="submit"
             name="submit"
             btnStyle="primary">
              Submit
            </Button>
          </div>
          {uploaded ? <div style={{marginLeft: 'auto'}}>
            <Button
             onClick={onWarning}
             type="submit"
             name="submit"
             btnStyle="primary">
              Download Genbank Files
            </Button>
          </div> : null}
        </div>
      </FormsContainer>
    </DocumentTitle>

    {!uploaded ?
      <div>
        <h3>Preview, edit, and upload the Descriptive Data CSV file</h3>
        <ul>
          <li>Review the table below for completeness.</li>
          <li>Edit the CSV as needed, then upload the updated file.</li>
        </ul>
      </div> :
      <div>
        <h3>Submit the reviewed Descriptive Data CSV file</h3>
        <ul>
          <li>If the table is incomplete or needs edits, update the CSV and re-upload.</li>
          <li>If everything looks correct, click "Download Genbank Files" to get a zip with two files for the GenBank Submission Portal.</li>
          <li>Follow the included instructions to submit the files to GenBank.</li>
        </ul>
      </div>
    }
    <div className={style['table-scroll']}>
      <TableView table={descriptions} />
    </div>
    {showPopup ?
      <WarningPopup
       setShowPopup={setShowPopup}
       onNext={onNext}
      /> : null
    }
  </>);
}

async function updateBigData(key, data) {
  data = JSON.stringify(data);
  await localforage.setItem(`*${key}`, Date.now());
  await localforage.setItem(key, data);
  return key;
}

WarningPopup.propTypes = {
  setShowPopup: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired
};

export function WarningPopup({setShowPopup, onNext}) {

  const onClose = () => {
    setShowPopup(false);
  };

  return (
    <Modal onClose={onClose}>
      <p><strong>Warning:</strong> Some patients are marked ART experienced, but treatment details are missing.</p>
      <p>Do you want to continue and download the files?</p>
      <div className={style['analyze-base-form']}>
        <div className={style['analyze-base-form-buttons']}>
          <Button
           onClick={onNext}
           type="submit"
           name="submit"
           btnStyle="primary">
            Yes
          </Button>
          <Button
           onClick={onClose}
           type="reset"
           name="reset">
            No
          </Button>
        </div>
      </div>
    </Modal>
  );
}
