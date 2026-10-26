export const GENE_NAMES = [
  'CORE',
  'E1',
  'E2',
  'P7',
  'NS2',
  'NS3',
  'NS4A',
  'NS4B',
  'NS5A_NTD',
  'NS5A_CTD',
  'NS5B'
];

export const GENOTYPGING_GENE_NAMES = [
  'NS3',
  'NS5A_NTD',
  'NS5B'
];

export const GENE_NAMES_GENERAL = [
  'CORE',
  'E1',
  'E2',
  // 'P7',  P7 is too short, may not be detected.
  'NS2',
  'NS3',
  'NS4A',
  'NS4B',
  'NS5A',
  'NS5B'
];


export const SORT_GENE_NAMES = [
  'polyprotein',
  'CORE',
  'E1',
  'E2',
  'P7',
  'NS2',
  'NS3',
  'NS4A',
  'NS4B',
  'NS5A',
  'NS5A_NTD',
  'NS5A_CTD',
  'NS5B'
];

export function sortByGeneName(a, b) {
  const indexA = SORT_GENE_NAMES.indexOf(a);
  const indexB = SORT_GENE_NAMES.indexOf(b);
  return indexA - indexB;
}
