import React, {useState, useEffect, useCallback} from 'react';
import PropTypes from 'prop-types';

import drugs from './constant/drugs.json';

import style from './style.module.scss';
import MainTreatment from '../group_treatment/main_treatment';

import TreatmentDetails from '../group_treatment/treatment_detail';
import PrepTreatment from '../group_treatment/prep_treatment';


GroupTreatment.propTypes = {
  onSelectTreatment: PropTypes.func.isRequired
};

export default function GroupTreatment({onSelectTreatment}) {

  const [treatment, setTreatment] = useState({});

  const onChangeTreatment = useCallback((t) => {
    setTreatment(treatment => ({...treatment, ...t}));
  }, []);

  useEffect(() => {
    onSelectTreatment(treatment);
  }, [onSelectTreatment, treatment]);

  const PREP_OPTIONS = [
    {value: '', label: 'None'},
    {value: 'TFV/XTC', label: 'TFV/XTC'},
    {value: 'CAB', label: 'CAB'},
    {value: 'LEN', label: 'LEN'},
    {value: 'Unknown', label: 'Unknown'}
  ];

  const DRUGCLASSES = [
    'NRTI',
    'NNRTI',
    'PI',
    'INSTI',
    'CAI'
  ];
  const RecentRxExample = 'TDF/3TC/DTG';

  return <div className={style['treatment-group']}>
    <PrepTreatment
     onChangeTreatment={onChangeTreatment}
     PrEP_OPTIONS={PREP_OPTIONS}
     />
    <MainTreatment
     onChangeTreatment={onChangeTreatment}
     label={"ART Status"}/>
    {treatment?.mainTreatment === 'Experienced' ?
      <TreatmentDetails
       onChangeTreatment={onChangeTreatment}
       DRUGCLASSES={DRUGCLASSES}
       drugs={drugs}
       RecentRxExample={RecentRxExample}
      /> : null
    }
  </div>;
}
