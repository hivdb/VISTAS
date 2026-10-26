import React from 'react';

import DocumentTitle from '../../components/document-title';
import Intro, {IntroHeader} from 'icosa/components/intro';

import Instruction from './introduction';

export default function LandingPage() {

  return (<>
    <DocumentTitle pageTitle="HIVDB Viral Sequence and Treatment Submission (VISTAS) Program">
      <Intro>
        <IntroHeader>
          <h1>HIVDB Viral Sequence and Treatment Submission (VISTAS) Program Overview</h1>
        </IntroHeader>
      </Intro>
    </DocumentTitle>

    <Instruction />

  </>);
}
