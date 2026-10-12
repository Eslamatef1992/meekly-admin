export function fmtMoney(n, currency = 'KWD') {
  const v = Number(n || 0);
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(v) + ' ' + currency;
}
export function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}
