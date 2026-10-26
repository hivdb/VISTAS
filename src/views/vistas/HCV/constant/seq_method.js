export const SequencingMethod = [
  {value: 'Sanger', label: 'Sanger'},
  {value: 'Illumina', label: 'Illumina'},
  {value: 'Oxford Nanopore', label: 'Oxford Nanopore'},
  {value: 'Ion Torrent', label: 'Ion Torrent'},
  {value: 'PacBio', label: 'PacBio'}
];


export default function ValidateSeqMethod(method) {
  return SequencingMethod.map((o) => o.value).includes(method);
}
