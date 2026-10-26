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
  if (mod['Treatment Status'] !== 'None') {
    note += `Treatment Status (${mod['Treatment Status']}); `;
  }
  if (mod.NI !== 'None' && mod.NI) {
    note += `NI (${mod.NI.toUpperCase()}); `;
  }
  if (mod.NNI !== 'None' && mod.NNI) {
    note += `NNI (${mod.NNI.toUpperCase()}); `;
  }
  if (mod.NS3_I !== 'None' && mod.NS3_I) {
    note += `NS3_I (${mod.NS3_I.toUpperCase()}); `;
  }
  if (mod.NS5A_I !== 'None' && mod.NS5A_I) {
    note += `NS5A_I (${mod.NS5A_I.toUpperCase()}); `;
  }
  if (mod['Recent Regimen'] !== 'None' && mod['Recent Regimen']) {
    note += `Recent Regimen (${mod['Recent Regimen'].toUpperCase()}); `;
  }
  return note;
}
