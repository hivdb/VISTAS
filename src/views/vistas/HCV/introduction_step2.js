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
      <li>The Genotype and Subtype columns will be populated by the VISTAS program using ICTV reference sequences. Either column may be edited if authors have a different genotype or subtype determination.</li>
      <li>The drug-resistance mutation (DRM) and quality control (QC) columns are provided solely for the users’ benefit. They are not included in the GenBank submission.</li>
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
  </>;
}
