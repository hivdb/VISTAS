import React from 'react';

import ExtLink from 'icosa/components/link/external';
import Link from 'icosa/components/link';

import style from './style.module.scss';


export default function InstructionPart3() {
  return <div className={style['instruction3']}>
    {/* <h2>Instructions on GenBank Submission</h2> */}
    <p>Go to the Submission Portal web page: <ExtLink href={"https://submit.ncbi.nlm.nih.gov/"}>https://submit.ncbi.nlm.nih.gov/</ExtLink>.</p>
    <ul>
      <li>Go to <em>Submission Portal - GenBank</em>.</li>
      <li>Click <em>Submit</em>, sign in, and then click <em>New submission</em>.</li>
    </ul>
    <ol>
      <li><strong>Submission type</strong>: Choose <em>virus</em>, then <em>any other virus</em>, then <em>Original (most common)</em>, and then click <em>Continue</em>.</li>
      <li><strong>Submitter</strong>: Complete Affiliation and Contact information then click <em>Continue</em>.</li>
      <li><strong>Sequencing technology</strong>: Check <em>Method</em>. For NGS, select the platform and choose the radio button for <em>Assembly state</em>, then <em>Assembly information</em> for Assembly program name and version. Click <em>Continue</em>.</li>
      <li><strong>Sequences</strong>: (1) Choose <em>Release following processing</em> or provide a "Release Date". (2) For <em>Sequences</em>, choose "genomic DNA" if the sequenced virus was a provirus (e.g., from peripheral blood mononuclear cells); choose "genomic RNA" for plasma samples. (3) Select "No" unless your sequences are complete genomes, then select "Yes". (5) Upload the <em>Seq.fasta</em> file. For NGS data, this file contains consensus sequences. Click <em>Continue</em>.</li>
      <li><strong>Source Modifiers</strong>: All required information is in the uploaded FASTA file. Click <em>Continue</em>.</li>
      <li><strong>Features</strong>: Check <em>Add features by file upload</em>, then check <em>5-column tab-delimited feature table</em>, and then upload the <em>Feature.txt</em> file. Click <em>Continue</em>, then click <em>Accept</em>. In <em>Features Overview</em>, click <em>Continue</em>.</li>
      <li><strong>References</strong>: Enter (1) Sequence Authors, (2) Publication Status, and (3) Reference Authors. Then click <em>Continue</em>.</li>
      <li><strong>Review & submit</strong>: If you used the tool-generated files, you should be able to click <em>Submit</em>. You will then receive a confirmation email.</li>
    </ol>

    <p>
      If you have any questions, please send us your request via email (
      <Link
        data-email={'hivdbteam@lists.stanford.edu'}
        href={`mailto:hivdbteam@lists.stanford.edu`}>
        hivdbteam@lists.stanford.edu</Link>).
    </p>

  </div>;
}
