import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

import style from './style.module.scss';

import {organismList} from './constant/organism';
import {isolationSourceList} from './constant/isolation_source';
import {countryList} from './constant/country';
import {cloneMethodList} from './constant/clone_method';
import {SequencingMethod} from './constant/seq_method';

GroupDescription.propTypes = {
  onSelectDesc: PropTypes.func.isRequired
};

export default function GroupDescription({onSelectDesc}) {

  const [organism, setOrganism] = useState(organismList[0]);
  const [
    isolationSource,
    setIsolationSource
  ] = useState(isolationSourceList[0]);
  const [
    country,
    setCountry
  ] = useState({value: 'USA', label: 'USA'});
  const [isolateDate, setIsolateDate] = useState('');
  const [cloneMethod, setClondMethod] = useState(cloneMethodList[0]);
  const [seqMethod, setSeqMethod] = useState(SequencingMethod[0]);
  const [NGSThreshold, setNGSThreshold] = useState('');

  const onSelectIsolateDate = (e) => {
    setIsolateDate(e.target.value);
  };


  const onSelectThreshold = (e) => {
    setNGSThreshold(e.target.value);
  };

  useEffect(() => {
    onSelectDesc({
      organism: organism.value,
      isolationSource: isolationSource.value,
      host: 'Homo sapiens',
      country: country.value,
      isolateDate,
      cloneMethod: cloneMethod.value,
      seqMethod: seqMethod.value,
      NGSThreshold
    });
  }, [
    onSelectDesc,
    organism,
    isolationSource,
    country,
    isolateDate,
    cloneMethod,
    seqMethod,
    NGSThreshold
  ]);

  return <div className={style['descriptions']}>
    <div className={style['input-group']}>
      <label
       className={style['input-label']}
       htmlFor="organism">
        Organism:
      </label>
      <Select
       className={style['selection']}
       name='organism'
       value={organism}
       isDisabled={true}
       options={organismList}
       onChange={setOrganism}
      />
    </div>
    <div className={style['input-group']}>
      <label
       className={style['input-label']}
       htmlFor="source">
        Isolate Source:
      </label>
      <Select
       className={style['selection']}
       name='source'
       value={isolationSource}
       options={isolationSourceList}
       onChange={setIsolationSource}
      />
    </div>
    <div className={style['input-group']}>
      <label
        className={style['input-label']}
        htmlFor="country">
        Country:
      </label>
      <Select
        className={style['selection']}
        name='country'
        value = {country}
        options = {countryList}
        onChange={setCountry}
        />
    </div>
    <div className={style['input-group']}>
      <label
       className={style['input-label']}
       htmlFor="isolateDate">
        Isolate Date:
      </label>
      <input
       className={style['input-box']}
       name='isolateDate'
       type='text'
       onChange={onSelectIsolateDate}
       placeholder={"YYYY or YYYY-MM-DD"}
      />
    </div>
    <div className={style['input-group']}>
      <label
       className={style['input-label']}
       htmlFor="source">
        Clone Method:
      </label>
      <Select
       className={style['selection']}
       name='source'
       value={cloneMethod}
       options={cloneMethodList}
       onChange={setClondMethod}
      />
    </div>
    <div className={style['input-group']}>
      <label
       className={style['input-label']}
       htmlFor="seqmethod">
        Sequencing Method:
      </label>
      <Select
       className={style['selection']}
       name='seqmethod'
       value={seqMethod}
       options={SequencingMethod}
       onChange={setSeqMethod}
      />
    </div>
    <div className={style['input-group']}>
      <label
       className={style['input-label']}
       htmlFor="threshold">
        NGS Threshold (%):
      </label>
      <input
       className={style['input-box']}
       name='threshold'
       type='text'
       onChange={onSelectThreshold}
       disabled={seqMethod.value === 'Sanger'}
      />
    </div>
  </div>;
}
