export const cloneMethodList = [
  {value: 'None', label: 'None'},
  {value: 'Molecular', label: 'Molecular'},
  {value: 'Single genome amplification', label: 'SGA'},
  {value: 'Unique molecular IDs', label: 'UMI'}
];

export default function ValidateCloneMethod(method) {
  return cloneMethodList.map((o) => o.value).includes(method);
}
