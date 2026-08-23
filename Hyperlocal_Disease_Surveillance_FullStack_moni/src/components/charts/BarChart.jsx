export default function BarChart({ data }) {
  const maxCases = Math.max(...data.map((item) => item.cases));

  return (
    <div className="space-y-5">
      {data.map((item) => (
        <div key={item.week}>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              {item.week}
            </span>

            <span className="text-sm font-semibold text-[#1F2937]">
              {item.cases}
            </span>
          </div>

          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0B7A33] rounded-full transition-all duration-700"
              style={{
                width: `${(item.cases / maxCases) * 100}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}