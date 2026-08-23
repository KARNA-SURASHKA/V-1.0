import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Save,
  Send,
} from "lucide-react";

import { api } from "../../api";


// ============================================================
// DISEASES
// ============================================================

const DISEASES = [
  "Malaria",
  "Dengue",
  "Chikungunya",
  "Typhoid",
  "Tuberculosis",
  "Influenza",
  "COVID-19",
  "Other",
];


// ============================================================
// EMPTY DISEASE
// ============================================================

function createEmptyDisease() {
  return {
    disease: "",
    confirmed_cases: "",
    suspected_cases: "",
    remarks: "",
    preventive_measures: "",
    severity: "",
  };
}


// ============================================================
// MAP BACKEND REPORT -> FORM
// ============================================================

function mapReportToForm(report) {
  if (!report) {
    return createEmptyDisease();
  }


  return {
    disease:
      report.disease ||
      report.disease_name ||
      "",

    confirmed_cases:
      report.confirmed_cases ??
      report.cases ??
      "",

    suspected_cases:
      report.suspected_cases ??
      "",

    remarks:
      report.remarks ||
      "",

    preventive_measures:
      report.preventive_measures ||
      "",

    severity:
      report.severity ||
      "",
  };
}


// ============================================================
// MAP FORM -> BACKEND
// ============================================================
//
// Backend expects:
//
// {
//   disease,
//   cases,
//   severity,
//   remarks,
//   preventive_measures
// }
//
// ============================================================

function mapFormToBackend(item) {
  return {
    disease:
      item.disease?.trim() || "",

    cases:
      item.confirmed_cases === "" ||
      item.confirmed_cases === null ||
      item.confirmed_cases === undefined
        ? 0
        : Number(item.confirmed_cases),

    severity:
      item.severity || "",

    remarks:
      item.remarks?.trim() || "",

    preventive_measures:
      item.preventive_measures?.trim() || "",
  };
}


// ============================================================
// COMPONENT
// ============================================================

