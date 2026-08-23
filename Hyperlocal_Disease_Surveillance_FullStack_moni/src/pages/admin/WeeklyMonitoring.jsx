import { useEffect, useState } from "react";

import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { api } from "../../api";

export default function WeeklyMonitoring({
  location,
}) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    setLoading(true);

    api
      .getMonitoring({
        state_id: location.state?.id,
        district_id: location.district?.id,
        taluk_id: location.taluk?.id,
      })

      .then(setRows)

      .catch((e) =>
        setError(e.message)
      )

      .finally(() =>
        setLoading(false)
      );

  }, [
    location.state?.id,
    location.district?.id,
    location.taluk?.id,
  ]);

  const submitted =
    rows.filter(
      (r) => r.submitted
    ).length;

  const pending =
    rows.length - submitted;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} />;
  }

  return (
    <div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">

        <div>

          <h2 className="text-[20px] font-semibold text-[#1F3144]">
            Weekly Monitoring
          </h2>

          <p className="text-[13px] text-[#7A8598] mt-1">
            Track who has submitted and who still needs to report.
          </p>

        </div>

        <div className="flex gap-2">

          <Stat
            label="Submitted"
            value={submitted}
          />

          <Stat
            label="Pending"
            value={pending}
            danger={pending > 0}
          />

        </div>

      </div>

      <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-[13.5px]">

            <thead className="bg-[#F6F3ED] text-[#445064] text-left">

              <tr>

                <th className="px-4 py-3 font-medium">
                  Taluk
                </th>

                <th className="px-4 py-3 font-medium">
                  Assigned Agent
                </th>

                <th className="px-4 py-3 font-medium">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {rows.map((r) => (

                <tr
                  key={r.taluk_id}
                  className="border-t border-[#E8E2D8]"
                >

                  <td className="px-4 py-3 font-medium text-[#1F3144]">
                    {r.taluk_name}
                  </td>

                  <td className="px-4 py-3 text-[#7A8598]">
                    {r.agent_name}
                  </td>

                  <td className="px-4 py-3">

                    {r.submitted ? (

                      <span className="flex items-center gap-1.5 text-[#0B7A33] font-medium">
                        <CheckCircle2 size={16} />
                        Submitted
                      </span>

                    ) : (

                      <span className="flex items-center gap-1.5 text-[#C62828] font-medium">
                        <XCircle size={16} />
                        Pending
                      </span>

                    )}

                  </td>

                </tr>

              ))}

              {!rows.length && (

                <tr>

                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-[#7A8598]"
                  >
                    No agents found for this location.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

function Stat({
  label,
  value,
  danger,
}) {
  return (
    <div className="bg-white border border-[#E8E2D8] rounded-xl px-3.5 py-2 min-w-[82px]">

      <p className="text-[10px] text-[#8A94A3]">
        {label}
      </p>

      <p
        className={`
          font-bold text-[18px]
          ${
            danger
              ? "text-[#C62828]"
              : "text-[#1F3144]"
          }
        `}
      >
        {value}
      </p>

    </div>
  );
}

function Loading() {
  return (
    <p className="text-[14px] text-[#7A8598]">
      Loading monitoring…
    </p>
  );
}

function Error({ message }) {
  return (
    <p className="text-[14px] text-[#C62828]">
      {message}
    </p>
  );
}