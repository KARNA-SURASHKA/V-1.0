"""
Hyperlocal disease spread prediction.

Deliberately dependency-free (pure Python) so the ML step never blocks on an
environment issue during a demo. The approach:

1. Pull the last N weekly case-counts for a (taluk, disease) pair.
2. Fit a simple least-squares linear trend to it -> next-week estimate.
3. Blend in the *current* average trend of neighbouring taluks (spatial
   signal), lightly weighted, which is what makes this "hyperlocal" rather
   than a pure time-series forecast per taluk in isolation.
4. Classify the predicted case count into a risk band.
5. Derive a confidence score from how much data we had and how noisy it was.

This is intentionally simple to explain in a viva ("we used weighted linear
trend extrapolation blended with neighbouring-taluk signal") while still
producing genuinely different, sensible outputs per taluk/disease.
"""

from typing import List, Tuple

RISK_THRESHOLDS = [
    (10, "Low"),
    (30, "Moderate"),
    (60, "High"),
    (float("inf"), "Critical"),
]


def classify_risk(cases: int) -> str:
    for threshold, label in RISK_THRESHOLDS:
        if cases < threshold:
            return label
    return "Critical"


def _linear_trend(values: List[int]) -> Tuple[float, float]:
    """Least-squares slope/intercept over evenly spaced points. Pure python."""
    n = len(values)
    if n == 0:
        return 0.0, 0.0
    if n == 1:
        return 0.0, float(values[0])

    xs = list(range(n))
    mean_x = sum(xs) / n
    mean_y = sum(values) / n

    numerator = sum((xs[i] - mean_x) * (values[i] - mean_y) for i in range(n))
    denominator = sum((xs[i] - mean_x) ** 2 for i in range(n))
    slope = numerator / denominator if denominator != 0 else 0.0
    intercept = mean_y - slope * mean_x
    return slope, intercept


def _variance(values: List[int]) -> float:
    if len(values) < 2:
        return 0.0
    mean_v = sum(values) / len(values)
    return sum((v - mean_v) ** 2 for v in values) / len(values)


def predict_next_value(
    own_history: List[int],
    neighbour_current_avg: float = None,
) -> Tuple[int, float, str]:
    """
    Returns (predicted_cases, confidence, trend_label).
    own_history: chronological list of weekly case counts for this taluk+disease.
    neighbour_current_avg: average *current* case count across neighbouring taluks
                            for the same disease (spatial spread signal).
    """
    if not own_history:
        return 0, 0.3, "Stable"

    slope, intercept = _linear_trend(own_history)
    n = len(own_history)
    own_next = intercept + slope * n  # extrapolate one step past the series

    if neighbour_current_avg is not None:
        # Blend: 80% own trend, 20% neighbouring-taluk pressure.
        # This is what lets a taluk's prediction rise even if its own
        # reports look flat but a neighbour is spiking.
        blended = 0.8 * own_next + 0.2 * neighbour_current_avg
    else:
        blended = own_next

    predicted = max(0, round(blended))

    # Confidence: more data points + lower relative variance => more confident.
    variance = _variance(own_history)
    mean_v = (sum(own_history) / n) if n else 0
    coeff_of_variation = (variance ** 0.5) / mean_v if mean_v > 0 else 1.0
    data_confidence = min(1.0, n / 4)  # 4+ weeks of history = full data confidence
    noise_penalty = max(0.0, 1 - min(coeff_of_variation, 1.0))
    confidence = round(0.4 + 0.35 * data_confidence + 0.25 * noise_penalty, 2)
    confidence = min(0.97, max(0.35, confidence))

    last_value = own_history[-1]
    if predicted > last_value * 1.1:
        trend = "Rising"
    elif predicted < last_value * 0.9:
        trend = "Falling"
    else:
        trend = "Stable"

    return int(predicted), confidence, trend
