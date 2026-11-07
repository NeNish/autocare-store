// Matches a vehicle's blade sizes against wiper blade products.
// Only products with recorded blade lengths take part; nothing is inferred.
const CLOSE_TOLERANCE_IN = 1;

function sizesOf(p) {
  return (p.bladeLengthsIn || []).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
}

function matchBlades(products, { driver, passenger, connector }) {
  const want = [driver, passenger].sort((a, b) => a - b);
  const exact = [];
  const close = [];
  for (const p of products) {
    const have = sizesOf(p);
    if (have.length !== 2) continue;
    const diffs = have.map((h, i) => Math.abs(h - want[i]));
    const connectorFit = !connector
      ? 'unknown'
      : p.connectors?.length
        ? p.connectors.includes(connector) ? 'yes' : 'no'
        : 'unknown';
    if (connectorFit === 'no') continue;
    const entry = { product: p, connectorFit, sizes: have, difference: Math.max(...diffs) };
    if (diffs.every((d) => d === 0)) exact.push(entry);
    else if (diffs.every((d) => d <= CLOSE_TOLERANCE_IN)) close.push(entry);
  }
  close.sort((a, b) => a.difference - b.difference);
  return { exact, close, toleranceIn: CLOSE_TOLERANCE_IN };
}

module.exports = { matchBlades, sizesOf };
