import {
  Activity,
  ShieldCheck,
  Bug,
  TrendingUp,
} from "lucide-react";


const riskStyles = {
  Low: {
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
  },

  Moderate: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-500",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },

  High: {
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
  },

  Critical: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
  },
};


export default function SummaryCard({
  dashboardData,
}) {

  const totalCases =
    dashboardData?.cards?.reduce(
      (sum, item) =>
        sum + Number(item.cases || 0),
      0
    ) || 0;


  const dominant =
    dashboardData?.cards?.[0];


  const risk =
    dashboardData?.overall_risk ||
    "Low";


  const styles =
    riskStyles[risk] ||
    riskStyles.Low;


  const trend =
    dashboardData?.trend || [];


  let weeklyChange =
    null;


  if (trend.length >= 2) {

    const previous =
      Number(
        trend[trend.length - 2]
          .total_cases
      );

    const current =
      Number(
        trend[trend.length - 1]
          .total_cases
      );

    if (previous > 0) {

      weeklyChange =
        Math.round(
          ((current - previous) /
            previous) *
            100
        );

    }

  }


  const cards = [

    {
      title: "Active Cases",
      value: totalCases,
      subtitle: "Total Reported",
      footer:
        totalCases === 0
          ? "No active reports"
          : "Current surveillance reports",
      footerColor:
        "text-red-500",
      icon: Activity,
      iconBg:
        "bg-red-100",
      iconColor:
        "text-red-500",
    },


    {
      title: "Risk Level",
      value: risk,
      subtitle: "Current Risk",
      badge:
        risk === "Low"
          ? "Low Risk"
          : risk === "Moderate"
            ? "Stay Alert"
            : "Immediate Attention",
      badgeBg:
        styles.badgeBg,
      badgeText:
        styles.badgeText,
      icon: ShieldCheck,
      iconBg:
        styles.iconBg,
      iconColor:
        styles.iconColor,
    },


    {
      title: "Dominant Disease",
      value:
        dominant?.disease ||
        "None",
      subtitle:
        "Most Reported",
      footer:
        dominant
          ? `${dominant.cases} cases`
          : "No reports",
      footerColor:
        "text-green-600",
      icon: Bug,
      iconBg:
        "bg-green-100",
      iconColor:
        "text-green-600",
    },


    {
      title: "Weekly Trend",
      value:
        weeklyChange === null
          ? "—"
          : `${weeklyChange >= 0 ? "+" : ""}${weeklyChange}%`,
      subtitle:
        "vs Previous Week",
      badge:
        weeklyChange === null
          ? "Not enough data"
          : weeklyChange > 0
            ? "Increasing"
            : weeklyChange < 0
              ? "Decreasing"
              : "Stable",
      badgeBg:
        weeklyChange > 0
          ? "bg-blue-100"
          : weeklyChange < 0
            ? "bg-green-100"
            : "bg-gray-100",
      badgeText:
        weeklyChange > 0
          ? "text-blue-600"
          : weeklyChange < 0
            ? "text-green-600"
            : "text-gray-600",
      icon: TrendingUp,
      iconBg:
        "bg-blue-100",
      iconColor:
        "text-blue-600",
    },

  ];


  return (
    <section className="space-y-5">

      <h2 className="
        text-[20px]
        font-bold
        text-[#13264B]
      ">
        Health Overview
      </h2>


      <div className="
        grid
        grid-cols-1
        gap-6
        md:grid-cols-2
        xl:grid-cols-4
      ">

        {cards.map(
          (
            card,
            index
          ) => {

            const Icon =
              card.icon;

            return (

              <div
                key={index}
                className="
                  relative
                  rounded-[22px]
                  border
                  border-[#E9E2D6]
                  bg-white
                  p-6
                  shadow-[0_4px_18px_rgba(0,0,0,0.05)]
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)]
                "
              >

                <div className="
                  flex
                  items-start
                  justify-between
                ">

                  <div>

                    <p className="
                      text-[15px]
                      text-[#667085]
                    ">
                      {card.title}
                    </p>

                    <h3 className="
                      mt-3
                      text-[28px]
                      font-bold
                      leading-none
                      text-[#13264B]
                    ">
                      {card.value}
                    </h3>

                  </div>


                  <div className={`
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-full
                    ${card.iconBg}
                  `}>

                    <Icon
                      size={28}
                      className={
                        card.iconColor
                      }
                      strokeWidth={2}
                    />

                  </div>

                </div>


                <p className="
                  mt-6
                  text-[16px]
                  text-[#667085]
                ">
                  {card.subtitle}
                </p>


                <div className="mt-6">

                  {card.badge ? (

                    <span className={`
                      inline-flex
                      items-center
                      rounded-full
                      px-3
                      py-1
                      text-[13px]
                      font-medium
                      ${card.badgeBg}
                      ${card.badgeText}
                    `}>
                      {card.badge}
                    </span>

                  ) : (

                    <p className={`
                      text-[16px]
                      font-medium
                      ${card.footerColor}
                    `}>
                      {card.footer}
                    </p>

                  )}

                </div>

              </div>

            );
          }
        )}

      </div>

    </section>
  );
}