import {
  useState,
} from "react";

import {
  Bell,
  ChevronDown,
  LogOut,
  MapPin,
  User,
} from "lucide-react";


export default function Header({
  username,
  defaultLocation,
  selectedLocation,
  onExit,
}) {

  const [
    showProfile,
    setShowProfile,
  ] = useState(false);


  /*
    ==========================================================
    CURRENT LOCATION
    ==========================================================

    The header only DISPLAYs the location.

    Location changes are handled from:
    Sidebar → Location

    Therefore there is NO LocationSelector here.
  */

  const location =
    selectedLocation ||
    defaultLocation ||
    {};


  return (
    <header className="
      sticky
      top-0
      z-50
      bg-white
      border-b
      border-[#E7E2D8]
      shadow-sm
    ">

      <div className="
        max-w-[1650px]
        mx-auto
        min-h-[82px]
        px-10
        py-4
        flex
        items-center
        justify-between
        gap-8
      ">


        {/* ==================================================
            LEFT
        ================================================== */}

        <div className="
          flex
          items-center
          gap-8
        ">


          {/* LOGO */}

          <div className="
            flex
            items-center
            gap-4
          ">

            <div className="
              w-12
              h-12
              rounded-2xl
              bg-green-100
              flex
              items-center
              justify-center
            ">
              <span className="text-2xl">
                🌿
              </span>
            </div>

            <div>

              <h1 className="
                text-[20px]
                font-bold
                text-[#0B7A33]
                leading-none
              ">
                Karna Suraksha
              </h1>

              <p className="
                text-[13px]
                text-gray-500
                mt-1
              ">
                Disease Surveillance System
              </p>

            </div>

          </div>


          {/* =================================================
              LOCATION — READ ONLY
          ================================================= */}

          <div>

            <div className="
              min-w-[300px]
              h-12
              px-5
              rounded-xl
              border
              border-gray-200
              bg-white
              flex
              items-center
              justify-between
              shadow-sm
              cursor-default
            ">

              <div className="
                flex
                items-center
                flex-1
                min-w-0
              ">

                <MapPin
                  size={18}
                  className="
                    text-green-600
                    flex-shrink-0
                  "
                />

                <div className="
                  ml-3
                  text-left
                  min-w-0
                ">

                  {/* TALUK */}

                  <p className="
                    font-semibold
                    text-gray-700
                    truncate
                  ">
                    {location?.talukName ||
                      "Select Location"}
                  </p>


                  {/* DISTRICT */}

                  <p className="
                    text-[11px]
                    text-gray-400
                    truncate
                  ">
                    {location?.districtName ||
                      "District not selected"}
                  </p>

                </div>

              </div>


              {/* =================================================
                  NON-CLICKABLE CHEVRON

                  Kept only for the original visual appearance.
                  It does NOT open anything.
              ================================================= */}

              <ChevronDown
                size={18}
                className="
                  text-gray-500
                "
              />

            </div>

          </div>

        </div>


        {/* ==================================================
            RIGHT
        ================================================== */}

        <div className="
          flex
          items-center
          gap-8
        ">


          {/* NOTIFICATION */}

          <div className="
            relative
            cursor-pointer
          ">

            <Bell
              size={22}
              className="text-gray-700"
            />

            <span className="
              absolute
              -top-2
              -right-2
              flex
              items-center
              justify-center
              w-5
              h-5
              rounded-full
              bg-red-500
              text-white
              text-[11px]
              font-semibold
            ">
              3
            </span>

          </div>


          {/* ALERTS */}

          <button className="
            h-11
            px-7
            rounded-xl
            border
            border-green-500
            text-green-700
            font-medium
            hover:bg-green-50
            transition
          ">
            Alerts
          </button>


          {/* PROFILE */}

          <div className="relative">

            <button
              onClick={() =>
                setShowProfile(
                  (current) => !current
                )
              }
              className="
                flex
                items-center
                gap-4
                hover:bg-gray-50
                px-3
                py-2
                rounded-xl
                transition
              "
            >

              <div className="
                w-11
                h-11
                rounded-full
                bg-green-100
                flex
                items-center
                justify-center
              ">

                <User
                  size={21}
                  className="text-green-700"
                />

              </div>


              <div className="text-left">

                <p className="
                  font-semibold
                  text-gray-900
                  leading-none
                ">
                  {username}
                </p>

                <p className="
                  text-sm
                  text-gray-500
                  mt-1
                ">
                  User
                </p>

              </div>


              <ChevronDown
                size={18}
                className={`
                  text-gray-500
                  transition-transform
                  ${
                    showProfile
                      ? "rotate-180"
                      : ""
                  }
                `}
              />

            </button>


            {/* ==================================================
                PROFILE DROPDOWN
            ================================================== */}

            {showProfile && (

              <div className="
                absolute
                right-0
                mt-3
                w-72
                bg-white
                rounded-2xl
                border
                border-gray-200
                shadow-2xl
                overflow-hidden
                z-50
              ">

                <div className="
                  py-6
                  flex
                  flex-col
                  items-center
                ">

                  <div className="
                    w-16
                    h-16
                    rounded-full
                    bg-green-100
                    flex
                    items-center
                    justify-center
                  ">
                    <User
                      size={30}
                      className="text-green-700"
                    />
                  </div>

                  <h3 className="
                    mt-4
                    text-lg
                    font-bold
                  ">
                    {username}
                  </h3>

                  <p className="text-gray-500">
                    User
                  </p>

                </div>


                <div className="
                  border-t
                  border-gray-200
                " />


                {/* ==================================================
                    LOCATION INFORMATION
                    READ ONLY
                ================================================== */}

                <div className="
                  px-6
                  py-5
                  space-y-5
                ">


                  {/* STATE */}

                  <div className="
                    flex
                    items-center
                    gap-3
                  ">

                    <span className="text-lg">
                      📍
                    </span>

                    <div>

                      <p className="
                        text-xs
                        text-gray-500
                      ">
                        State
                      </p>

                      <p className="
                        font-medium
                      ">
                        {location?.stateName ||
                          "—"}
                      </p>

                    </div>

                  </div>


                  {/* DISTRICT */}

                  <div className="
                    flex
                    items-center
                    gap-3
                  ">

                    <span className="text-lg">
                      🏙️
                    </span>

                    <div>

                      <p className="
                        text-xs
                        text-gray-500
                      ">
                        District
                      </p>

                      <p className="
                        font-medium
                      ">
                        {location?.districtName ||
                          "—"}
                      </p>

                    </div>

                  </div>


                  {/* TALUK */}

                  <div className="
                    flex
                    items-center
                    gap-3
                  ">

                    <span className="text-lg">
                      📌
                    </span>

                    <div>

                      <p className="
                        text-xs
                        text-gray-500
                      ">
                        Taluk
                      </p>

                      <p className="
                        font-medium
                      ">
                        {location?.talukName ||
                          "—"}
                      </p>

                    </div>

                  </div>


                  {/* DEFAULT LOCATION */}

                  <div className="
                    rounded-xl
                    bg-green-50
                    px-3
                    py-2
                    text-[12px]
                    text-green-700
                  ">
                    Default location:{" "}
                    <strong>
                      {defaultLocation?.talukName ||
                        "—"}
                    </strong>
                  </div>

                </div>


                <div className="
                  border-t
                  border-gray-200
                " />


                {/* LOGOUT */}

                <button
                  onClick={onExit}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-6
                    py-4
                    text-red-600
                    hover:bg-red-50
                    transition
                  "
                >

                  <LogOut size={18} />

                  Logout

                </button>

              </div>

            )}

          </div>

        </div>

      </div>

    </header>
  );
}