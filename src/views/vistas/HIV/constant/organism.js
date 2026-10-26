export const organismList = [
  {value: 'HIV1', label: 'HIV1'},
  {value: 'HIV2', label: 'HIV2'}
];

export default function ValidateOrganism(organism) {
  return organismList.map((o) => o.value).includes(organism);
}
