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
import {Today} from './constant/date';

import style from './style.module.scss';

import showAlertOverlay from '../alertOverlay';


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
      isSubmit: false
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

          rawSequence = rawSequence.split('\n').map((line) => {
            if (!line.startsWith('>')) {
              return line;
            } else {
              const items = line.split(" ");
              if (items[0] === '>') {
                return items[0] + items[1];
              } else {
                return items[0];
              }
            }
          });
          rawSequence = rawSequence.join('\n');

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

  // TODO change alignmentKey to storage key
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

    const table = generateEditableTable(alignments, groupTreatment, groupDesc);

    const tableKey = await BigData.save(table);

    await makeDownload(
      `DescriptiveData_${groupDesc.organism}_${Today()}.csv`,
      'text/csv',
      makeCSV(table)
    );

    this.setState({tableKey});

    let {location: {state: _, ...loc}} = this.props.match;
    const pathname = '/vistas/hiv/step2';
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

    let organism = this.state.groupDesc?.organism;

    return (<>
      <DocumentTitle pageTitle="HIVDB GenBank Submission Tool">
        <Intro>
          <IntroHeader>
            <h1>Process for submitting HIV sequences and metadata</h1>
          </IntroHeader>
        </Intro>

        <Instruction />

        <section className={style['submission-guide']}>
          <h3>Sequence upload &amp; Descriptive data shared by all sequences</h3>
          <p>GenBank requires three types of information: (1) Sequences, (2) Sequence features, and (3) descriptive data (referred to as Source Modifiers by GenBank). In this step, the sequence features required by GenBank will be determined from the FASTA file. A CSV file of descriptive data will be generated and become available for possible further editing.</p>

          <p><strong>Descriptive data:</strong> (1) Organism: HIV1 or HIV2; (2) Isolate Source: e.g., plasma, peripheral blood mononuclear cells (PBMC); (3) Country: an approved name in the INSDC Geographic Location List; (4) Isolate Date: YYYY or YYYY-MM-DD; (5) Clone Method: Molecular, Single genome amplification (SGA), Unique molecular IDs (UMI), or None; (6) Sequencing Method: Sanger, Illumina, Oxford Nanopore, Ion Torrent, PacBio; (7) NGS Threshold: Threshold for reporting mixed nucleic acids in the consensus sequence: e.g., 20%, 10%, 5%, 1%; (8) PrEP: None, TFV/XTC, CAB, LEN, Unknown; (9) Antiretroviral treatment (ART) data: Only select those options relevant to all submitted sequences; individual ART history can be modified in the next step.</p>

          <p>After indicating that the sequences are ART-experienced, drop-down boxes for ART-class experience and a field for the most recent regimen will appear. Please provide as much ART history as possible, including the most recent regimen composed of the selected options. Separate drug names with &apos;/&apos;.</p>

          <p>A unique isolate ID (UID) will be generated using the sequence header prefix in the FASTA file. The UID will link the sequence to the data in the CSV descriptive data file.</p>

          <p>Separate genes can be concatenated if they are continuous. However, if there is a long gap between gene sequences, they should be submitted separately in different FASTA records (within the same file) using either the same UID or the same UID followed by an underscore plus the gene name (e.g. Sample10_PRRT and Sample10_IN).</p>
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
              <GroupDescription
               onSelectDesc={this.onUpdateGroupDesc}/>
              <GroupTreatment
               onSelectTreatment={this.onUpdateGroupTreatment}/>
            </div>

          </BaseForm>
        </FormsContainer>

        {isSubmit ?
          <div className={style['processing-progress']}>
            <p className={style['processing-status']}>Processing sequences…</p>
            <ProcessSequence
             sequences={this.state.sequences}
             organism={organism}
             onComplete={this.onComplete}
             isSubmit={isSubmit} />
          </div> : null
        }
      </DocumentTitle>

      <section className={style['submission-guide']}>
        <h2>Step 2: Edit and upload the CSV file</h2>
        <p><em>This step may need to be repeated more than once if required fields are left blank.</em></p>
        <p>On the “Preview and Edit the Descriptive Data CSV File” page, edit the downloaded CSV file to complete descriptions and ART history for individual sequences. Submit the edited file.</p>

        <h3>Preview, edit, and upload the Descriptive Data CSV file</h3>
        <ol>
          <li>A PID is required only when multiple samples from the same person are submitted. For example, this applies if samples were obtained from different time points or from different specimens at the same time. Otherwise, this field should be left blank.</li>
          <li>If the Cloning Method is &quot;None&quot;, then the clone ID field should be left blank.</li>
          <li>Country, Isolate Date, Isolate Source, and Sequencing Method should only be edited if they are not the same for all sequences.</li>
          <li>The Subtype column will be populated by the HIVDB drug resistance interpretation program. It should be edited if authors have a different subtype determination.</li>
          <li>The drug-resistance mutation (DRM) and quality control (QC) columns are provided solely for the users&apos; benefit. They are not included in the GenBank submission.</li>
          <li>
            ART history fields should only be edited if they are not the same for each sequence.
            <ul>
              <li>PrEP: TFV/XTC, CAB, Unknown, or None</li>
              <li>NRTI: Drug Classes received or XTC (3TC/FTC), TFV (TDF/TAF), ABC, AZT, Other</li>
              <li>NNRTI: Drug Classes received or DOR, EFV, ETR, NVP, RPV</li>
              <li>PI: Drug Classes received or ATV (ATV/b-ATV), DRV (b-DRV), LPV (LPV/r), Other</li>
              <li>INSTI: Drug Classes received or BIC, CAB, DTG, EVG, RAL</li>
              <li>CAI: Drug Classes received or LEN</li>
              <li>Most Recent Regimen (drugs separated by &apos;/&apos;)</li>
            </ul>
          </li>
        </ol>

        <h2>Step 3: Submit the final descriptive data CSV file</h2>
        <ol>
          <li>Upload the final CSV file.</li>
          <li>
            Click “Download GenBank files” to obtain a zip file containing two files:
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
            <strong>Nucleoside Reverse Transcriptase Inhibitors (NRTI)</strong>:
            Lamivudine (3TC), Emtricitabine (FTC), Tenofovir Disoproxil Fumarate (TDF),
            Tenofovir Alafenamide (TAF), Abacavir (ABC), Zidovudine (AZT),
            Didanosine (DDI), Stavudine (D4T), Zalcitabine (DDC), XTC (3TC/FTC).
          </li>
          <li>
            <strong>Non-Nucleoside Reverse Transcriptase Inhibitors (NNRTI)</strong>:
            Doravirine (DOR), Efavirenz (EFV), Etravirine (ETR),
            Nevirapine (NVP), Rilpivirine (RPV).
          </li>
          <li>
            <strong>Protease Inhibitors (PI)</strong>:
            Atazanavir boosted (ATV, b-ATV), Darunavir boosted (DRV, b-DRV),
            Lopinavir boosted with Ritonavir (LPV, LPV/r).
          </li>
          <li>
            <strong>Integrase Strand Transfer Inhibitors (INSTI)</strong>:
            Bictegravir (BIC), Cabotegravir (CAB), Dolutegravir (DTG),
            Elvitegravir (EVG), Raltegravir (RAL).
          </li>
          <li>
            <strong>Capsid Inhibitors (CAI)</strong>: Lenacapavir (LEN).
          </li>
        </ul>
      </div>

    </>);
  }
}
