export const GENE_NAMES = [
  // 'P',
  // 'C',
  // 'S',
  'RT'
  // 'X'
];

export function sortByGeneName(a, b) {
  const indexA = GENE_NAMES.indexOf(a);
  const indexB = GENE_NAMES.indexOf(b);
  return indexA - indexB;
}
