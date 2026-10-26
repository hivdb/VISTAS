import React from 'react';
import PropTypes from 'prop-types';
import BigData from 'icosa/utils/big-data';
import {makeDownload} from 'icosa/utils/download';
import {makeCSV} from '../download';
import {parseFasta} from '../fasta';

import DocumentTitle from '../../../components/document-title';
import Intro, {IntroHeader} from 'icosa/components/intro';

import FormsContainer from
  'icosa/components/analyze-forms/container';
import BaseForm from '../base';
import FileInput from 'icosa/components/file-input';
import readFile from 'icosa/utils/read-file';

import Instruction from './introduction_step1';
import ProcessSequence from './process_seq';
import GroupDescription from './group_description';
import GroupTreatment from './group_treatment';
import {generateEditableTable} from './editableTable';
import {Today} from '../HIV/constant/date';

import style from './style.module.scss';

import showAlertOverlay from '../alertOverlay';

function getRandomUUID() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function appendUUIDToFastaHeaders(rawSequence) {
  return rawSequence.split('\n').map((line) => {
    if (!line.startsWith('>')) {
      return line;
    }

    const header = line.slice(1).trim();
    return `>${header} ${getRandomUUID()}`;
  }).join('\n');
}


export default class GenBankStep1 extends React.Component {

  static propTypes = {
    router: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
  };

  constructor() {
    super(...arguments);
    this.state = {
      rawSequence: '',
      sequences: [],
      alignmentKey: null,
      tableKey: null,
      groupTreatment: {},
      groupDesc: {},
      isSubmit: false,
    };
  }

  handleUploadSeq = (filelist) => {
    const file = filelist[0];
    if (!file || !(/^text\/.+$|^application\/x-gzip$|^$/.test(file.type))) {
      return;
    }
    readFile(file)
      .then(
        async (rawSequence) => {
          rawSequence = rawSequence.trim();
          if (!rawSequence.startsWith('#') && !rawSequence.startsWith('>')) {
            return;
          }
          rawSequence = appendUUIDToFastaHeaders(rawSequence);

          const sequences = parseFasta(rawSequence, 'userinput', false);
          this.setState({sequences, rawSequence});
        }
      );
  };

  onEditingSeq = (e) => {
    let rawSequence = e.target.value;
    if (!rawSequence.startsWith('#') && !rawSequence.startsWith('>')) {
      showAlertOverlay('Sequences are not in FASTA format, please check.');
    }
    const sequences = parseFasta(rawSequence, 'userinput');
    this.setState({sequences, rawSequence});
  };

  onSubmit = async () => {
    if (this.state.sequences.length === 0) {
      showAlertOverlay('Please upload sequence file.');
      return [false, {}, {}];
    }

    const conflictHeaders = this.state.sequences.filter(
      (i) => i.header.includes('conflict')
    );

    if (conflictHeaders.length > 0) {
      showAlertOverlay('Duplicated IsolateID. Please check your sequence file.');
      return [false, {}, {}];
    }


    if (this.state.alignmentKey) {
      const {alignmentKey, groupDesc, groupTreatment} = this.state;


      await this.onCompleteDownload(alignmentKey, groupDesc, groupTreatment);
      return [false, {}, {}];
    }

    this.setState({isSubmit: true});

    return [false, {}, {}];
  };

  onReset = (e) => {
    e.preventDefault();
    this.setState({
      rawSequence: '',
      sequences: [],
      alignmentKey: null,
      tableKey: null,
      isSubmit: false
    });
  };

  onComplete = async (alignmentKey) => {
    if (alignmentKey === null) {
      this.setState({isSubmit: false});
      return;
    }
    this.setState({alignmentKey});
    const {groupDesc, groupTreatment} = this.state;

    await this.onCompleteDownload(alignmentKey, groupDesc, groupTreatment);
  };

