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
import { alertErrorMsgIsolates, setDefaultValues } from '../HIV/editableTable';
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
      'RT Range': genes.RT?.alignment.gene_AA_range || '',
      Virus: gDesc.organism,
      // Host: gDesc.host,
      'Country': gDesc.country,
      'Year': gDesc.isolateDate,
      'Source': gDesc.isolationSource
    });

    row.Genotype = gDesc.subtype || subtypes;

    if (gDesc.seqMethod.toLowerCase() == 'sanger') {
      row['Sequencing Method'] = gDesc.seqMethod;
    } else {
      Object.assign(row, {
        'Sequencing Method': gDesc.seqMethod,
        'NGS (%)': gDesc.NGSThreshold
      });
    }

    if (gTreatment.mainTreatment === 'Naive') {
      row['Treatment'] = 'No';
    } else if (gTreatment.mainTreatment === 'Experienced') {
      row['Treatment'] = 'Yes';
    } else {
      row['Treatment'] = 'Unknown';
    }

    const rtiDRMs = formatResistanceList(genes.RT?.DRMs['RTI']);

    Object.assign(row, {
      RTI: gTreatment.RTI || 'None',
      'Recent Regimen': gTreatment.RecentRegimen || 'None',
      'RTI DRMs': rtiDRMs,
      'RT Unusual': genes.RT?.unusual || '',
      'Stops': formatStopMutations(genes, sortByGeneName)
    });

    Object.assign(row, getSequenceQualityColumns(isolate));

    table.push(row);
  });
  return table;
}


export function formatTable(table) {
  const required = [
    'RTI',
    'Recent Regimen'
  ];

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
// TODO check auto fill in Treatment, check Other


export function validateTable(table, isolates) {

  table = setDefaultValues(table);

  const required = [
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

    'RT Range',
    'Treatment',
    'RTI',
    'Recent Regimen',
    // 'RTI DRMs',
    // 'RT Unusual',

    'Genotype'
  ];

  const keys = Object.keys(table[0]);

  const eKey = required.filter((k) => !keys.includes(k));
  if (eKey.length > 0) {
    showAlertOverlay(`Missing columns: ${eKey.join(', ')}`);
    return false;
  }

  const treatmentHistoryFields = [
    'RTI',
    'Recent Regimen'
  ];

  table.map((r) => {
    if (r['Treatment'].toUpperCase() === 'YES') {
      r['Treatment Status'] = 'Experienced';
    } else if (r['Treatment'].toUpperCase() === 'NO') {
      r['Treatment Status'] = 'Naive';
    } else {
      r['Treatment Status'] = 'Unknown';
    }

    // Treatment history takes precedence over a CSV Treatment="No" designation.
    if (
      r['Treatment Status'] === 'Naive' &&
      treatmentHistoryFields.some((field) => r[field] && r[field] !== 'None')
    ) {
      r['Treatment Status'] = 'Experienced';
    }
  });

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
    alertErrorMsgIsolates(`Missing Year`);
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

  const eRTInfo = table.filter((t) => {
    return !ValidateDrugList(t['RTI'], 'RTI');
  });
  if (eRTInfo.length > 0) {
    alertErrorMsgIsolates('Some of the RTIs are not in provided list.', eRTInfo);
    return false;
  }

  return true;
}

export function ValidateART(table) {
  const eART = table.filter((t) => {
    return (
      (t['Treatment Status'] === 'Experienced') &&
      (t['RTI'] === 'None') &&
      // (t['IFN'] === 'None') &&
      (t['Recent Regimen'] === '')
      // (t['Previous Regimen'] === '')
    );
  });

  if (eART.length > 0) {
    return false;
  }

  return true;
}
