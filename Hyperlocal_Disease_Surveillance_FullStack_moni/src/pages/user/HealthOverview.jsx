import {
  Activity,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
} from "lucide-react";


export default function HealthOverview({
  dashboardData,
  loading,
  error,
}) {

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div
        className="
          w-full
          max-w-[1500px]
          mx-auto
          px-5
          sm:px-6
          lg:px-8
          py-6
          sm:py-8
        "
      >

        <div
          className="
            rounded-3xl
            border
            border-[#E7E2D8]
            bg-white
            p-12
            text-center
            shadow-sm
          "
        >

          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-[#E8E2D8]
              border-t-[#0B7A33]
            "
          />

          <p
            className="
              mt-4
              text-[14px]
              text-[#7A8598]
            "
          >
            Loading health overview...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (
      <div
        className="
          w-full
          max-w-[1500px]
          mx-auto
          px-5
          sm:px-6
          lg:px-8
          py-6
          sm:py-8
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            px-6
            py-5
            text-[14px]
            text-red-700
          "
        >
          {error}
        </div>

      </div>
    );
  }


  // ==========================================================
  // NO DATA
  // ==========================================================

  if (!dashboardData) {

    return (
      <div
        className="
          w-full
          max-w-[1500px]
          mx-auto
          px-5
          sm:px-6
          lg:px-8
          py-6
          sm:py-8
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-[#E8E2D8]
            bg-white
            p-8
            text-center
          "
        >

          <Activity
            size={28}
            className="
              mx-auto
              text-[#0B7A33]
            "
          />

          <h2
            className="
              mt-4
              text-[18px]
              font-semibold
              text-[#1F3144]
            "
          >
            Health Overview
          </h2>

          <p
            className="
              mt-1
              text-[14px]
              text-[#7A8598]
            "
          >
            Health surveillance information is
            currently unavailable.
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // DATA
  // ==========================================================

  const totalCases =
    dashboardData.total_cases ??
    dashboardData.totalCases ??
    dashboardData.cases ??
    dashboardData.current_cases ??
    0;


  const riskLevel =
    dashboardData.risk_level ??
    dashboardData.riskLevel ??
    dashboardData.risk ??
    "—";


  const topDisease =
    dashboardData.top_disease ??
    dashboardData.topDisease ??
    dashboardData.most_common_disease ??
    "—";


  const activeDiseases =
    dashboardData.diseases?.length ??
    dashboardData.distribution?.length ??
    0;


  // ==========================================================
  // HEALTH SUMMARY CARDS
  // ==========================================================

  const cards = [
    {
      title: "Total Cases",
      value: totalCases,
      description: "Reported cases",
      icon: Activity,
      iconBg: "bg-[#EAF6EE]",
      iconColor: "text-[#0B7A33]",
    },

    {
      title: "Current Risk",
      value: riskLevel,
      description: "Current surveillance level",
      icon: AlertTriangle,
      iconBg: "bg-[#FFF4E5]",
      iconColor: "text-[#C46A00]",
    },

    {
      title: "Top Disease",
      value: topDisease,
      description: "Most reported disease",
      icon: Stethoscope,
      iconBg: "bg-[#EEF4FF]",
      iconColor: "text-[#3976D2]",
    },

    {
      title: "Disease Categories",
      value: activeDiseases || "—",
      description: "Diseases under surveillance",
      icon: ShieldCheck,
      iconBg: "bg-[#F2EEFF]",
      iconColor: "text-[#7C52D9]",
    },
  ];


  return (
    <div
      className="
        w-full
        max-w-[1500px]
        mx-auto
        px-5
        sm:px-6
        lg:px-8
        py-6
        sm:py-8
      "
    >

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="mb-6">

        <h2
          className="
            text-[30px]
            sm:text-[34px]
            font-bold
            text-[#13264B]
          "
        >
          Health Overview
        </h2>

        <p
          className="
            mt-1
            text-[14px]
            sm:text-[15px]
            text-[#667085]
          "
        >
          A quick overview of the current health
          and disease surveillance status.
        </p>

      </div>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-4
          gap-4
          mb-6
        "
      >

        {cards.map((card) => {

          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="
                rounded-2xl
                border
                border-[#E7E2D8]
                bg-white
                p-5
                shadow-sm
              "
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-[#9A9489]
                    "
                  >
                    {card.title}
                  </p>

                  <p
                    className="
                      mt-2
                      text-[26px]
                      font-bold
                      text-[#13264B]
                    "
                  >
                    {String(card.value)}
                  </p>

                  <p
                    className="
                      mt-1
                      text-[12px]
                      text-[#7A8598]
                    "
                  >
                    {card.description}
                  </p>

                </div>


                <div
                  className={`
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    ${card.iconBg}
                    ${card.iconColor}
                  `}
                >

                  <Icon size={20} />

                </div>

              </div>

            </div>
          );

        })}

      </div>


      {/* =====================================================
          CURRENT HEALTH STATUS
      ===================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2
          gap-5
        "
      >

        {/* ===================================================
            SURVEILLANCE STATUS
        =================================================== */}

        <div
          className="
            rounded-3xl
            border
            border-[#E7E2D8]
            bg-white
            p-6
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-[#EAF6EE]
                text-[#0B7A33]
              "
            >

              <TrendingUp
                size={21}
              />

            </div>


            <div>

              <h3
                className="
                  text-[19px]
                  font-semibold
                  text-[#13264B]
                "
              >
                Surveillance Status
              </h3>

              <p
                className="
                  mt-0.5
                  text-[13px]
                  text-[#7A8598]
                "
              >
                Current disease surveillance overview
              </p>

            </div>

          </div>


          <div
            className="
              mt-6
              rounded-2xl
              border
              border-[#E7E2D8]
              bg-[#FCFAF6]
              p-5
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >

              <div>

                <p
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-[#9A9489]
                  "
                >
                  Current Risk Level
                </p>

                <p
                  className="
                    mt-2
                    text-[24px]
                    font-bold
                    text-[#13264B]
                  "
                >
                  {String(riskLevel)}
                </p>

              </div>


              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[#EAF6EE]
                  text-[#0B7A33]
                "
              >

                <ShieldCheck
                  size={23}
                />

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            DISEASE STATUS
        =================================================== */}

        <div
          className="
            rounded-3xl
            border
            border-[#E7E2D8]
            bg-white
            p-6
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-[#EEF4FF]
                text-[#3976D2]
              "
            >

              <Stethoscope
                size={21}
              />

            </div>


            <div>

              <h3
                className="
                  text-[19px]
                  font-semibold
                  text-[#13264B]
                "
              >
                Disease Status
              </h3>

              <p
                className="
                  mt-0.5
                  text-[13px]
                  text-[#7A8598]
                "
              >
                Key disease information
              </p>

            </div>

          </div>


          <div
            className="
              mt-6
              space-y-3
            "
          >

            <div
              className="
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-[#E7E2D8]
                px-4
                py-3
              "
            >

              <span
                className="
                  text-[13px]
                  text-[#667085]
                "
              >
                Most Reported Disease
              </span>

              <span
                className="
                  text-[14px]
                  font-semibold
                  text-[#13264B]
                "
              >
                {String(topDisease)}
              </span>

            </div>


            <div
              className="
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-[#E7E2D8]
                px-4
                py-3
              "
            >

              <span
                className="
                  text-[13px]
                  text-[#667085]
                "
              >
                Total Reported Cases
              </span>

              <span
                className="
                  text-[14px]
                  font-semibold
                  text-[#13264B]
                "
              >
                {String(totalCases)}
              </span>

            </div>


            <div
              className="
                flex
                items-center
                justify-between
                rounded-xl
                border
                border-[#E7E2D8]
                px-4
                py-3
              "
            >

              <span
                className="
                  text-[13px]
                  text-[#667085]
                "
              >
                Diseases Under Surveillance
              </span>

              <span
                className="
                  text-[14px]
                  font-semibold
                  text-[#13264B]
                "
              >
                {String(activeDiseases || "—")}
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}