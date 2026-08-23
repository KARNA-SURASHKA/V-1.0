import {
  MapPin,
  Activity,
  ShieldAlert,
  Users,
  Thermometer,
} from "lucide-react";


export default function LocalityCard({
  taluk,
  dashboardData,
}) {

  const location =
    taluk?.talukName ||
    taluk?.name ||
    "Selected Location";


  const district =
    taluk?.districtName ||
    "";


  const totalCases =
    dashboardData?.cards?.reduce(
      (sum, item) =>
        sum + Number(item.cases || 0),
      0
    ) || 0;


  const risk =
    dashboardData?.overall_risk ||
    "Low";


  return (
    <div className="
      bg-white
      border
      border-[#E7E2D8]
      rounded-[24px]
      shadow-sm
      overflow-hidden
      h-full
    ">

      <div className="
        flex
        items-center
        gap-3
        px-6
        py-5
        border-b
        border-[#EFE9DD]
      ">

        <MapPin
          size={22}
          className="text-red-500"
        />

        <div>

          <h3 className="
            text-[24px]
            font-bold
            text-[#13264B]
          ">
            Selected Location
          </h3>

          <p className="
            text-[14px]
            text-gray-500
          ">
            Hyperlocal disease information
          </p>

        </div>

      </div>


      <div className="p-6">

        <div className="
          rounded-2xl
          bg-[#F8FAFC]
          border
          border-[#ECECEC]
          p-5
        ">

          <p className="
            uppercase
            tracking-wider
            text-[12px]
            text-gray-500
          ">
            Taluk
          </p>

          <h2 className="
            mt-1
            text-[30px]
            font-bold
            text-[#13264B]
          ">
            {location}
          </h2>

          {district && (
            <p className="
              mt-1
              text-sm
              text-gray-500
            ">
              {district} District
            </p>
          )}

        </div>


        <div className="
          mt-6
          space-y-4
        ">

          <div className="
            flex
            items-center
            justify-between
          ">

            <div className="
              flex
              items-center
              gap-3
            ">

              <Activity
                size={18}
                className="text-green-600"
              />

              <span className="text-gray-600">
                Active Cases
              </span>

            </div>

            <span className="
              font-bold
              text-[#13264B]
            ">
              {totalCases}
            </span>

          </div>


          <div className="
            flex
            items-center
            justify-between
          ">

            <div className="
              flex
              items-center
              gap-3
            ">

              <ShieldAlert
                size={18}
                className="text-yellow-500"
              />

              <span className="text-gray-600">
                Risk Level
              </span>

            </div>

            <span className="
              font-semibold
              text-[#13264B]
            ">
              {risk}
            </span>

          </div>


          <div className="
            flex
            items-center
            justify-between
          ">

            <div className="
              flex
              items-center
              gap-3
            ">

              <Users
                size={18}
                className="text-blue-500"
              />

              <span className="text-gray-600">
                Population
              </span>

            </div>

            <span className="
              font-semibold
              text-gray-400
            ">
              Not available
            </span>

          </div>


          <div className="
            flex
            items-center
            justify-between
          ">

            <div className="
              flex
              items-center
              gap-3
            ">

              <Thermometer
                size={18}
                className="text-red-500"
              />

              <span className="text-gray-600">
                Temperature
              </span>

            </div>

            <span className="
              font-semibold
              text-gray-400
            ">
              Not available
            </span>

          </div>

        </div>


        <div className="
          mt-6
          rounded-xl
          bg-[#F0FDF4]
          border
          border-[#DCFCE7]
          px-4
          py-3
        ">

          <p className="
            text-[14px]
            text-green-700
            font-medium
          ">
            ✓ Disease surveillance data is
            being monitored for this locality.
          </p>

        </div>

      </div>

    </div>
  );
}