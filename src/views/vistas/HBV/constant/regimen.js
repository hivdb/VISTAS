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

function trimRightS(str) {
  if (str.endsWith('S')) {
    return str.slice(0, -1);
  }
  return str;
}

// TODO: translate drugname
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


const RTIs = [
  'RTI',
  '3TC',
  'FTC',
  'XTC',
  'ADV',
  'ETV',
  'LdT',
  'TFV',
  'TBV',
  'TDF',
  'TAF'
];

const DEFAULT_DRUGS = {
  'RTI': RTIs
};

// const IFNs = [
//   'IFN',
//   'PEGINTERFERON ALFA-2A',
//   'INTERFERON ALFA-2B'
// ];

export function ValidateDrugFormat(drug) {

  let tmpDrug = drug;

  if (drug.includes("NRTI")
      || drug.includes("NNRTI")
      || drug.includes("RTI")) {
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
  if (RTIs.includes(drug) || drug === "RTI") {
    return true;
  }
  // if (IFNs.includes(drug.toUpperCase()) || drug === "IFN") {
  //   return true;
  // }
  return false;
}
