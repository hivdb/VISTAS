import {makeZip} from 'icosa/utils/download';
import {Today} from './HIV/constant/date';

export default function DownloadFiles(
  bankitSeqs,
  bankitFeatures,
  bankitSC = [],
  extraFiles = []
) {
  const files = [];
  files.push({
    fileName: 'Seq.fasta',
    mediaType: 'application/x-fasta',
    data: bankitSeqs.map((s) => {
      return `${s.header}\n${s.sequence}`;
    }).join('\n')
  });

  files.push({
    fileName: 'Feature.txt',
    mediaType: 'text/plain',
    data: bankitFeatures.join('\n')
  });

  if (bankitSC.length > 0) {
    files.push({
      fileName: 'BackItTreatment.csv',
      mediaType: 'text/plain',
      data: makeCSV(bankitSC)
    });
  }

  files.push(...extraFiles);

  makeZip(`Submit_${Today()}.zip`, files);
}


export function makeCSV(data) {
  function formatCSVValue(value) {
    if (typeof value === 'string' || typeof value === 'number') {
      return value;
    }

    if (value == null) {
      return '';
    }

    return JSON.stringify(value);
  }

  const rows = [];
  if (data.length > 0) {
    const header = Object.keys(data[0]).filter(h => !h.startsWith('_'));
    rows.push(header.join(','));
  }
  for (const one of data) {
    const row = Object.entries(one)
      .filter(([k]) => !k.startsWith('_'))
      .map(([, t]) => `"${formatCSVValue(t)}"`);
    rows.push(row.join(','));
  }
  return rows.join('\n');
}
