import React from 'react';
import PropTypes from 'prop-types';
import style from './style.module.scss';

InstructionPart2.propTypes = {
  uploaded: PropTypes.bool.isRequired
};

export default function InstructionPart2({uploaded}) {
  if (uploaded) {
    return <p className={style['instruction']}>
      Review the uploaded descriptive and treatment data below. If any changes are needed, edit the CSV file and upload it again. If everything is correct, click <strong>Download Genbank Files</strong>. The GenBank zip also includes one HTML report per gene, showing frameshift and stop codon positions after correction.
    </p>;
  }

  return <>
    <p className={style['instruction']}>
      <em>This step may need to be repeated more than once if required fields are left blank.</em>
    </p>
    <p className={style['instruction']}>
      On the “Preview and Edit the Descriptive Data CSV File” page, edit the downloaded CSV file to complete descriptions and treatment history for individual sequences. Submit the edited file.
    </p>
    <h3>Preview, edit, and upload the Descriptive Data CSV file</h3>
    <ol className={style['instruction-list']}>
      <li>A PID is required only when multiple samples from the same person are submitted. For example, this applies if samples were obtained from different time points or from different specimens at the same time. Otherwise, this field should be left blank.</li>
      <li>If the Cloning Method is "None", then the clone ID field should be left blank.</li>
      <li>Country, Isolate Date, Isolate Source, and Sequencing Method should only be edited if they are not the same for all sequences.</li>
      <li>The drug-resistance mutation (DRM) and quality control (QC) columns are provided solely for the users’ benefit. They are not included in the GenBank submission.</li>
      <li>
        Treatment history fields should only be edited if they are not the same for each sequence.
        <ul>
          <li>RTI: Drug Class received or 3TC, FTC, TDF, TAF, ADV, ETV, LdT</li>
          <li>Most Recent Regimen (drugs separated by &apos;/&apos;)</li>
        </ul>
      </li>
    </ol>
  </>;
}
