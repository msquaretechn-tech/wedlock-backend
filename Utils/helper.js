
function parseHeight(heightStr) {
  if (!heightStr) return null;
  const match = heightStr.match(/(\d+)ft\s?(\d+)?in?/i);
  if (!match) return null;
  const feet = parseInt(match[1] || 0);
  const inches = parseInt(match[2] || 0);
  return feet * 30.48 + inches * 2.54;
}

function parseIncome(incomeStr) {
  if (!incomeStr) return null;

  const clean = incomeStr.replace(/AU\$|,/g, '').trim();

  if (clean.includes('-')) {
    const [min, max] = clean.split('-').map(x => parseInt(x.trim()));
    return { min, max };
  }

  if (/Up to/i.test(incomeStr)) {
    const max = parseInt(clean.match(/\d+/)[0]);
    return { min: 0, max };
  }

  if (/More than/i.test(incomeStr)) {
    const min = parseInt(clean.match(/\d+/)[0]);
    return { min, max: Infinity };
  }

  return null;
}

export { parseHeight, parseIncome };
