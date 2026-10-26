import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';

import style from './style.module.scss';

import Select from 'react-select';


MainTreatment.propTypes = {
  onChangeTreatment: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired
};


export default function MainTreatment({onChangeTreatment, label}) {
  const OPTIONS = [
    {value: 'Naive', label: 'Naive'},
    {value: 'Experienced', label: 'Experienced'},
    {value: 'Unknown', label: 'Unknown'}
  ];
  const [mainTreatment, setMainTreatment] = useState(OPTIONS[0]);

  useEffect(() => {
    onChangeTreatment({mainTreatment: mainTreatment.value});
  }, [onChangeTreatment, mainTreatment]);

  return (
    <div className={style['input-group']}>
      <label
       className={style['input-label']}
       htmlFor="main-treatment">
        {label}
      </label>
      <Select
       className={style['selection']}
       name="main-treatment"
       value={mainTreatment}
       options={OPTIONS}
       onChange={setMainTreatment}
       placeholder="Select main treatment..."
      />
    </div>);
}
