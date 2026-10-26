import ValidateCountry from './constant/country';
import ValidatePercent from './constant/percent';
import ValidateDateFormat from './constant/date';
import ValidateCloneMethod from './constant/clone_method';
import ValidateOrganism from './constant/organism';
import ValidateSeqMethod from './constant/seq_method';
import ValidateIsolationSource from './constant/isolation_source';
import ValidateHost from './constant/host';
import ValidateRegimen from './constant/regimen';
import { ValidateDrugList } from './constant/regimen';
import showAlertOverlay from '../alertOverlay';
import {
  formatStopMutations,
  getSequenceQualityColumns
} from '../alignment/sequence_quality';
import {sortByGeneName} from './constant/genes';

function formatResistanceList(drms) {
  if (Array.isArray(drms)) {
    return drms.join(', ');
  }
  return drms || '';
}

export function generateEditableTable(alignments, gTreatment, gDesc) {

  const table = [];
  let personID = 0;

  alignments.map((isolate) => {
    const genes = isolate.genes;

    // const genes = genes.map((s) => s.gene).join(', ');
    const subtypes = isolate.subtype;

    personID += 1;
    let row = {
      IsolateID: isolate.IsolateID,
      PersonID: `PID${personID}`
    };

    if (gDesc.cloneMethod === 'None') {
      row['Clone Method'] = 'None';
    } else {
      Object.assign(row, {
        'Clone Method': gDesc.cloneMethod,
        CloneID: ''
      });
    }

    Object.assign(row, {
      // Genes: genes,
      'PR Range': genes.PR?.alignment.gene_AA_range || '',
      'RT Range': genes.RT?.alignment.gene_AA_range || '',
      'IN Range': genes.IN?.alignment.gene_AA_range || '',
      'CA Range': genes.CA?.alignment.gene_AA_range || '',
      Virus: gDesc.organism,
      // Host: gDesc.host,
      'Country': gDesc.country,
      'Year': gDesc.isolateDate,
      'Source': gDesc.isolationSource
    });

    if (gDesc.organism === 'HIV2') {
      row.Group = gDesc.subtype || subtypes;
    } else {
      row.Subtype = gDesc.subtype || subtypes;
    }

    if (gDesc.seqMethod.toLowerCase() == 'sanger') {
      row['Sequencing Method'] = gDesc.seqMethod;
    } else {
      Object.assign(row, {
        'Sequencing Method': gDesc.seqMethod,
        'NGS (%)': gDesc.NGSThreshold
      });
    }

    if (gTreatment.mainTreatment === 'Naive') {
      row['ART'] = 'No';
    } else if (gTreatment.mainTreatment === 'Experienced') {
      row['ART'] = 'Yes';
    } else {
      row['ART'] = 'Unknown';
    }

    // Add a column for all genes
    Object.assign(row, {
      PrEP: gTreatment.prep || 'None',
      'DrugClass': gTreatment.DrugClass || 'None',
      NRTI: gTreatment.NRTI || 'None',
      NNRTI: gTreatment.NNRTI || 'None',
      PI: gTreatment.PI || 'None',
      INSTI: gTreatment.INSTI || 'None',
      CAI: gTreatment.CAI || 'None',
      'Recent Regimen': gTreatment.RecentRegimen || 'None',

      'NRTI DRMs': formatResistanceList(genes.RT?.DRMs?.NRTI),
      'NNRTI DRMs': formatResistanceList(genes.RT?.DRMs?.NNRTI),
      'PI DRMs': formatResistanceList(genes.PR?.DRMs?.PI),
      'INSTI DRMs': formatResistanceList(genes.IN?.DRMs?.INSTI),
      'CAI DRMs': formatResistanceList(genes.CA?.DRMs?.CAI),
      'PR APOBEC': genes.PR?.apobecs || '',
      // '# PR APOBEC': genes.PR?.num_apobecs || '',
      'RT APOBEC': genes.RT?.apobecs || '',
      // '# RT APOBEC': genes.RT?.num_apobecs || '',
      'IN APOBEC': genes.IN?.apobecs || '',
      // '# IN APOBEC': genes.IN?.num_apobecs || '',
      'CA APOBEC': genes.CA?.apobecs || '',
      'Stops': formatStopMutations(genes, sortByGeneName)
      // '# CA APOBEC': genes.CA?.num_apobecs || ''
    });

    Object.assign(row, getSequenceQualityColumns(isolate));

    table.push(row);
  });
  return table;
}


