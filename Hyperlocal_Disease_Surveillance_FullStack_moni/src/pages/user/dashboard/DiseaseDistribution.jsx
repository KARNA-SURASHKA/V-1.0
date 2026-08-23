import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";


export default function DiseaseDistribution({
  dashboardData,
}) {

  // ==========================================================
  // BUILD DISEASE DATA
  // ==========================================================

  const rawDiseases =
    dashboardData?.diseases ||
    dashboardData?.disease_distribution ||
    dashboardData?.diseaseDistribution ||
    dashboardData?.distribution ||
    [];


  const data = Array.isArray(rawDiseases)
    ? rawDiseases
        .map((item) => {

          const name =
            item?.name ||
            item?.disease ||
            item?.disease_name ||
            item?.label ||
            "Unknown";


          const value =
            Number(
              item?.percentage ??
              item?.percent ??
              item?.value ??
              item?.count ??
              item?.cases ??
              item?.total ??
              0
            );


          return {
            name,
            value,
          };

        })
        .filter(
          (item) =>
            item.value > 0
        )
    : [];


  // ==========================================================
  // FALLBACK
  // ==========================================================

  const chartData =
    data.length > 0
      ? data
      : [];


  // ==========================================================
  // COLORS
  // ==========================================================

  const COLORS = [
    "#16A34A",
    "#3B82F6",
    "#F59E0B",
    "#8B5CF6",
    "#EF4444",
    "#06B6D4",
    "#EC4899",
    "#84CC16",
  ];


  // ==========================================================
  // TOTAL
  // ==========================================================

  const total =
    chartData.reduce(
      (sum, item) =>
        sum + item.value,
      0
    );


  // ==========================================================
  // PERCENTAGE
  // ==========================================================

  const getPercentage = (
    value
  ) => {

    if (!total) {
      return 0;
    }

    return Math.round(
      (value / total) * 100
    );

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div
      className="
        w-full
        rounded-3xl
        border
        border-[#E7E2D8]
        bg-white
        shadow-sm
        px-6
        py-6
      "
    >

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div>

        <h2
          className="
            text-[26px]
            font-bold
            text-[#13264B]
          "
        >
          Disease Distribution
        </h2>

        <p
          className="
            mt-1
            text-[14px]
            text-[#667085]
          "
        >
          Current disease composition
        </p>

      </div>


      {/* ====================================================
          CONTENT
      ==================================================== */}

      {chartData.length === 0 ? (

        <div
          className="
            mt-8
            flex
            h-[260px]
            items-center
            justify-center
            rounded-2xl
            bg-[#F8F7F3]
            text-[14px]
            text-[#7A8598]
          "
        >
          No disease distribution data available.
        </div>

      ) : (

        <div
          className="
            mt-5
            grid
            grid-cols-1
            lg:grid-cols-[420px_1fr]
            items-center
            gap-8
          "
        >

          {/* ==================================================
              DONUT CHART
          ================================================== */}

          <div
            className="
              h-[280px]
              w-full
            "
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <PieChart>

                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={110}
                  paddingAngle={2}
                  startAngle={90}
                  endAngle={-270}
                  stroke="#FFFFFF"
                  strokeWidth={3}
                >

                  {chartData.map(
                    (
                      entry,
                      index
                    ) => (

                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                            index %
                            COLORS.length
                          ]
                        }
                      />

                    )
                  )}

                </Pie>


                <Tooltip
                  formatter={(
                    value,
                    name
                  ) => [
                    `${getPercentage(
                      Number(value)
                    )}%`,
                    name,
                  ]}
                />

              </PieChart>

            </ResponsiveContainer>

          </div>


          {/* ==================================================
              DISEASE LIST
          ================================================== */}

          <div
            className="
              flex
              flex-col
              gap-4
            "
          >

            {chartData.map(
              (
                disease,
                index
              ) => {

                const percentage =
                  getPercentage(
                    disease.value
                  );


                return (
                  <div
                    key={`${disease.name}-${index}`}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >

                    <div
                      className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                      "
                    >

                      <span
                        className="
                          h-2.5
                          w-2.5
                          shrink-0
                          rounded-full
                        "
                        style={{
                          backgroundColor:
                            COLORS[
                              index %
                              COLORS.length
                            ],
                        }}
                      />

                      <span
                        className="
                          truncate
                          text-[14px]
                          text-[#344054]
                        "
                      >
                        {disease.name}
                      </span>

                    </div>


                    <span
                      className="
                        shrink-0
                        text-[14px]
                        font-semibold
                        text-[#13264B]
                      "
                    >
                      {percentage}%
                    </span>

                  </div>
                );

              }
            )}

          </div>

        </div>

      )}

    </div>
  );
}