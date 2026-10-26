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

    if (mod.RTI !== 'None' && mod.RTI) {
      note += `RTI (${mod.RTI.toUpperCase()}); `;
    }
    if (mod['Recent Regimen'] !== 'None' && mod['Recent Regimen']) {
      note += `Recent Regimen (${mod['Recent Regimen'].toUpperCase()}); `;
    }
    return note;
  }