export function formatTable(table) {
  const required = [
    'PrEP',
    'NRTI',
    'NNRTI',
    'PI',
    'INSTI',
    'CAI',
    'Recent Regimen',
  ];

  // TODO, standardise value
  table.map((r) => {
    required.map((key) => {
      if (r[key] !== 'None') {
        r[key] = r[key].toUpperCase();
      }
    });
  });

  return table;
}

// TODO PBMC for easy input
// TODO check auto fill in ART, check Other


export function validateTable(table, isolates) {

  table = setDefaultValues(table);

  let required = [
    'IsolateID',
    'PersonID',
    'Clone Method',
    'CloneID',
    // 'Genes',
    'Virus',
    'Host',
    'Country',
    'Year',
    'Source',
    'Sequencing Method',
    'NGS (%)',

    'PR Range',
    'RT Range',
    'IN Range',
    'CA Range',
    'ART',
    'PrEP',
    'DrugClass',
    'NRTI',
    'NNRTI',
    'PI',
    'INSTI',
    'CAI',
    'Recent Regimen',

    // 'NRTI DRMs',
    // 'NNRTI DRMs',
    // 'PI DRMs',
    // 'INSTI DRMs',
    // 'CAI DRMs',

    // 'PR APOBEC/Unusual',
    // 'RT APOBEC/Unusual',
    // 'IN APOBEC/Unusual',
    // 'CA APOBEC/Unusual',
  ];

  if (isolates[0].virus.includes('HIV2')) {
    required.push('Group');
  } else {
    required.push('Subtype');
  }

  const keys = Object.keys(table[0]);

  const eKey = required.filter((k) => !keys.includes(k));
  if (eKey.length > 0) {
    showAlertOverlay(`Missing columns: ${eKey.join(', ')}`);
    return false;
  }

  const artHistoryFields = [
    'DrugClass',
    'NRTI',
    'NNRTI',
    'PI',
    'INSTI',
    'CAI',
    'Recent Regimen'
  ];

  table.map((r) => {
    if (r['ART'].toUpperCase() === 'YES') {
      r['ART Status'] = 'Experienced';
    } else if (r['ART'].toUpperCase() === 'NO') {
      r['ART Status'] = 'Naive';
    } else {
      r['ART Status'] = 'Unknown';
    }

    // Treatment history takes precedence over a CSV ART="No" designation.
    if (
      r['ART Status'] === 'Naive' &&
      artHistoryFields.some((field) => r[field] && r[field] !== 'None')
    ) {
      r['ART Status'] = 'Experienced';
    }
  });
  // console.log(table);

  table = formatTable(table);

  let eIsolateID = table.filter((t) => {
    return !t.IsolateID;
  });
  if (eIsolateID.length > 0) {
    alertErrorMsgIsolates(`Missing IsolateID`, eIsolateID);
    return false;
  }
  const isolateList = table.map((t) => t.IsolateID);
  const uniqueIsolateID = [...new Set(isolateList)];
  if (isolateList.length > uniqueIsolateID.length) {
    // TODO, show the duplicated ID
    showAlertOverlay('Duplicated IsolateID');
    return false;
  }
  const isolateIDList = isolates.map((iso) => iso.IsolateID);

  eIsolateID = table.filter((t) => {
    return !isolateIDList.includes(t.IsolateID);
  });

  if (eIsolateID.length > 0) {
    alertErrorMsgIsolates(`IsolateID(s) are not found`, eIsolateID);
    return false;
  }

  let eVirus = table.filter((t) => {
    return !t.Virus;
  });
  if (eVirus.length > 0) {
    alertErrorMsgIsolates(`Missing Virus`, eVirus);
    return false;
  }
  eVirus = table.filter((t) => {
    return !ValidateOrganism(t.Virus);
  });
  if (eVirus.length > 0) {
    alertErrorMsgIsolates(`Error Virus`, eVirus);
    return false;
  }
  table.map((r) => r.Organism = r.Virus);

  let eHost = table.filter((t) => {
    return !t.Host;
  });
  if (eHost.length > 0) {
    alertErrorMsgIsolates(`Missing Host`, eHost);
    return false;
  }
  eHost = table.filter((t) => {
    return !ValidateHost(t.Host);
  });
  if (eHost.length > 0) {
    alertErrorMsgIsolates(`Error Host`, eHost);
    return false;
  }

  let eCountry = table.filter((t) => {
    return !t['Country'];
  });
  if (eCountry.length > 0) {
    alertErrorMsgIsolates(`Missing Country`, eCountry);
    return false;
  }
  eCountry = table.filter((t) => {
    return !ValidateCountry(t['Country']);
  });
  if (eCountry.length > 0) {
    alertErrorMsgIsolates(`Country not in INSDC Geographic Location List`, eCountry);
    return false;
  }

  let eIsolateDate = table.filter((t) => {
    return !t['Year'];
  });
  if (eIsolateDate.length > 0) {
    alertErrorMsgIsolates(`Missing Isolate Year/Date`, eIsolateDate);
    return false;
  }
  eIsolateDate = table.filter((t) => {
    return !ValidateDateFormat(t['Year']);
  });
  if (eIsolateDate.length > 0) {
    alertErrorMsgIsolates(`Date format error, should be in YYYY or YYYY-MM-DD.`, eIsolateDate);
    return false;
  }

  let eSource = table.filter((t) => {
    return !t['Source'];
  });
  if (eSource.length > 0) {
    alertErrorMsgIsolates(`Missing Isolate Source`, eSource);
    return false;
  }
  eSource = table.filter((t) => {
    return !ValidateIsolationSource(t['Source']);
  });
  if (eSource.length > 0) {
    alertErrorMsgIsolates(`Error Isolate Source`, eSource);
    return false;
  }

  let eCloneMethod = table.filter((t) => {
    return !t['Clone Method'];
  });
  if (eCloneMethod.length > 0) {
    alertErrorMsgIsolates(`Missing Clone Method`, eCloneMethod);
    return false;
  }
  eCloneMethod = table.filter((t) => {
    return !ValidateCloneMethod(t['Clone Method']);
  });
  if (eCloneMethod.length > 0) {
    alertErrorMsgIsolates(`Error Clone Method`, eCloneMethod);
    return false;
  }


  // TODO wrap it as AlertValidation
  let eSeqMethod = table.filter((t) => {
    return !t['Sequencing Method'];
  });
  if (eSeqMethod.length > 0) {
    alertErrorMsgIsolates(`Missing Sequencing Method`, eSeqMethod);
    return false;
  }
  eSeqMethod = table.filter((t) => {
    return !ValidateSeqMethod(t['Sequencing Method']);
  });
  if (eSeqMethod.length > 0) {
    alertErrorMsgIsolates(`Error Sequencing Method`, eSeqMethod);
    return false;
  }

  const eNGSThreshold = table.filter((t) => {
    return t['NGS (%)'] && !ValidatePercent(t['NGS (%)']);
  });
  if (eNGSThreshold.length > 0) {
    alertErrorMsgIsolates('Error NGS Threshold', eNGSThreshold);
    return false;
  }

  const eRecentRegimen = table.filter((t) => {
    return t['Recent Regimen'] && !ValidateRegimen(t['Recent Regimen']);
  });
  if (eRecentRegimen.length > 0) {
    alertErrorMsgIsolates('Error Recent Regimen', eRecentRegimen);
    return false;
  }

  const eCloneInfo = table.filter((t) => {
    return (
      t['Clone Method'] && (
        t['Clone Method'] !== 'None') && (
        !t['CloneID']
      )
    );
  });
  if (eCloneInfo.length > 0) {
    alertErrorMsgIsolates('If Clone Method is provided, please provide CloneID', eCloneInfo);
    return false;
  }

  const eSeqMethodInfo = table.filter((t) => {
    return (
      (t['Sequencing Method'] !== 'Sanger') && (
        !t['NGS (%)']
      )
    );
  });
  if (eSeqMethodInfo.length > 0) {
    alertErrorMsgIsolates('If Sequencing Method is provided, please provide NGS Threshold (%)', eSeqMethodInfo);
    return false;
  }

  const eNRTIInfo = table.filter((t) => {
    return !ValidateDrugList(t['NRTI'], 'NRTI');
  });
  if (eNRTIInfo.length > 0) {
    alertErrorMsgIsolates('Some of the NRTIs are not in drug list', eNRTIInfo);
    return false;
  }

  const eNNRTIInfo = table.filter((t) => {
    return !ValidateDrugList(t['NNRTI'], 'NNRTI');
  });
  if (eNNRTIInfo.length > 0) {
    alertErrorMsgIsolates('Some of the NNRTIs are not in drug list', eNNRTIInfo);
    return false;
  }

  const ePIInfo = table.filter((t) => {
    return !ValidateDrugList(t['PI'], 'PI');
  });
  if (ePIInfo.length > 0) {
    alertErrorMsgIsolates('Some of the PIs are not in drug list', ePIInfo);
    return false;
  }

  const eINSTIInfo = table.filter((t) => {
    return !ValidateDrugList(t['INSTI'], 'INSTI');
  });
  if (eINSTIInfo.length > 0) {
    alertErrorMsgIsolates('Some of the INSTIs are not in drug list', eINSTIInfo);
    return false;
  }

  const eCAIInfo = table.filter((t) => {
    return !ValidateDrugList(t['CAI'], 'CAI');
  });
  if (eCAIInfo.length > 0) {
    alertErrorMsgIsolates('Some of the CAIs are not in drug list', eCAIInfo);
    return false;
  }

  return true;
}


