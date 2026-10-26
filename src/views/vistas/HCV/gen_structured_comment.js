import showAlertOverlay from '../alertOverlay';

export default function generateStructuredComment(bankItSeq, descriptions, treatments) {
  const patients = [...new Set(descriptions.map((d) => {
    return d.PersonID || null;
  }))].filter(x => x !== null);

  const treatmentPatients = [...new Set(treatments.map((d) => {
    return d.PersonID || null;
  }))].filter(x => x !== null);

  const missingPatients = patients.filter(x => !treatmentPatients.includes(x));

  if (missingPatients.length > 0) {
    showAlertOverlay("Some patients don't have treatment history");
    return;
  }

  treatments = treatments.map((t) => {
    let notes = '';
    if (!t['weeks']) {
      notes += 'duration unknown;';
    }
    if (!t['treatment_order']) {
      notes += 'treatment order unknown;';
    }
    t['notes'] = notes;
    return t;
  });

  treatments = treatments.reduce((group, item) => {
    const {PersonID} = item;
    group[PersonID] = group[PersonID] ?? [];
    group[PersonID].push(item);
    return group;
  }, {});

  const patientTreatments = {};
  Object.entries(treatments).map(([PersonID, items]) => {
    items = items.sort((a, b) => {
      if (!a.treatment_order) {
        return 0;
      }
      if (!b.treatment_order) {
        return 0;
      }
      return a.treatment_order - b.treatment_order;
    });
    const pTreatment = {};
    pTreatment.treatments = items.map((i) => {
      if (!i.weeks) {
        return i.treatment;
      } else {
        return `${i.treatment}, ${i.weeks} weeks`;
      }
    }).join('; ');
    const notes = items.map((i) => i.notes).filter((i) => i.length);

    pTreatment.notes = notes[0] || '';
    pTreatment['StructuredCommentPrefix'] = 'Treatment';
    pTreatment['StructuredCommentSuffix'] = 'Treatment';
    patientTreatments[PersonID] = pTreatment;

    return pTreatment;
  });

  const isolateTreatments = {};
  descriptions.forEach((d) => {
    let t = patientTreatments[d.PersonID];
    t = {...t, 'Isolate': d.IsolateID, 'PersonID': d.PersonID};
    isolateTreatments[d.IsolateID] = t;
  });

  const seqTreatments = [];
  bankItSeq.forEach((a) => {
    let t = isolateTreatments[a.Isolate];
    t = {...t, SeqID: a.SeqID};
    seqTreatments.push(t);
  });

  const keysToKeep = [
    'SeqID',
    'PersonID',
    'treatments',
    'notes',
    'StructuredCommentPrefix',
    'StructuredCommentSuffix'
  ];

  treatments = seqTreatments.map((t) => {
    const newObj = keysToKeep.reduce((obj, key) => {
      obj[key] = t[key];
      return obj;
    }, {});
    return newObj;
  });

  return treatments;
}
