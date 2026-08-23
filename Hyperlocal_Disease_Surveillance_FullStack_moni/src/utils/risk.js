// Mirrors app/ml/predict.py's RISK_THRESHOLDS on the backend, for quick
// client-side badge rendering where the backend hasn't already classified
// the row (e.g. raw report rows in the admin table).
export function classifyRisk(cases) {
  if (cases < 10) return "Low";
  if (cases < 30) return "Moderate";
  if (cases < 60) return "High";
  return "Critical";
}
