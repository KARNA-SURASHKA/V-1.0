import { useEffect, useState } from "react";

import {
  CalendarDays,
  FileText,
  BarChart3,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

import { api } from "../../api";


function formatDate(dateValue) {

  if (!dateValue) return "Unknown date";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );

}


function getSeverityRank(severity) {

  const rank = {
    Low: 1,
    Moderate: 2,
    High: 3,
  };

  return rank[severity] || 0;

}


export default function History() {

  const [reports, setReports] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  useEffect(() => {

    let mounted = true;


    const loadHistory = async () => {

      try {

        setLoading(true);
        setError("");

        const data =
          await api.getAgentHistory();

        if (!mounted) return;

        setReports(data || []);

      } catch (err) {

        if (mounted) {

          setError(
            err.message ||
              "Unable to load submission history."
          );

        }

      } finally {

        if (mounted) {
          setLoading(false);
        }

      }

    };


    loadHistory();


    return () => {
      mounted = false;
    };

  }, []);


  if (loading) {

    return (

      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-10 text-center">

        <p className="text-[14px] text-[#718096]">
          Loading submission history...
        </p>

      </div>

    );

  }


  if (error) {

    return (

      <div className="rounded-xl border border-[#F0CACA] bg-[#FFF5F5] px-5 py-4">

        <p className="text-[13px] text-[#C62828]">
          {error}
        </p>

      </div>

    );

  }


  if (!reports.length) {

    return (

      <div className="bg-white rounded-2xl border border-[#DDE6E0] p-10 text-center">

        <FileText className="w-10 h-10 mx-auto text-[#9AA6B2]" />

        <h3 className="text-[17px] font-bold text-[#102A43] mt-4">
          No submissions yet
        </h3>

        <p className="text-[13px] text-[#718096] mt-1">
          Your submitted disease reports will appear here.
        </p>

      </div>

    );

  }


  /* =========================================================
     GROUP BY SUBMISSION DATE
  ========================================================= */

  const groups = {};


  reports.forEach((report) => {

    const date =
      formatDate(report.created_at);

    if (!groups[date]) {
      groups[date] = [];
    }

    groups[date].push(report);

  });


  return (

    <div className="space-y-5">

      {Object.entries(groups).map(
        ([date, items]) => {

          const totalCases =
            items.reduce(
              (sum, item) =>
                sum +
                Number(item.cases || 0),
              0
            );


          const highestSeverity =
            items.reduce(
              (highest, item) =>
                getSeverityRank(
                  item.severity
                ) >
                getSeverityRank(highest)
                  ? item.severity
                  : highest,
              "Low"
            );


          return (

            <div
              key={date}
              className="bg-white rounded-2xl border border-[#DDE6E0] shadow-sm p-6"
            >

              {/* HEADER */}

              <div className="flex items-center justify-between pb-5 border-b border-[#E6ECE8]">

                <div className="flex items-center gap-4">

                  <div className="w-11 h-11 rounded-xl bg-[#EAF7EF] flex items-center justify-center">

                    <CalendarDays
                      className="w-5 h-5 text-[#087A32]"
                    />

                  </div>

                  <div>

                    <h3 className="text-[16px] font-bold text-[#102A43]">
                      Weekly Report
                    </h3>

                    <p className="text-[13px] text-[#718096] mt-1">
                      {date}
                    </p>

                  </div>

                </div>


                <span className="rounded-lg bg-[#EAF7EF] px-3 py-1.5 text-[11px] font-bold text-[#087A32]">
                  Submitted
                </span>

              </div>


              {/* STATISTICS */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-5">

                <div className="bg-[#F7FAF8] rounded-xl p-4">

                  <div className="flex items-center gap-2">

                    <FileText
                      className="w-4 h-4 text-[#087A32]"
                    />

                    <span className="text-[12px] text-[#718096]">
                      Diseases Reported
                    </span>

                  </div>

                  <p className="text-[22px] font-bold text-[#087A32] mt-2">
                    {items.length}
                  </p>

                </div>


                <div className="bg-[#F7FAF8] rounded-xl p-4">

                  <div className="flex items-center gap-2">

                    <BarChart3
                      className="w-4 h-4 text-[#087A32]"
                    />

                    <span className="text-[12px] text-[#718096]">
                      Total Cases
                    </span>

                  </div>

                  <p className="text-[22px] font-bold text-[#087A32] mt-2">
                    {totalCases}
                  </p>

                </div>


                <div className="bg-[#F7FAF8] rounded-xl p-4">

                  <div className="flex items-center gap-2">

                    <ShieldCheck
                      className="w-4 h-4 text-[#087A32]"
                    />

                    <span className="text-[12px] text-[#718096]">
                      Highest Severity
                    </span>

                  </div>

                  <p className="text-[18px] font-bold text-[#087A32] mt-2">
                    {highestSeverity}
                  </p>

                </div>

              </div>


              {/* DISEASES */}

              <div className="space-y-3">

                {items.map(
                  (item, index) => (

                    <div
                      key={
                        item.id ||
                        `${item.disease}-${index}`
                      }
                      className="rounded-xl border border-[#E1E9E3] p-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <h4 className="text-[15px] font-bold text-[#102A43]">
                            {item.disease}
                          </h4>

                          <p className="text-[13px] text-[#526174] mt-1">
                            {item.cases} confirmed cases
                          </p>

                          {item.remarks && (

                            <p className="text-[12px] text-[#526174] mt-2">
                              <span className="font-semibold">
                                Remarks:
                              </span>{" "}
                              {item.remarks}
                            </p>

                          )}

                          {item.preventive_measures && (

                            <p className="text-[12px] text-[#526174] mt-1">
                              <span className="font-semibold">
                                Preventive Measures:
                              </span>{" "}
                              {item.preventive_measures}
                            </p>

                          )}

                        </div>


                        <span
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold ${
                            item.severity === "High"
                              ? "bg-[#FFF0E5] text-[#E87500]"
                              : item.severity === "Moderate"
                              ? "bg-[#FFF6D9] text-[#B77900]"
                              : "bg-[#EAF7EF] text-[#087A32]"
                          }`}
                        >
                          {item.severity}
                        </span>

                      </div>

                    </div>

                  )
                )}

              </div>


              <div className="flex justify-end mt-5">

                <button
                  type="button"
                  className="flex items-center gap-1 text-[13px] font-semibold text-[#087A32] hover:underline"
                >

                  View Details

                  <ChevronRight className="w-4 h-4" />

                </button>

              </div>

            </div>

          );

        }
      )}

    </div>

  );

}