export const organismList = [
  {value: 'HBV', label: 'HBV'},
];

export default function ValidateOrganism(organism) {
  return organismList.map((o) => o.value).includes(organism);
}
