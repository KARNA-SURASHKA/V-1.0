import { useMemo } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

export default function WeeklyReport({
  username,
  selectedLocation,
  dashboardData,
  onBack,
  onNavigate,
}) {
  const trend = Array.isArray(dashboardData?.trend)
    ? dashboardData.trend
    : [];

  const currentCases = Number(
    dashboardData?.active_cases ??
      dashboardData?.total_cases ??
      dashboardData?.cards?.reduce(
        (sum, item) => sum + Number(item?.cases || 0),
        0
      ) ??
      0
  );

  const previousCases =
    trend.length >= 2
      ? Number(
          trend[trend.length - 2]?.total_cases ??
            trend[trend.length - 2]?.totalCases ??
            trend[trend.length - 2]?.cases ??
            0
        )
      : null;

  const weeklyChange = useMemo(() => {
    if (
      dashboardData?.trend_percentage !== undefined &&
      dashboardData?.trend_percentage !== null
    ) {
      const value = Number(
        String(dashboardData.trend_percentage).replace("%", "")
      );
      return Number.isFinite(value) ? value : null;
    }

    if (previousCases === null) return null;
    if (previousCases === 0) return currentCases === 0 ? 0 : 100;

    return Math.round(
      ((currentCases - previousCases) / previousCases) * 100
    );
  }, [dashboardData, previousCases, currentCases]);

  const risk =
    dashboardData?.overall_risk ||
    dashboardData?.risk_level ||
    dashboardData?.risk ||
    "Low";

  const diseases = Array.isArray(dashboardData?.cards)
    ? dashboardData.cards
    : [];

  const dominantDisease =
    dashboardData?.top_disease ||
    dashboardData?.dominant_disease ||
    diseases[0]?.disease ||
    "No dominant disease reported";

  const reportEnd = dashboardData?.last_updated_at
    ? new Date(dashboardData.last_updated_at)
    : new Date();

  const reportStart = new Date(reportEnd);
  reportStart.setDate(reportStart.getDate() - 6);

  const formatDate = (date) =>
    date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const location =
    selectedLocation?.talukName &&
    selectedLocation?.districtName
      ? `${selectedLocation.talukName} Taluk, ${selectedLocation.districtName} District`
      : selectedLocation?.talukName ||
        selectedLocation?.districtName ||
        "Selected location";

  const trendPositive = weeklyChange > 0;

  return (
    <div className="min-h-screen bg-[#FCFAF6]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-5 inline-flex items-center gap-2 text-[13px] font-medium text-[#16803C] hover:underline"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7A8798]">
            WEEKLY SURVEILLANCE REPORT
          </p>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-bold text-[#13264B]">
                Weekly Health Report
              </h1>

              <p className="mt-1 text-[14px] text-[#667085]">
                {location}
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#E7E2D8] bg-white px-4 py-2.5 text-[12px] text-[#526073]">
              <CalendarDays size={16} />
              {formatDate(reportStart)} – {formatDate(reportEnd)}
            </div>
          </div>

          <p className="mt-2 text-[11px] text-[#7A8598]">
            Latest report for {username}. Data is based on the most recent
            weekly surveillance submission.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Metric
            label="Reported Cases"
            value={currentCases.toLocaleString("en-IN")}
          />
          <Metric
            label="Previous Week"
            value={
              previousCases === null
                ? "—"
                : previousCases.toLocaleString("en-IN")
            }
          />
          <Metric
            label="Weekly Change"
            value={
              weeklyChange === null
                ? "—"
                : `${weeklyChange > 0 ? "+" : ""}${weeklyChange}%`
            }
            positive={trendPositive}
            negative={weeklyChange < 0}
          />
          <Metric label="Risk Level" value={risk} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
            <h2 className="text-[18px] font-semibold text-[#13264B]">
              Weekly Summary
            </h2>

            <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#526073]">
              {dominantDisease} is the leading reported disease in the
              selected monitoring area this week. The current surveillance
              risk is <strong>{risk}</strong>
              {weeklyChange !== null
                ? `, with cases ${
                    weeklyChange > 0
                      ? "increasing"
                      : weeklyChange < 0
                        ? "decreasing"
                        : "remaining stable"
                  } by ${Math.abs(weeklyChange)}% compared with the previous
                  weekly report.`
                : "."}
            </p>

            <div className="mt-5 rounded-xl border border-[#E8E2D8] bg-[#FCFAF6] p-4">
              <div className="flex items-center gap-3">
                {weeklyChange > 0 ? (
                  <TrendingUp className="text-[#F04444]" size={20} />
                ) : weeklyChange < 0 ? (
                  <TrendingDown className="text-[#16803C]" size={20} />
                ) : (
                  <CheckCircle2 className="text-[#16803C]" size={20} />
                )}

                <div>
                  <p className="text-[13px] font-semibold text-[#13264B]">
                    What changed this week?
                  </p>
                  <p className="mt-1 text-[12px] text-[#667085]">
                    {weeklyChange === null
                      ? "There is not enough historical data to calculate a weekly change."
                      : weeklyChange > 0
                        ? `Reported cases increased by ${Math.abs(weeklyChange)}% compared with the previous weekly report.`
                        : weeklyChange < 0
                          ? `Reported cases decreased by ${Math.abs(weeklyChange)}% compared with the previous weekly report.`
                          : "Reported case levels are stable compared with the previous weekly report."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
            <h2 className="text-[18px] font-semibold text-[#13264B]">
              Disease Situation
            </h2>

            <div className="mt-4 space-y-2">
              {diseases.length ? (
                diseases.slice(0, 6).map((item, index) => (
                  <div
                    key={`${item?.disease || "disease"}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-[#E8E2D8] bg-[#FCFAF6] px-4 py-3"
                  >
                    <span className="text-[13px] font-medium text-[#526073]">
                      {item?.disease || "Unknown disease"}
                    </span>
                    <span className="text-[13px] font-bold text-[#13264B]">
                      {Number(item?.cases || 0)} cases
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-[#7A8598]">
                  No disease-specific report is available.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-[#E7E2D8] bg-white p-6 shadow-sm">
          <h2 className="text-[18px] font-semibold text-[#13264B]">
            Weekly Cases Trend
          </h2>

          <div className="mt-4 overflow-x-auto">
            <div className="flex min-w-[560px] items-end gap-5 border-b border-[#E8E2D8] px-3 pb-3 pt-8">
              {trend.length ? (
                trend.slice(-6).map((item, index, visible) => {
                  const value = Number(
                    item?.total_cases ??
                      item?.totalCases ??
                      item?.cases ??
                      0
                  );

                  const max = Math.max(
                    ...visible.map((entry) =>
                      Number(
                        entry?.total_cases ??
                          entry?.totalCases ??
                          entry?.cases ??
                          0
                      )
                    ),
                    1
                  );

                  return (
                    <div
                      key={`${item?.week_label || "week"}-${index}`}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <span className="text-[11px] font-semibold text-[#526073]">
                        {value}
                      </span>

                      <div
                        className="w-full max-w-[64px] rounded-t-lg bg-[#2E9649]"
                        style={{
                          height: `${Math.max(18, (value / max) * 150)}px`,
                        }}
                      />

                      <span className="text-[10px] text-[#7A8598]">
                        {item?.week_label || `Week ${index + 1}`}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="w-full py-12 text-center text-[13px] text-[#7A8598]">
                  No weekly trend data available.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#DDEBDD] bg-[#F3F8F2] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#16803C]">
            THIS WEEK&apos;S PRIORITY
          </p>

          <h2 className="mt-2 text-[22px] font-bold text-[#13264B]">
            Follow the latest precautionary guidance
          </h2>

          <p className="mt-2 max-w-3xl text-[14px] leading-7 text-[#3E4840]">
            Use the precautionary guidance for {location} to understand the
            recommended community and personal safety measures related to the
            latest surveillance situation.
          </p>

          <button
            type="button"
            onClick={() => onNavigate?.("precautions")}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2E9649] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#247E3B]"
          >
            View Precautions
          </button>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value, positive, negative }) {
  return (
    <div className="rounded-2xl border border-[#E7E2D8] bg-white p-5 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#7A8598]">
        {label}
      </p>
      <p
        className={`mt-2 text-[25px] font-bold ${
          positive
            ? "text-[#F04444]"
            : negative
              ? "text-[#16803C]"
              : "text-[#13264B]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
