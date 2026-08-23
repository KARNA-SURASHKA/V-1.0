const COLORS = [
  "#0B7A33",
  "#4CAF50",
  "#F59E0B",
  "#EF4444",
];

export default function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.cases, 0);

  return (
    <div className="space-y-4">

      {data.map((item, index) => {
        const percentage = ((item.cases / total) * 100).toFixed(1);

        return (
          <div
            key={item.disease}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">

              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />

              <span className="font-medium">
                {item.disease}
              </span>

            </div>

            <div className="text-right">
              <p className="font-semibold">
                {item.cases}
              </p>

              <p className="text-sm text-gray-500">
                {percentage}%
              </p>
            </div>

          </div>
        );
      })}

      <div className="mt-6 h-5 rounded-full overflow-hidden flex">

        {data.map((item, index) => (
          <div
            key={item.disease}
            style={{
              width: `${(item.cases / total) * 100}%`,
              backgroundColor: COLORS[index % COLORS.length],
            }}
          />
        ))}

      </div>

    </div>
  );
}