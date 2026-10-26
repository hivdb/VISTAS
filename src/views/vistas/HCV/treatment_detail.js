import React, {useState, useEffect, useCallback} from 'react';
import PropTypes from 'prop-types';

import CheckboxInput from 'icosa/components/checkbox-input';
import SelectDrug from './selectDrug';

import style from './style.module.scss';


TreatmentDetails.propTypes = {
  onChangeTreatment: PropTypes.func.isRequired,
  DRUGCLASSES: PropTypes.array.isRequired,
  RecentRxExample: PropTypes.string.isRequired
};

export default function TreatmentDetails({
  onChangeTreatment, DRUGCLASSES, drugs, RecentRxExample}) {

  const [rxDetails, setRxDetails] = useState(
    DRUGCLASSES.reduce((acc, kls, idx) => {
      acc[kls] = {
        idx: idx,
        status: 'None',
        name: kls,
        drugs: drugs.filter((d) => d.drugClass === kls).reduce((acc, d, idx) => {
          d.idx = idx;
          d.status = 'None';
          acc[d.name] = d;
          return acc;
        }, {})
      };
      return acc;
    }, {})
  );

  const onSelectDrugClass = useCallback(({name, selection}) => {
    setRxDetails(rxDetails => {
      const newRx = {...rxDetails};
      newRx[name].status = selection;
      return newRx;
    });
  }, []);

  const onSelectDrug = useCallback(({drugClass, drugDetails}) => {
    setRxDetails(rxDetails => {
      const newRx = {...rxDetails};
      newRx[drugClass].drugs = drugDetails;
      return newRx;
    });
  }, []);

  const [recentRegimen1, setRecentRegimen1] = useState('');
  const onSelectRegimen1 = (e) => {
    setRecentRegimen1(e.target.value);
  };

  useEffect(() => {
    const newDetail = {...rxDetails, RecentRegimen: recentRegimen1};

    DRUGCLASSES.forEach((kls) => {
      if (newDetail[kls].status === 'Unknown') {
        newDetail[kls] = 'Unknown';
        return;
      }
      else if (newDetail[kls].status === 'None') {
        newDetail[kls] = '';
        return;
      }
      const drugNames = Object.values(newDetail[kls].drugs).sort(
        (i, j) => i.idx - j.idx).filter(
        (d) => d.status === 'Yes').map(
        (d) => d.name);
      newDetail[kls] = drugNames ? drugNames.join(';') : '';
    });

    newDetail.DrugClass = DRUGCLASSES.filter((kls) => newDetail[kls] !== '')?.join(';') || '';

    onChangeTreatment(newDetail);
  }, [
    rxDetails,
    recentRegimen1,
    onChangeTreatment
  ]);

  return <>
    <>
      <div className={style['input-group']}>
        <label className={style['input-label-section']}>
          Treatment history including past regimens and current regimen:
        </label>
      </div>

      <div className={style['input-group']}>
        <label
         className={style['input-label-h2']}
         htmlFor="drug-class">
          Drug Classes:
        </label>

        <ul className={style['drug-list']}>
          {Object.values(rxDetails).sort((i, j) => i.idx - j.idx).map((kls) => (
            <li key={kls.name}>
              <SelectDrug
               id={`drugclass-display-options__${kls.name}`}
               name={`drugclass-display-options__${kls.name}`}
               drugname={kls.name}
               onSelectDrug={onSelectDrugClass}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className={style['ui-part']}>
        {Object.keys(rxDetails).map((kls) => {
          if (rxDetails[kls].status !== 'Yes') {
            return null;
          }
          return (
            <div className={style['input-group']} key={kls}>
              <label
               className={style['input-label-h2']}
               htmlFor="drugs">
                {kls}:
              </label>
              <DrugSelectionList
               drugClass={kls}
               drugclassDetails={rxDetails[kls].drugs}
               setDrugClassDetails={onSelectDrug}
              />
            </div>
          );
        })}
      </div>

      <div className={style['input-group']}>
        <label
         className={style['input-label']}
         htmlFor="regimen1">
          Most Recent Regimen:
        </label>
        <input
         className={style['input-box']}
         name="regimen1"
         type="text"
         onChange={onSelectRegimen1}
        />
        <p className={style['small_instruction']}>
          {`e.g.: ${RecentRxExample}`}
        </p>
      </div>
    </>
  </>;
}

DrugSelectionList.propTypes = {
  drugClass: PropTypes.string.isRequired,
  drugclassDetails: PropTypes.object.isRequired,
  setDrugClassDetails: PropTypes.func.isRequired
};

function DrugSelectionList({
  drugClass,
  drugclassDetails,
  setDrugClassDetails
}) {

  const [drugDetails, setDrugDetails] = useState(drugclassDetails);

  useEffect(() => {
    setDrugClassDetails({drugClass, drugDetails});
  }, [drugClass, drugDetails, setDrugClassDetails]);

  const onCheck = (e) => {
    const target = e.currentTarget;
    const drug = target.dataset['drug'];
    setDrugDetails(drugDetails => {
      const newDetails = {...drugDetails};
      newDetails[drug] = {...newDetails[drug]};
      newDetails[drug].status = target.checked ? 'Yes' : 'No';
      return newDetails;
    });
  };

  return (
    <ul className={style['drug-list']}>
      {Object.values(drugDetails).sort((i, j) => i.idx - j.idx)
        .map((d) =>
          <li key={d.name}>
            <CheckboxInput
             id={`${drugClass}-display-options_${d.name}`}
             name={`${drugClass}-display-options_${d.name}`}
             onChange={onCheck}
             value={d.name}
             checked={d.status === 'Yes'}
             data-drug={d.name}>
              {d.displayAbbr}
            </CheckboxInput>
          </li>)}
    </ul>
  );
}
