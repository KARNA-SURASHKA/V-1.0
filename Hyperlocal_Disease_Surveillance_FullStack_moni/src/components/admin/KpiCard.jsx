export default function KpiCard({
  label,
  value,
  icon: Icon,
  note,
  trend,
  tone = "green",
}) {

  const tones = {

    green: {
      background: "#EDF8F0",
      color: "#07883A",
    },

    blue: {
      background: "#EAF4FC",
      color: "#0878C9",
    },

    amber: {
      background: "#FFF6E6",
      color: "#F08A00",
    },

    red: {
      background: "#FFF0F0",
      color: "#D72A35",
    },

  };


  const selected =
    tones[tone] ||
    tones.green;


  return (

    <div className="admin-kpi-card">

      <div
        className="admin-kpi-icon"
        style={{
          backgroundColor:
            selected.background,
          color:
            selected.color,
        }}
      >

        {Icon && (
          <Icon
            size={25}
            strokeWidth={1.65}
          />
        )}

      </div>


      <div className="admin-kpi-content">

        <p className="admin-kpi-label">
          {label}
        </p>


        <p className="admin-kpi-value">
          {value}
        </p>


        {note && (
          <p className="admin-kpi-note">
            {note}
          </p>
        )}


        {trend && (
          <p
            className="admin-kpi-trend"
            style={{
              color:
                selected.color,
            }}
          >
            {trend}
          </p>
        )}

      </div>

    </div>

  );

}