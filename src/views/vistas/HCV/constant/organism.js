export const organismList = [
  {value: 'HCV', label: 'HCV'},
];

export default function ValidateOrganism(organism) {
  return organismList.map((o) => o.value).includes(organism);
}
