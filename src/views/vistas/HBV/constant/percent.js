export default function ValidatePercent(pcnt) {
  pcnt = pcnt.slice(0, -1);
  if (pcnt === '') {
    return false;
  }
  let num = parseFloat(pcnt);
  if (isNaN(num)) {
    return false;
  }
  if (!isFinite(num)) {
    return false;
  }
  if (num > 100) {
    return false;
  }
  if (num < 0) {
    return false;
  }
  return true;
}
