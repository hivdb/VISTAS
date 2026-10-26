export const isolationSourceList = [
  {value: 'Plasma', label: 'Plasma'},
  {value: 'Liver', label: 'Liver'},
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
  return isolationSourceList.some((o) => o.value === source || o.label === source);
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
