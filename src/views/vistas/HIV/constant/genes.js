export const GENE_NAMES = [
  // 'gag',
  'CA',
  'PR',
  'RT',
  'IN',
  // 'vif',
  // 'vpr',
  // 'tat',
  // 'rev',
  // 'vpu',
  // 'env',
  // 'nef'
];

export const GENE_NAMES_HIV2 = [
  'PR',
  'RT',
  'IN'
];

export function sortByGeneName(a, b) {
  const indexA = GENE_NAMES.indexOf(a);
  const indexB = GENE_NAMES.indexOf(b);
  return indexA - indexB;
}
