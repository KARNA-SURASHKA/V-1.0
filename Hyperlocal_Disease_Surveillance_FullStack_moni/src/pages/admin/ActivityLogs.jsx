import {
  useEffect,
  useState,
} from "react";

import { ScrollText } from "lucide-react";

import { api } from "../../api";

export default function ActivityLogs() {
  const [logs, setLogs] =
    useState([]);

  const [error, setError] =
    useState("");

  useEffect(() => {

    api
      .getActivityLogs()
      .then(setLogs)
      .catch((e) =>
        setError(e.message)
      );

  }, []);

  return (
    <div>

      <div className="mb-5">

        <h2 className="text-[20px] font-semibold text-[#1F3144]">
          Activity Logs
        </h2>

        <p className="text-[13px] text-[#7A8598] mt-1">
          Recent administrative actions recorded by the platform.
        </p>

      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-[#FBEAEA] p-3 text-[13px] text-[#C62828]">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E8E2D8] overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-[13.5px]">

            <thead className="bg-[#F6F3ED] text-[#445064] text-left">

              <tr>

                <th className="px-4 py-3 font-medium">
                  Time
                </th>

                <th className="px-4 py-3 font-medium">
                  Action
                </th>

                <th className="px-4 py-3 font-medium">
                  Details
                </th>

              </tr>

            </thead>

            <tbody>

              {logs.map((log) => (

                <tr
                  key={log.id}
                  className="border-t border-[#E8E2D8]"
                >

                  <td className="px-4 py-3 whitespace-nowrap text-[#7A8598]">
                    {new Date(
                      log.created_at
                    ).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 font-semibold text-[#1F3144]">
                    {log.action}
                  </td>

                  <td className="px-4 py-3 text-[#7A8598]">
                    {log.details || "—"}
                  </td>

                </tr>

              ))}

              {!logs.length && (

                <tr>

                  <td
                    colSpan={3}
                    className="px-4 py-10 text-center text-[#7A8598]"
                  >

                    <ScrollText
                      size={24}
                      className="mx-auto mb-2 text-[#B1AA9E]"
                    />

                    No activity has been recorded yet.

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