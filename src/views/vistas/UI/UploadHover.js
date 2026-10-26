import React, {useState} from 'react';
import PropTypes from 'prop-types';

import style from './style.module.scss';

DescriptionModal.propTypes = {
  labelText: PropTypes.string.isRequired
};

export function DescriptionModal({labelText}) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <div>
      <p
       onMouseEnter={() => setIsModalVisible(true)}
       onMouseLeave={() => setIsModalVisible(false)}
      >
        {labelText}
      </p>

      {isModalVisible && (
        <div className={style['popups']}>
          <ul>
            <li>
              <strong>Organism</strong>: Optional.
              "Human Immunodeficiency virus 1" as default.
            </li>
            <li>
              <strong>Host</strong>: Optional. "Homo sapiens" as default.
            </li>
            <li>
              <strong>PersonID</strong>: Unique ID for each patient.
              This is necessary when there are multiple samples from the same patient.
              If this is not the case, this field can be left blank.
            </li>
            <li>
              <strong>Country</strong>: INSDC Geographic Location.
            </li>
            <li>
              <strong>Isolate</strong>: Unique ID for each isolate.
            </li>
            <li>
              <strong>Year</strong>: e.g '2024', '2020-01-01'.
            </li>
            <li>
              <strong>Isolation Source</strong>: e.g., "plasma" or "PBMC".
            </li>
            <li>
              <strong>Clone Method</strong>: "none" or "molecular" or "single genome amplification".
              This will go in the Note field e.g., "Clone Method (molecular)".
            </li>
            <li>
              <strong>CloneID</strong>: Unique ID for each clone from the same Isolate.
            </li>
            <li>
              <strong>Subtype</strong>: Optional.
              If not provided, we will attempt to predict it using the HIVDB drug resistance interpretation program.
            </li>
            <li>
              <strong>Note</strong>: additional information for the isolate.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}


export function TreatmentModal() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <div>
      <p
       onMouseEnter={() => setIsModalVisible(true)}
       onMouseLeave={() => setIsModalVisible(false)}
      >
        Upload Treatment History file (optional):
      </p>

      {isModalVisible && (
        <div className={style['popups']}>
          <p>
            We realize that complete treatment data are not always available for each sample.
            In addition, even when that data are available, it can be time consuming to enter it.
            Therefore, we have developed a hierarchy for representing data at different levels of detail.
            Duration is optional. Users are encouraged to provide as much data as possible.
            If a patient has received many regimens. It will be useful to provide the last 1 or 2 regimens.
          </p>
          <p>Possible formats include:</p>
          <ol>
            <li>
              No treatment
            </li>
            <li>
              Pre-exposure prophylaxis: "TDF/FTC", "CAB"
            </li>
            <li>
              Drug-Classes received: "NRTI, NNRTI, PI". CAI
            </li>
            <li>
              Drugs received: 3TC, FTC, XTC, TDF, TAF, TXF, ABC, AZT (ZDV), etc.
              It is particularly important to know whether a patient received a newer drug for which there is less available data
              such as "b-DRV", "BIC", "DTG", "DOR", and "LEN"
            </li>
            <li>
              Drug regimens received: Examples
              "2 NRTIs/NNRTI", "2 NRTIs/LPV/r",
              "2 NRTIs/NNRTI =&gt; 2 NRTIs/LPV/r", "TDF/XTC/EFV",
              "TDF/XTC/DTG", "TDF/XTC/EFV=&gt;TDF/XTC/DTG"
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}
