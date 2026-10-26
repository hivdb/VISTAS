import React from 'react';

import style from './style.module.scss';

export default function Instruction() {
  return <>
    <h2 className={style['step-heading']}>
      Step 1: Upload a FASTA file and complete the initial form
    </h2>
    <ol className={style['instruction-list']}>
      <li>Upload a FASTA sequence file.</li>
      <li>Complete the form to provide descriptions and treatment history applicable to all or nearly all sequences.</li>
      <li>Click Submit. The program aligns the sequences and downloads a CSV file for editing if metadata differ among individual sequences.</li>
    </ol>
    <p className={style['instruction']}>
      <strong>Note:</strong> Frameshifts are corrected automatically. In Step 2, you can download a ZIP with one HTML report per gene, showing frameshift and stop codon positions for each isolate before correction.
    </p>
  </>;
}
