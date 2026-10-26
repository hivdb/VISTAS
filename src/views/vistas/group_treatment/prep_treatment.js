import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';

import style from './style.module.scss';

import Select from 'react-select';


PrepTreatment.propTypes = {
    onChangeTreatment: PropTypes.func.isRequired,
    PrEP_OPTIONS: PropTypes.array.isRequired
};


export default function PrepTreatment({
    onChangeTreatment, PrEP_OPTIONS
}) {

    const [prep, setPrep] = useState(PrEP_OPTIONS[0]);
    const label = 'PrEP:';

    useEffect(() => {
      onChangeTreatment({prep: prep.value});
    }, [onChangeTreatment, prep]);

    return (
      <div className={style['input-group']}>
        <label
         className={style['input-label']}
         htmlFor="prep">
          {label}
        </label>
        <Select
         className={style['selection']}
         name='prep'
         value={prep}
         options={PrEP_OPTIONS}
         onChange={setPrep}
        />
      </div>
    );
  }
