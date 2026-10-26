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

const NIs = [
  'NI',
  'SOF'
];
const NNIs = [
  'NNI',
  'DSV'
];

const NS3Is = [
  'NS3_I',
  'GLE',
  'VOX',
  'PTV',
  'GZR'
  // 'Other'
];

const NS5A_Is = [
  'NS5A_I',
  'LDV',
  'VEL',
  'PIB',
  'DCV',
  'OBV',
  'EBR'
  // 'Other',
];

const DEFAULT_DRUGS = {
  'NI': NIs,
  'NNI': NNIs,
  'NS3_I': NS3Is,
  'NS5A_I': NS5A_Is
};

export function ValidateDrugFormat(drug) {

  let tmpDrug = drug;

  if (drug.includes("NS3_I")
      || drug.includes("NI")
      || drug.includes("NNI")
      || drug.includes("NS5A_I"))
      {
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
  if (NIs.includes(drug) || drug === "NI") {
    return true;
  }
  else if (NNIs.includes(drug) || drug === "NNI") {
    return true;
  }
  else if (NS3Is.includes(drug) || drug === "NS3_I") {
    return true;
  }
  else if (NS5A_Is.includes(drug) || drug === "NS5A_I") {
    return true;
  }
  return false;
}