export function alertErrorMsgIsolates(eMsg, table) {
  const isolateList = table.map((row) => {
    return row['IsolateID'];
  }).slice(0, 5).join('; ');

  showAlertOverlay(`${eMsg}, IsolateID: ${isolateList}`);
}


export function ValidateART(table) {
  const eART = table.filter((t) => {
    if (
      (t['ART Status'] === 'Experienced') &&
      (t['DrugClass'] === 'None') &&
      (t['PrEP'] === 'None') &&
      (t['NRTI'] === 'None') &&
      (t['NNRTI'] === 'None') &&
      (t['PI'] === 'None') &&
      (t['INSTI'] === 'None') &&
      (t['CAI'] === 'None') &&
      (t['Recent Regimen'] === '')) {
      // &&
      // (t['Previous Regimen'] === '')
        return true;
    } else if (
      (t['ART Status'] === 'Experienced') &&
      (t['DrugClass'] !== '') &&
      (t['DrugClass'].includes('NRTI')) &&
      !(t['DrugClass'].includes('NNRTI')) &&
      (t['NRTI'] === '')) {
        return true;
    } else if (
      (t['ART Status'] === 'Experienced') &&
      (t['DrugClass'] !== '') &&
      (t['DrugClass'].includes('PI')) &&
      (t['PI'] === '')) {
        return true;
    } else if (
      (t['ART Status'] === 'Experienced') &&
      (t['DrugClass'] !== '') &&
      (t['DrugClass'].includes('NNRTI')) &&
      (t['NNRTI'] === '')) {
        return true;
    } else if (
      (t['ART Status'] === 'Experienced') &&
      (t['DrugClass'] !== '') &&
      (t['DrugClass'].includes('INSTI')) &&
      (t['INSTI'] === '')) {
        return true;
    } else if (
      (t['ART Status'] === 'Experienced') &&
      (t['DrugClass'] !== '') &&
      (t['DrugClass'].includes('CAI')) &&
      (t['CAI'] === '')) {
        return true;
    }
    return false;
  });

  if (eART.length > 0) {
    return false;
  }

  return true;
}


export function setDefaultValues(table) {
  // default values
  table.map((r) => Object.keys(r).map((key) => r[key.trim()] = r[key].trim()));
  table.map((r) => r.Host = 'Homo sapiens');
  table.map((r) => r['CloneID'] = !('CloneID' in r) ? '' : r['CloneID']);
  table.map((r) => r['NGS (%)'] = !('NGS (%)' in r) ? '' : r['NGS (%)']);

  return table;
}