  onCompleteDownload = async (alignmentKey, groupDesc, groupTreatment) => {

    const alignments = await BigData.load(alignmentKey);
    const table = generateEditableTable(
      alignments,
      groupTreatment,
      groupDesc
    );

    const tableKey = await BigData.save(table);

    await makeDownload(
      `DescriptiveData_${groupDesc.organism}_${Today()}.csv`,
      'text/csv',
      makeCSV(table)
    );

    this.setState({tableKey});

    let {location: {state: _, ...loc}} = this.props.match;
    const pathname = '/vistas/hcv/step2';
    const state = {alignmentKey, tableKey};
    loc = {...loc, state, pathname};
    this.props.router.push(loc);
  };

  onUpdateGroupTreatment = (groupTreatment) => {
    this.setState({groupTreatment});
  };

  onUpdateGroupDesc = (groupDesc) => {
    this.setState({groupDesc});
  };


  render() {
    const {isSubmit} = this.state;

    return (<>
      <DocumentTitle pageTitle="HIVDB GenBank Submission Tool">
        <Intro>
          <IntroHeader>
            <h1>Process for submitting HCV sequences and metadata</h1>
          </IntroHeader>
        </Intro>

        <Instruction />

        <section className={style['submission-guide']}>
          <h3>Sequence upload &amp; Descriptive data shared by all sequences</h3>
          <p>GenBank requires three types of information: (1) Sequences, (2) Sequence features, and (3) descriptive data (referred to as Source Modifiers by GenBank). In this step, the sequence features required by GenBank will be determined from the FASTA file. A CSV file of descriptive data will be generated and become available for possible further editing.</p>
          <p><strong>Descriptive data:</strong> (1) Organism: HCV; (2) Isolate Source: e.g., plasma, liver; (3) Country: an approved name in the INSDC Geographic Location List; (4) Isolate Date: YYYY or YYYY-MM-DD; (5) Clone Method: Molecular, Single genome amplification (SGA), Unique molecular IDs (UMI), or None; (6) Sequencing Method: Sanger, Illumina, Oxford Nanopore, Ion Torrent, PacBio; (7) NGS Threshold: Threshold for reporting mixed nucleic acids in the consensus sequence: e.g., 20%, 10%, 5%, 1%; (8) Treatment status: DAA-experienced versus DAA-naïve; (9) DAA classes received; (10) Individual DAAs received; (11) Most recent DAA regimen.</p>
          <p>After indicating that the sequences are DAA-experienced, drop-down boxes for DAA-class experience and a field for the most recent regimen will appear. Please provide as much DAA history as possible, including the most recent regimen composed of the selected options. Separate drug names with &apos;/&apos;.</p>
          <p>A unique isolate ID (UID) will be generated using the sequence header prefix in the FASTA file. The UID will link the sequence to the data in the CSV descriptive data file.</p>
          <p>Separate genes can be concatenated if they are continuous. However, if there is a long gap between gene sequences, they should be submitted separately in different FASTA records (within the same file) using either the same UID or the same UID followed by an underscore plus the gene name (e.g. Sample10_NS3 and Sample10_NS5A). Full genome sequences can be submitted as a single FASTA record.</p>
        </section>

        <FormsContainer className={style['form-container']}>
          <BaseForm
           onSubmit={this.onSubmit} onReset={this.onReset}
           resetDisabled={isSubmit}
           submitDisabled={isSubmit}
           to={'/vistas'}
           >
            <div
             className={style['input-group']}
             style={{
               borderBottom: '1px solid black',
               paddingBottom: '5px'
             }}>
              <label
               className={style['input-label']}
               style={{fontSize: '1.2rem'}}
               htmlFor="fasta-file">
                Upload sequence file:
              </label>
              <FileInput
               onChange={this.handleUploadSeq}
               name="fasta-file"
               accept={
                "application/x-gzip,text/plain,text/x-fasta," +
                ".fasta,.fas,.fna"
               }
              />

            </div>

            <div className={style['detail-controls']}>
              <GroupDescription onSelectDesc={this.onUpdateGroupDesc} />

              <div className={style['treatment-group']}>
                <GroupTreatment onSelectTreatment={this.onUpdateGroupTreatment} />
              </div>
            </div>
          </BaseForm>
        </FormsContainer>

        {isSubmit ?
          <div className={style['processing-progress']}>
            <p className={style['processing-status']}>Processing sequences…</p>
            <ProcessSequence
             sequences={this.state.sequences}
             onComplete={this.onComplete}
             mode="easl-extend"
             isSubmit={isSubmit} />
          </div> : null
        }
      </DocumentTitle>
      <section className={style['submission-guide']}>
        <h2>Step 2: Edit and upload the CSV file</h2>
        <p><em>This step may need to be repeated more than once if required fields are left blank.</em></p>
        <p>On the “Preview and Edit the Descriptive Data CSV File” page, edit the downloaded CSV file to complete descriptions and treatment history for individual sequences. Submit the edited file.</p>
        <h3>Preview, edit, and upload the Descriptive Data CSV file</h3>
        <ol>
          <li>A PID is required only when multiple samples from the same person are submitted. For example, this applies if samples were obtained from different time points or from different specimens at the same time. Otherwise, this field should be left blank.</li>
          <li>If the Cloning Method is &quot;None&quot;, then the clone ID field should be left blank.</li>
          <li>Country, Isolate Date, Isolate Source, and Sequencing Method should only be edited if they are not the same for all sequences.</li>
          <li>The Genotype and Subtype columns will be populated by the VISTAS program using ICTV reference sequences. Either column may be edited if authors have a different genotype or subtype determination.</li>
          <li>The drug-resistance mutation (DRM) and quality control (QC) columns are provided solely for the users&apos; benefit. They are not included in the GenBank submission.</li>
          <li>
            DAA history fields should only be edited if they are not the same for each sequence.
            <ul>
              <li>NI: Drug Class received or SOF</li>
              <li>NS3_I: Drug Class received or GLE, VOX, PTV, GZR</li>
              <li>NS5A_I: Drug Class received or LDV, VEL, PIB, DCV, OBV, EBR</li>
              <li>NNI: Drug Class received or DSV</li>
              <li>Most Recent Regimen (drugs separated by &apos;/&apos;)</li>
            </ul>
          </li>
        </ol>
        <h2>Step 3: Submit the final descriptive data CSV file</h2>
        <ol>
          <li>Upload the final CSV file.</li>
          <li>Click “Download GenBank files” to obtain a zip file containing two files:
            <ul>
              <li><code>Feature.txt</code>: a file containing sequence features such as gene ranges and gaps.</li>
              <li><code>Seq.fasta</code>: a FASTA file in which the descriptive data have been placed in the sequence header.</li>
            </ul>
          </li>
        </ol>
      </section>
      <div className={style['submission-guide']}>
        <h2>Abbreviations</h2>
        <p><strong>Isolate Source Abbreviations</strong></p>
        <ul>
          <li>PBMC: Peripheral Blood Mononuclear Cells</li>
          <li>DBS: Dried Blood Spot</li>
          <li>CSF: Cerebrospinal Fluid</li>
        </ul>

        <p><strong>Clone Method Abbreviations</strong></p>
        <ul>
          <li>SGA: Single genome amplification</li>
          <li>UMI: Unique molecular IDs</li>
        </ul>

        <p><strong>Drug Classes and Abbreviations</strong></p>
        <ul>
          <li>
            <strong>Nucleos(t)ide NS5B Inhibitors (NI)</strong>:
            Sofosbuvir (SOF)
          </li>
          <li>
            <strong>NS3 Inhibitors (NS3_I)</strong>:
            Glecaprevir (GLE), Voxilaprevir (VOX), Paritaprevir (PTV),
            Grazoprevir (GZR)
          </li>
          <li>
            <strong>NS5A Inhibitors (NS5A_I)</strong>:
            Ledipasvir (LDV), Velpatasvir (VEL), Pibrentasvir (PIB),
            Daclatasvir (DCV), Ombitasvir (OBV), Elbasvir (EBR)
          </li>
          <li>
            <strong>Nonnucleoside NS5B Inhibitors (NNI)</strong>:
            Dasabuvir (DSV)
          </li>
        </ul>



      </div>

    </>);
  }
}
