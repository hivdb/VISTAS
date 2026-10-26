export default function ValidateRegimen(regimen) {
  regimen = regimen.trim();
  if (regimen === 'None') {
    return true;
  }

  const drugList = regimen.split('/');

  for (let i = 0; i < drugList.length; i = i + 1) {
    let drug = drugList[i];
    if (!ValidateDrugFormat(drug)) {
      return false;
    }
  }

  return true;
}

export function ValidateDrugList(drugs, dc) {
  if (drugs === '') {
    return true;
  }

  const drugList = drugs.split(';');
  const defaultList = DEFAULT_DRUGS[dc];
  for (let i = 0; i < drugList.length; i = i + 1) {
    if (drugList[i].toLowerCase() === 'other') {
      continue;
    }
    if (drugList[i].toLowerCase() === 'none') {
      continue;
    }
    if (drugList[i].toLowerCase() === 'unknown') {
      continue;
    }
    if (!defaultList.includes(drugList[i])) {
      return false;
    }
  }

  return true;
}

function trimRightS(str) {
  if (str.endsWith('S')) {
    return str.slice(0, -1);
  }
  return str;
}

// TODO: translate drugname

const NRTIs = [
  'NRTI',
  'AZT',
  'ZDV',
  'DDI',
  'DDC',
  '3TC',
  'D4T',
  'ABC',
  'FTC',
  'TDF',
  'TAF',
  'TFV',
  'XTC',
  'OTHER'
];
const NNRTIs = [
  'NNRTI',
  'NVP',
  'DLV',
  'EFV',
  'ETR',
  'RPV',
  'DOR',
  'OTHER'
];
const PIs = [
  'PI',
  'ATV',
  'B-ATV',
  'B-DRV',
  'DRV/b-DRV',
  'DRV',
  "RTV",
  "B-RTV",
  'FPV',
  'IDV',
  'LPV',
  'LPV/R',
  'NFV',
  'SQV',
  'TPV',
  'R',
  'OTHER'
];
const INSTIs = [
  'INSTI',
  'BIC',
  'CAB',
  'DTG',
  'EVG',
  'RAL',
  'OTHER'
];
const CAIs = [
  'LEN'
];

const DEFAULT_DRUGS = {
  'NRTI': NRTIs,
  'NNRTI': NNRTIs,
  'PI': PIs,
  'INSTI': INSTIs,
  'CAI': CAIs
};

export function ValidateDrugFormat(drug) {

  let tmpDrug = drug;

  if (drug.includes("NRTI")
      || drug.includes("NNRTI")
      || drug.includes("PI")
      || drug.includes("INSTI")
      || drug.includes("CAI")
    ) {
    const regex = /^(\d*)(\s*)([^\d]+)$/;

    const match = drug.match(regex);
    const number = match[1];
    tmpDrug = match[3];

    if (number && number !== '2') {
      return false;
    }
  }

  tmpDrug = trimRightS(tmpDrug);

  return ValidateDrug(tmpDrug);
}

export function ValidateDrug(drug) {
  if (NRTIs.includes(drug) || drug === "NRTI") {
    return true;
  } else if (NNRTIs.includes(drug) || drug === "NNRTI") {
    return true;
  } else if (PIs.includes(drug) || drug === "PI") {
    return true;
  } else if (INSTIs.includes(drug) || drug === "INSTI") {
    return true;
  } else if (INSTIs.includes(drug) || drug === "CAI") {
    return true;
  }
  return false;
}
