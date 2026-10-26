export const isolationSourceList = [
  {value: 'Plasma', label: 'Plasma'},
  {value: 'PBMC', label: 'PBMC'},
  {value: 'Whole blood', label: 'Whole blood'},
  {value: 'DBS', label: 'DBS'}, // dried blood spot
  {value: 'CSF', label: 'CSF'}, // Cerebrospinal fluid
  {value: 'Feces', label: 'Feces'},
  {value: 'Urine', label: 'Urine'},
  {value: 'Brain', label: 'Brain'},
  {value: 'Breast milk', label: 'Breast milk'},
  {value: 'Other', label: 'Other'}
];

export default function ValidateIsolationSource(source) {
  const normalizedSource = source.trim().toLowerCase();
  const exists = isolationSourceList.some(item => {
    return item.value.trim().toLowerCase() === normalizedSource || item.label.trim().toLowerCase() === normalizedSource;
  });
  // if (!exists) {
  //   alert(`${source} is not found in the values or labels.`);
  // }
  return !!exists;
}

// Brain
// Breast Milk
// CSF
// CSFcells
// CVS
// Dried Blood Spot
// Feces
// FGT
// FGT-RNA
// Kidney
// LN
// Macrophages
// Panel
// PBMC
// Plasma
// Rectal
// Semen
// Serum
// Spleen
// Unknown
// Urine
