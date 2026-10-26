import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import style from './style.module.scss';


SelectDrug.propTypes = {
  drugname: PropTypes.string.isRequired,
  onSelectDrug: PropTypes.func.isRequired
};

export default function SelectDrug({drugname, onSelectDrug}) {

  const OPTIONS = [
    {value: 'None', label: 'No'},
    {value: 'Yes', label: 'Yes'},
    {value: 'Unknown', label: 'Unknown'}
  ];

  const [selection, setSelection] = useState(OPTIONS[0]);

  useEffect(() => {
    onSelectDrug({
      name: drugname,
      selection: selection.value
    });
  }, [selection, drugname, onSelectDrug]);

  return <>
    <Select
     className={style['selection-drug']}
     name="select-drug"
     value={selection}
     options={OPTIONS}
     onChange={setSelection}
    />
    <label
     className={style['selection-drug-label']}
     htmlFor="select-drug">
      {drugname}
    </label>
  </>;
}
