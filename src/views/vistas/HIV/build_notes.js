export function buildNote(mod) {
  let note = '';
  if (mod['Clone Method'] !== 'None' && mod['Clone Method']) {
      note += `Clone Method (${mod['Clone Method']}); `;
  }
  if (mod['PersonID']) {
      note += `PersonID (${mod.PersonID}); `;
  }
  if (mod['Sequencing Method']) {
      note += `Sequencing Method (${mod['Sequencing Method']}); `;
  }
  if (mod['NGS (%)']) {
      note += `NGS Threshold (${mod['NGS (%)']}); `;
  }
  if (mod['ART Status'] !== 'None') {
      note += `ART Status (${mod['ART Status']}); `;
  }

  if (mod.PrEP !== 'None' && mod.PrEP) {
      note += `PrEP (${mod.PrEP.toUpperCase()}); `;
  }
  if (mod.NRTI !== 'None' && mod.NRTI) {
      note += `NRTI (${mod.NRTI.toUpperCase()}); `;
  }
  if (mod.NNRTI !== 'None' && mod.NNRTI) {
      note += `NNRTI (${mod.NNRTI.toUpperCase()}); `;
  }
  if (mod.PI !== 'None' && mod.PI) {
      note += `PI (${mod.PI.toUpperCase()}); `;
  }
  if (mod.INSTI !== 'None' && mod.INSTI) {
      note += `INSTI (${mod.INSTI.toUpperCase()}); `;
  }
  if (mod.CAI !== 'None' && mod.CAI) {
    note += `CAI (${mod.CAI.toUpperCase()}); `;
  }
  // if (mod['Entry Inhibitor'] !== 'None' && mod['Entry Inhibitor']) {
  //   note += `Entry Inhibitor (${mod['Entry Inhibitor'].toUpperCase()}); `;
  // }

  if (mod['Recent Regimen'] !== 'None' && mod['Recent Regimen']) {
      note += `Recent Regimen (${mod['Recent Regimen'].toUpperCase()}); `;
  }
  // if (mod['Previous Regimen'] !== 'None' && mod['Previous Regimen']) {
  //   note += `Previous Regimen (${mod['Previous Regimen'].toUpperCase()}); `;
  // }
  // if (mod.OtherRegimen !== 'None' && mod.OtherRegimen) {
  //   note += `Other Regimen (${mod.OtherRegimen.toUpperCase()}); `;
  // }

  return note;
}
