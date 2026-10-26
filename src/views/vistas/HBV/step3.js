import React from 'react';

import DocumentTitle from '../../../components/document-title';
import Intro, {IntroHeader} from 'icosa/components/intro';

import Instruction from './introduction_step3';

export default function GenBankStep3() {
  return (<>
    <DocumentTitle pageTitle="HBV GenBank submission instructions">
      <Intro>
        <IntroHeader>
          <h1>Instructions on GenBank Submission</h1>
        </IntroHeader>
      </Intro>
    </DocumentTitle>

    <Instruction />
  </>);
}
