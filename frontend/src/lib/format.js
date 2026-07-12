// Indian Rupee formatting helpers.
// formatINR(1290)      -> "₹1,290"
// formatINR(129000)    -> "₹1,29,000"  (Indian digit grouping)
// formatINR(1290, {decimals:2}) -> "₹1,290.00"
export function formatINR(value, { decimals = 0 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0";
  return "₹" + n.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
