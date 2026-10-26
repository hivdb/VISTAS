import React, {useState, useCallback, useEffect} from 'react';
import PropTypes from 'prop-types';

import drugs from './constant/drugs.json';

import style from './style.module.scss';
import MainTreatment from '../group_treatment/main_treatment';
import TreatmentDetails from '../group_treatment/treatment_detail';

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

  const DRUGCLASSES = [
    'RTI'
  ];
  const RecentRxExample = 'ETV';

  return <div className={style['treatment-group']}>
    <MainTreatment
     onChangeTreatment={onChangeTreatment}
     label={"Treatment Status"}
    />
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
