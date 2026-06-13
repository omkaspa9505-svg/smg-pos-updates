export function numberToWords(num: number): string {
  if (num === 0) return 'ZERO RUPEES ONLY';

  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const inWords = (n: number): string => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'HUNDRED ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += a[n];
    }
    return str;
  };

  const crores = Math.floor(num / 10000000);
  num %= 10000000;
  const lakhs = Math.floor(num / 100000);
  num %= 100000;
  const thousands = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num); // Ensure we don't pass decimals to inWords

  let result = '';
  if (crores > 0) result += inWords(crores) + 'CRORE ';
  if (lakhs > 0) result += inWords(lakhs) + 'LAKH ';
  if (thousands > 0) result += inWords(thousands) + 'THOUSAND ';
  if (remainder > 0) result += inWords(remainder);

  return result.trim() + ' RUPEES ONLY';
}
