export const hostList = [
    {value: 'Homo sapiens', label: 'Homo sapiens'},
  ];

export default function ValidateHost(host) {
    return hostList.map((o) => o.value).includes(host);
}

