export default function ValidateDateFormat(d) {
  if (d.length === 4) {
    const regex = /^\d{4}$/;
    return regex.test(d);
  } else {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(d);
  }
}

export function Today() {
  return new Date().toISOString().split('T')[0];
}