export default function ReportForm({
  mode = "add",
}) {

  const isEditMode =
    mode === "edit";


  const [items, setItems] =
    useState([
      createEmptyDisease(),
    ]);


  const [loading, setLoading] =
    useState(false);


  const [loadingExisting, setLoadingExisting] =
    useState(false);


  const [error, setError] =
    useState("");


  const [success, setSuccess] =
    useState("");


  // ==========================================================
  // LOAD EXISTING REPORT
  // ==========================================================

  useEffect(() => {

    let mounted = true;


    const loadExistingReport =
      async () => {

        if (!isEditMode) {

          setItems([
            createEmptyDisease(),
          ]);

          setLoadingExisting(false);

          return;
        }


        try {

          setLoadingExisting(true);

          setError("");

          setSuccess("");


          const historyData =
            await api.getAgentHistory();


          if (!mounted) {
            return;
          }


          const reports =
            historyData || [];


          if (
            reports.length === 0
          ) {

            setItems([
              createEmptyDisease(),
            ]);

            return;
          }


          // --------------------------------------------------
          // Sort newest first
          // --------------------------------------------------

          const sortedReports =
            [...reports].sort(
              (a, b) =>
                new Date(
                  b.created_at
                ) -
                new Date(
                  a.created_at
                )
            );


          const latestReport =
            sortedReports[0];


          const latestWeek =
            latestReport.week_number ??
            latestReport.week ??
            latestReport.reporting_week ??
            latestReport.current_week;


          let currentCycleReports;


          // --------------------------------------------------
          // Find reports belonging to latest week
          // --------------------------------------------------

          if (
            latestWeek !== undefined &&
            latestWeek !== null
          ) {

            currentCycleReports =
              sortedReports.filter(
                (report) =>
                  (
                    report.week_number ??
                    report.week ??
                    report.reporting_week ??
                    report.current_week
                  ) === latestWeek
              );

          } else {

            const latestDate =
              new Date(
                latestReport.created_at
              );


            currentCycleReports =
              sortedReports.filter(
                (report) => {

                  const reportDate =
                    new Date(
                      report.created_at
                    );


                  return (
                    reportDate.getTime() ===
                    latestDate.getTime()
                  );
                }
              );
          }


          const mappedItems =
            currentCycleReports.map(
              mapReportToForm
            );


          if (mounted) {

            setItems(
              mappedItems.length > 0
                ? mappedItems
                : [
                    createEmptyDisease(),
                  ]
            );
          }

        } catch (err) {

          if (mounted) {

            setError(
              err.message ||
              "Unable to load the submitted report."
            );


            setItems([
              createEmptyDisease(),
            ]);
          }

        } finally {

          if (mounted) {
            setLoadingExisting(false);
          }
        }
      };


    loadExistingReport();


    return () => {
      mounted = false;
    };

  }, [isEditMode]);


  // ==========================================================
  // UPDATE DISEASE
  // ==========================================================

  const updateDisease = (
    index,
    field,
    value
  ) => {

    setItems(
      (previous) =>
        previous.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item
        )
    );
  };


  // ==========================================================
  // ADD DISEASE
  // ==========================================================

  const addDisease = () => {

    setItems(
      (previous) => [
        ...previous,
        createEmptyDisease(),
      ]
    );
  };


  // ==========================================================
  // REMOVE DISEASE
  // ==========================================================

  const removeDisease = (
    index
  ) => {

    setItems(
      (previous) =>
        previous.filter(
          (_, itemIndex) =>
            itemIndex !== index
        )
    );
  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit =
    async (event) => {

      event.preventDefault();


      setError("");

      setSuccess("");


      try {

        setLoading(true);


        // ====================================================
        // GET AUTHORITATIVE CURRENT WEEK FROM BACKEND
        // ====================================================

        const agentStatus =
          await api.getAgentStatus();


        const currentWeek =
          agentStatus?.current_week;


        if (
          currentWeek === undefined ||
          currentWeek === null
        ) {

          throw new Error(
            "Unable to determine the current surveillance week. Please refresh the Agent Portal and try again."
          );
        }


        const currentYear =
          new Date().getFullYear();


        // ====================================================
        // REMOVE COMPLETELY EMPTY ROWS
        // ====================================================

        const validItems =
          items.filter(
            (item) =>
              item.disease?.trim() ||
              item.confirmed_cases !== "" ||
              item.suspected_cases !== "" ||
              item.remarks?.trim() ||
              item.preventive_measures?.trim() ||
              item.severity
          );


        if (
          validItems.length === 0
        ) {

          setError(
            "Please enter at least one disease before submitting."
          );

          return;
        }


        // ====================================================
        // VALIDATE REQUIRED FIELDS
        // ====================================================

        for (
          const item of validItems
        ) {

          if (
            !item.disease?.trim()
          ) {

            setError(
              "Please select a disease for every entry."
            );

            return;
          }


          if (
            item.confirmed_cases === "" ||
            item.confirmed_cases === null ||
            item.confirmed_cases === undefined
          ) {

            setError(
              `Please enter confirmed cases for ${item.disease}.`
            );

            return;
          }


          if (
            Number(
              item.confirmed_cases
            ) < 0
          ) {

            setError(
              `Confirmed cases for ${item.disease} cannot be negative.`
            );

            return;
          }


          if (
            !item.severity
          ) {

            setError(
              `Please select severity for ${item.disease}.`
            );

            return;
          }
        }


        // ====================================================
        // EDIT MODE
        // ====================================================

        if (isEditMode) {

          const backendItems =
            validItems.map(
              mapFormToBackend
            );


          await api.submitWeeklyReport(
            backendItems,
            currentWeek,
            currentYear
          );


          setSuccess(
            "Weekly report updated successfully."
          );


          return;
        }


        // ====================================================
        // ADD MODE
        // ====================================================
        //
        // Existing diseases are preserved.
        // New disease is added to them.
        //
        // ====================================================

        const currentReports =
          await api.getCurrentAgentReport();


        const existingItems =
          (
            currentReports || []
          ).map(
            (report) => ({
              disease:
                report.disease ||
                "",

              cases:
                Number(
                  report.cases || 0
                ),

              severity:
                report.severity ||
                "Low",

              remarks:
                report.remarks ||
                "",

              preventive_measures:
                report.preventive_measures ||
                "",
            })
          );


        const newItems =
          validItems.map(
            mapFormToBackend
          );


        // ====================================================
        // MERGE EXISTING + NEW
        // ====================================================

        const mergedByDisease =
          new Map();


        existingItems.forEach(
          (item) => {

            const key =
              item.disease
                .trim()
                .toLowerCase();


            mergedByDisease.set(
              key,
              item
            );
          }
        );


        newItems.forEach(
          (item) => {

            const key =
              item.disease
                .trim()
                .toLowerCase();


            mergedByDisease.set(
              key,
              item
            );
          }
        );


        const mergedItems =
          Array.from(
            mergedByDisease.values()
          );


        // ====================================================
        // SUBMIT MERGED REPORT
        // ====================================================

        await api.submitWeeklyReport(
          mergedItems,
          currentWeek,
          currentYear
        );


        setSuccess(
          "New disease submitted successfully."
        );


        // ====================================================
        // CLEAR FORM
        // ====================================================

        setItems([
          createEmptyDisease(),
        ]);

      } catch (err) {

        setError(
          err.message ||
          "Unable to submit the disease report."
        );

      } finally {

        setLoading(false);
      }
    };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loadingExisting) {

    return (
      <div className="bg-white rounded-2xl border border-[#E3E9E5] p-8 shadow-sm">

        <div className="flex items-center justify-center">

          <p className="text-[14px] text-[#52606D]">
            Loading submitted report...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >

      {/* ====================================================
          MODE INDICATOR
      ==================================================== */}

      <div
        className={`rounded-xl px-4 py-3 border ${
          isEditMode
            ? "bg-[#EEF7F1] border-[#B8DEC6]"
            : "bg-[#F5FAF7] border-[#CDE5D5]"
        }`}
      >

        <p className="text-[13px] font-medium text-[#087A32]">

          {isEditMode
            ? "Editing previously submitted report"
            : "Adding a new disease"}

        </p>


        <p className="text-[12px] text-[#52606D] mt-1">

          {isEditMode
            ? "Your previously submitted disease information is shown below and can be modified."
            : "This is a fresh disease entry. Previously submitted diseases are not shown here."}

        </p>

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {error && (
        <div className="rounded-xl border border-[#F0CACA] bg-[#FFF5F5] px-4 py-3">

          <p className="text-[13px] text-[#C62828]">
            {error}
          </p>

        </div>
      )}


      {/* ====================================================
          SUCCESS
      ==================================================== */}

      {success && (
        <div className="rounded-xl border border-[#B8DEC6] bg-[#F0FAF3] px-4 py-3">

          <p className="text-[13px] text-[#087A32]">
            {success}
          </p>

        </div>
      )}


      {/* ====================================================
          DISEASE ENTRIES
      ==================================================== */}

      {items.map(
        (item, index) => (

          <div
            key={index}
            className="bg-white rounded-2xl border border-[#E3E9E5] shadow-sm p-6"
          >

            <div className="flex items-center justify-between mb-5">

              <div>

                <h3 className="text-[17px] font-semibold text-[#102A43]">
                  Disease {index + 1}
                </h3>


                <p className="text-[12px] text-[#7B8794] mt-1">
                  Enter verified surveillance information.
                </p>

              </div>


              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    removeDisease(index)
                  }
                  className="text-[12px] font-medium text-[#C62828] hover:text-[#A61B1B] flex items-center gap-1"
                >

                  <Trash2 className="w-4 h-4" />

                  Remove

                </button>
              )}

            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* ==================================================
                  DISEASE
              ================================================== */}

              <div>

                <label className="block text-[12px] font-semibold text-[#334E68] mb-2">
                  Disease
                </label>


                <select
                  value={item.disease}
                  onChange={(event) =>
                    updateDisease(
                      index,
                      "disease",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#D9E2DC] bg-white px-4 py-3 text-[13px] text-[#102A43] outline-none focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
                >

                  <option value="">
                    Select disease
                  </option>


                  {DISEASES.map(
                    (disease) => (

                      <option
                        key={disease}
                        value={disease}
                      >
                        {disease}
                      </option>

                    )
                  )}

                </select>

              </div>


              {/* ==================================================
                  CONFIRMED CASES
              ================================================== */}

              <div>

                <label className="block text-[12px] font-semibold text-[#334E68] mb-2">
                  Confirmed Cases
                </label>


                <input
                  type="number"
                  min="0"
                  value={
                    item.confirmed_cases
                  }
                  onChange={(event) =>
                    updateDisease(
                      index,
                      "confirmed_cases",
                      event.target.value
                    )
                  }
                  placeholder="Enter confirmed cases"
                  className="w-full rounded-xl border border-[#D9E2DC] bg-white px-4 py-3 text-[13px] text-[#102A43] outline-none focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
                />

              </div>


              {/* ==================================================
                  SUSPECTED CASES
              ================================================== */}

              <div>

                <label className="block text-[12px] font-semibold text-[#334E68] mb-2">
                  Suspected Cases
                </label>


                <input
                  type="number"
                  min="0"
                  value={
                    item.suspected_cases
                  }
                  onChange={(event) =>
                    updateDisease(
                      index,
                      "suspected_cases",
                      event.target.value
                    )
                  }
                  placeholder="Enter suspected cases"
                  className="w-full rounded-xl border border-[#D9E2DC] bg-white px-4 py-3 text-[13px] text-[#102A43] outline-none focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
                />

              </div>


              {/* ==================================================
                  SEVERITY
              ================================================== */}

              <div>

                <label className="block text-[12px] font-semibold text-[#334E68] mb-2">
                  Severity
                </label>


                <select
                  value={item.severity}
                  onChange={(event) =>
                    updateDisease(
                      index,
                      "severity",
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#D9E2DC] bg-white px-4 py-3 text-[13px] text-[#102A43] outline-none focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
                >

                  <option value="">
                    Select severity
                  </option>


                  <option value="Low">
                    Low
                  </option>


                  <option value="Moderate">
                    Moderate
                  </option>


                  <option value="High">
                    High
                  </option>

                </select>

              </div>


              {/* ==================================================
                  REMARKS
              ================================================== */}

              <div className="md:col-span-2">

                <label className="block text-[12px] font-semibold text-[#334E68] mb-2">
                  Remarks
                </label>


                <textarea
                  value={item.remarks}
                  onChange={(event) =>
                    updateDisease(
                      index,
                      "remarks",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Enter relevant remarks..."
                  className="w-full rounded-xl border border-[#D9E2DC] bg-white px-4 py-3 text-[13px] text-[#102A43] outline-none resize-none focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
                />

              </div>


              {/* ==================================================
                  PREVENTIVE MEASURES
              ================================================== */}

              <div className="md:col-span-2">

                <label className="block text-[12px] font-semibold text-[#334E68] mb-2">
                  Preventive Measures
                </label>


                <textarea
                  value={
                    item.preventive_measures
                  }
                  onChange={(event) =>
                    updateDisease(
                      index,
                      "preventive_measures",
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Enter preventive measures..."
                  className="w-full rounded-xl border border-[#D9E2DC] bg-white px-4 py-3 text-[13px] text-[#102A43] outline-none resize-none focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
                />

              </div>

            </div>

          </div>

        )
      )}


      {/* ====================================================
          ADD ANOTHER DISEASE
      ==================================================== */}

      <button
        type="button"
        onClick={addDisease}
        className="w-full rounded-xl border border-dashed border-[#55A978] bg-white hover:bg-[#F7FCF9] px-5 py-4 text-[#087A32] font-semibold text-[13px] transition flex items-center justify-center gap-2"
      >

        <Plus className="w-4 h-4" />

        Add Another Disease

      </button>


      {/* ====================================================
          SUBMIT
      ==================================================== */}

      <div className="flex justify-end pt-2">

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#087A32] hover:bg-[#076B2C] disabled:opacity-60 px-6 py-3 text-[13px] font-semibold text-white transition flex items-center gap-2"
        >

          {isEditMode ? (

            <>

              <Save className="w-4 h-4" />

              {loading
                ? "Updating..."
                : "Update Weekly Report"}

            </>

          ) : (

            <>

              <Send className="w-4 h-4" />

              {loading
                ? "Submitting..."
                : "Submit Disease"}

            </>

          )}

        </button>

      </div>

    </form>
  );
}