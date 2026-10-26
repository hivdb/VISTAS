import React from 'react';

import style from './style.module.scss';
import Button from 'icosa/components/button';

export default function Instruction() {

  const handleStartHIV = () => {
    window.location.href = '/vistas/hiv/step1';
  };

  const handleStartHBV = () => {
    window.location.href = '/vistas/hbv/step1';
  };
  const handleStartHCV = () => {
    window.location.href = '/vistas/hcv/step1';
  };

  return <div className={style['instruction']}>
    <p>The Viral Sequence and Treatment Submission (VISTAS) program prepares HIV, HBV, or HCV sequences of the targets of antiviral therapy and associated metadata for the GenBank Submission Portal.</p>
    <p>The program generates:</p>
    <ol>
      <li>
        <strong>Aligned sequence files</strong> with headers that include descriptions and treatment history
        <ol>
          <li>HIV protease, RT, integrase, and/or capsid</li>
          <li>HBV RT</li>
          <li>HCV NS3, NS5A, and/or NS5B</li>
        </ol>
      </li>
      <li><strong>Sequence feature files</strong> containing gene ranges and gaps</li>
    </ol>

    <div className={style['main-button']}>
      <Button
       onClick={handleStartHIV}
       type="submit"
       name="submit"
       btnStyle="primary">
        Start HIV Submission
      </Button>
      <Button
       onClick={handleStartHBV}
       type="submit"
       name="submit"
       btnStyle="primary">
        Start HBV Submission
      </Button>
      <Button
       onClick={handleStartHCV}
       type="submit"
       name="submit"
       btnStyle="primary">
        Start HCV Submission
      </Button>
    </div>

  </div>;
}
