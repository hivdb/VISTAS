import React, {useState, useEffect, useCallback} from 'react';
import PropTypes from 'prop-types';

import drugs from './constant/drugs.json';
import MainTreatment from './main_treatment';

import style from './style.module.scss';

import TreatmentDetails from './treatment_detail';


GroupTreatment.propTypes = {
  onSelectTreatment: PropTypes.func.isRequired
};

export default function GroupTreatment({onSelectTreatment}) {

  const [treatment, setTreatment] = useState({});

  const onChangeTreatment = useCallback((t) => {
    setTreatment(treatment => ({ ...treatment, ...t }));
  }, []);

  useEffect(() => {
    onSelectTreatment(treatment);
  }, [onSelectTreatment, treatment]);

  const DRUGCLASSES = [
    'NI',
    'NS3_I',
    'NS5A_I',
    'NNI',
  ];
  const RecentRxExample = 'GLE/PIB';

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
      />: null
    }
  </div>;
}
