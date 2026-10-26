import React, {useState, useEffect} from 'react';
// import {routerShape, matchShape} from 'found';

// import useLocation from 'found/useLocation';
// import BigData from 'icosa/utils/big-data';

import DocumentTitle from '../../../components/document-title';
import Intro, {IntroHeader} from 'icosa/components/intro';

// import FormsContainer from
//   'icosa/components/analyze-forms/container';
// import Button from 'icosa/components/button';

// import DownloadFiles from './download';

import Instruction from './introduction_step3';

// import style from './style.module.scss';

// GenBankStep3.propTypes = {
//   router: routerShape.isRequired,
//   match: matchShape.isRequired
// };

// export default function GenBankStep3({router, match}) {
export default function GenBankStep3() {
  // const loc = useLocation();
  // const [alignments, setAlignment] = useState([]);
  // const [descriptions, setDescription] = useState([]);

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const {alignmentKey, tableKey} = loc.state;
  //     setAlignment(await BigData.load(alignmentKey));
  //     setDescription(await BigData.load(tableKey));
  //   };

  //   fetchData();
  // });


  // const onSubmit = async () => {
  //   if (alignments.length === 0) {

  //     let {location: {state: _, ...loc}} = match;
  //     const pathname = '/vistas/';
  //     loc = {...loc, pathname};
  //     router.push(loc);

  //     return;
  //   }

  //   if (descriptions.length === 0) {
  //     alert('Please upload edited CSV file.');
  //     return;
  //   }

  //   const bankitFeatures = generateFeatureTable(alignments);

  //   let bankitSeqs = generateBankItFile(alignments, descriptions);

  //   DownloadFiles(bankitSeqs, bankitFeatures);

  //   return [false, {}, {}];
  // };

  return (<>
    <DocumentTitle pageTitle="HIVDB GenBank Submission Tool">
      <Intro>
        <IntroHeader>
          <h1>Instructions on GenBank Submission</h1>
        </IntroHeader>
      </Intro>

      {/* <FormsContainer className={style['form-container']}>
        <div
         className={style['analyze-base-form']}
         style={{flexDirection: 'row'}}>
          <div>
            <Button
             onClick={onSubmit}
             type="submit"
             name="submit"
             btnStyle="primary">
              Download GenBank submission files
            </Button>
          </div>
        </div>
      </FormsContainer> */}
    </DocumentTitle>

    <Instruction />

  </>);
}
