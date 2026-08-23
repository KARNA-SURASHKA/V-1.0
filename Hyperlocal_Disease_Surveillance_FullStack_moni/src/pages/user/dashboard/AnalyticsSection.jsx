import {
  ChevronDown,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";


export default function AnalyticsSection({
  dashboardData,
}) {

  const data =
    dashboardData?.trend?.map(
      (item) => ({
        week:
          item.week_label,
        cases:
          Number(
            item.total_cases || 0
          ),
      })
    ) || [];


  return (
    <div
      className="
        w-full
        rounded-3xl
        border
        border-[#E7E2D8]
        bg-white
        shadow-sm
        flex
        flex-col
      "
    >

      {/* ==================================================
          HEADER
      ================================================== */}

      <div
        className="
          flex
          items-start
          justify-between
          px-7
          pt-7
        "
      >

        <div>

          <h2
            className="
              text-[30px]
              font-bold
              text-[#13264B]
            "
          >
            Disease Analytics
          </h2>

          <p
            className="
              mt-1
              text-[15px]
              text-gray-500
            "
          >
            Weekly Cases Trend
          </p>

        </div>


        <button
          type="button"
          className="
            flex
            items-center
            gap-2
            rounded-xl
            border
            border-[#E5E7EB]
            bg-white
            px-4
            py-2
            text-[14px]
            font-medium
            text-gray-700
          "
        >
          4 Weeks

          <ChevronDown
            size={16}
          />

        </button>

      </div>


      {/* ==================================================
          CHART
      ================================================== */}

      <div
        className="
          w-full
          h-[400px]
          px-5
          pt-6
          pb-6
        "
      >

        {data.length === 0 ? (

          <div
            className="
              h-full
              flex
              items-center
              justify-center
              text-gray-400
              text-sm
            "
          >
            No weekly trend data available.
          </div>

        ) : (

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <BarChart
              data={data}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 10,
              }}
            >

              <CartesianGrid
                vertical={false}
                stroke="#ECECEC"
              />


              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 13,
                  fill: "#6B7280",
                }}
              />


              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 13,
                  fill: "#6B7280",
                }}
              />


              <Tooltip
                cursor={{
                  fill: "#F8FAFC",
                }}
              />


              <Bar
                dataKey="cases"
                fill="#16A34A"
                radius={[
                  8,
                  8,
                  0,
                  0,
                ]}
                barSize={42}
              />

            </BarChart>

          </ResponsiveContainer>

        )}

      </div>

    </div>
  );
}