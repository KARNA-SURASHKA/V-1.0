import { useEffect, useState } from "react";

import {
  api,
  DISEASES,
} from "../../api";

import RiskBadge from "../../components/RiskBadge";
import { classifyRisk } from "../../utils/risk";

export default function DiseaseReports({
  location,
}) {
  const [reports, setReports] = useState([]);
  const [disease, setDisease] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {

    setLoading(true);
    setError("");

    const params = {
      state_id: location.state?.id,
      district_id: location.district?.id,
      taluk_id: location.taluk?.id,
    };

    if (disease) {
      params.disease = disease;
    }

    api
      .getAllReports(params)
      .then(setReports)
      .catch((e) =>
        setError(e.message)
      )
      .finally(() =>
        setLoading(false)
      );
  };

  useEffect(
    load,
    [
      disease,
      location.state?.id,
      location.district?.id,
      location.taluk?.id,
    ]
  );

  return (
    <div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">

        <h2 className="text-[20px] font-semibold text-[#1F3144]">
          Disease Reports
        </h2>

        <select
          value={disease}
          onChange={(e) =>
            setDisease(e.target.value)
          }
          className="rounded-lg border border-[#E8E2D8] px-3 py-2 text-[14px] text-[#1F3144]"
        >

          <option value="">
            All Diseases
          </option>

          {DISEASES.map((d) => (
            <option
              key={d}
              value={d}
            >
              {d}
            </option>
          ))}

        </select>

      </div>

      {error && (
        <p className="text-[13px] text-[#C62828] mb-4">
          {error}
        </p>
      )}

      {loading ? (

        <p className="text-[14px] text-[#7A8598]">
          Loading...
        </p>

      ) : (

        <div className="bg-white rounded-xl border border-[#E8E2D8] overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-[14px]">

              <thead className="bg-[#F6F3ED] text-[#445064] text-left">

                <tr>

                  <th className="px-4 py-3 font-medium">
                    Week
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Taluk
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Disease
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Cases
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Risk
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Agent
                  </th>

                </tr>

              </thead>

              <tbody>

                {reports.map((r) => (

                  <tr
                    key={r.id}
                    className="border-t border-[#E8E2D8]"
                  >

                    <td className="px-4 py-3 text-[#1F3144]">
                      {r.week_number}
                    </td>

                    <td className="px-4 py-3 text-[#1F3144] font-medium">
                      {r.taluk_name}
                    </td>

                    <td className="px-4 py-3 text-[#1F3144]">
                      {r.disease}
                    </td>

                    <td className="px-4 py-3 text-[#1F3144] font-medium">
                      {r.cases}
                    </td>

                    <td className="px-4 py-3">
                      <RiskBadge
                        level={classifyRisk(r.cases)}
                      />
                    </td>

                    <td className="px-4 py-3 text-[#7A8598]">
                      {r.agent_name}
                    </td>

                  </tr>

                ))}

                {reports.length === 0 && (

                  <tr>

                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-[#7A8598]"
                    >
                      No reports found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}