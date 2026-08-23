import { useState } from "react";

import {
  BarChart3,
  Bell,
  Bot,
  ChevronDown,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Menu,
  ShieldCheck,
  Siren,
  X,
} from "lucide-react";

import LocationSelector from "../../components/LocationSelector";


export default function UserSidebar({
  activePage,
  onNavigate,
  onExit,
  selectedLocation,
  defaultLocation,
  onLocationChange,
  onResetToDefault,
}) {

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    locationExpanded,
    setLocationExpanded,
  ] = useState(false);


  const go = (
    page
  ) => {

    onNavigate(page);

    setOpen(false);

    if (
      page !== "location"
    ) {
      setLocationExpanded(false);
    }

  };


  /*
   * HEALTH OVERVIEW HAS INTENTIONALLY BEEN REMOVED.
   *
   * The page itself can still exist elsewhere in the
   * application, but it is no longer exposed in the
   * dashboard sidebar.
   */

  const groups = [

    {
      label: null,

      items: [
        {
          key: "dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
      ],
    },


    {
      label: "SURVEILLANCE",

      items: [
        {
          key: "risk-map",
          label: "Disease Risk Map",
          icon: Map,
        },

        {
          key: "analytics",
          label: "Analytics",
          icon: BarChart3,
        },
      ],
    },


    {
      label: "HEALTH & SAFETY",

      items: [
        {
          key: "precautions",
          label: "Precautionary Measures",
          icon: ShieldCheck,
        },

        {
          key: "alerts",
          label: "Emergency Alerts",
          icon: Siren,
        },
      ],
    },


    {
      label: "COMMUNICATION",

      items: [
        {
          key: "notifications",
          label: "Notifications",
          icon: Bell,
        },

        {
          key: "medical-chat",
          label: "Medical Assistant",
          icon: Bot,
        },

        {
          key: "home-relief",
          label: "Home Relief",
          icon: HeartPulse,
        },
      ],
    },

  ];


  return (
    <>

      {/* MOBILE MENU */}

      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="
          fixed
          left-4
          top-4
          z-[60]
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          border
          border-[#E7E3DD]
          bg-white
          shadow-sm
          lg:hidden
        "
        aria-label="Open user navigation"
      >
        <Menu
          size={20}
        />
      </button>


      {open && (

        <button
          type="button"
          onClick={() =>
            setOpen(false)
          }
          className="
            fixed
            inset-0
            z-40
            bg-black/20
            lg:hidden
          "
          aria-label="Close navigation"
        />

      )}


      {/* SIDEBAR */}

      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-[245px]
          flex-col
          border-r
          border-[#E6DFD5]
          bg-[#FBF9F5]
          transition-transform
          duration-200
          lg:translate-x-0
          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* BRAND */}

        <div
          className="
            flex
            h-[88px]
            shrink-0
            items-center
            border-b
            border-[#EEE8DE]
            px-5
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
                h-[42px]
                w-[42px]
                items-center
                justify-center
                rounded-[10px]
                bg-[#2E9649]
                text-white
                shadow-[0_2px_8px_rgba(46,150,73,.13)]
              "
            >

              <ShieldCheck
                size={25}
                strokeWidth={2.15}
              />

            </div>


            <div>

              <p
                className="
                  text-[16px]
                  font-semibold
                  leading-none
                  tracking-[-0.02em]
                  text-[#111315]
                "
              >
                HYPERLOCAL
              </p>

              <p
                className="
                  mt-[5px]
                  whitespace-nowrap
                  text-[9px]
                  font-medium
                  leading-none
                  tracking-[0.075em]
                  text-[#24282B]
                "
              >
                DISEASE SURVEILLANCE
              </p>

            </div>

          </div>


          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            className="
              ml-auto
              lg:hidden
            "
          >
            <X
              size={18}
            />
          </button>

        </div>


        {/* NAVIGATION */}

        <nav
          className="
            flex-1
            overflow-y-auto
            px-[10px]
            py-4
          "
        >

          {groups.map(
            (
              group,
              index
            ) => (

              <div
                key={
                  group.label ||
                  `group-${index}`
                }
                className={
                  index
                    ? "mt-[18px]"
                    : ""
                }
              >

                {group.label && (

                  <p
                    className="
                      mb-[8px]
                      px-[13px]
                      text-[10px]
                      font-medium
                      tracking-[0.16em]
                      text-[#59483D]
                    "
                  >
                    {group.label}
                  </p>

                )}


                <div
                  className="
                    space-y-[3px]
                  "
                >

                  {group.items.map(
                    ({
                      key,
                      label,
                      icon: Icon,
                    }) => {

                      const active =
                        activePage ===
                        key;


                      return (

                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            go(key)
                          }
                          className={`
                            flex
                            min-h-[40px]
                            w-full
                            items-center
                            gap-3
                            rounded-[9px]
                            px-[13px]
                            text-left
                            text-[12px]
                            transition

                            ${
                              active
                                ? "bg-[#F0E3D2] font-medium text-[#17191C]"
                                : "text-[#25292D] hover:bg-[#F5F0E8]"
                            }
                          `}
                        >

                          <Icon
                            size={18}
                            strokeWidth={
                              active
                                ? 2.05
                                : 1.75
                            }
                          />

                          <span>
                            {label}
                          </span>

                        </button>

                      );

                    }
                  )}

                </div>

              </div>

            )
          )}


          {/* LOCATION */}

          <div
            className="
              mt-[18px]
            "
          >

            <p
              className="
                mb-[8px]
                px-[13px]
                text-[10px]
                font-medium
                tracking-[0.16em]
                text-[#59483D]
              "
            >
              LOCATION
            </p>


            <button
              type="button"
              onClick={() =>
                setLocationExpanded(
                  (value) =>
                    !value
                )
              }
              className={`
                flex
                min-h-[40px]
                w-full
                items-center
                gap-3
                rounded-[9px]
                px-[13px]
                text-left
                text-[12px]

                ${
                  locationExpanded
                    ? "bg-[#F0E3D2] font-medium"
                    : "hover:bg-[#F5F0E8]"
                }
              `}
            >

              <MapPin
                size={18}
                strokeWidth={1.75}
              />

              <span
                className="
                  flex-1
                "
              >
                Location
              </span>

              <ChevronDown
                size={15}
                className={
                  locationExpanded
                    ? "rotate-180"
                    : ""
                }
              />

            </button>


            {locationExpanded && (

              <div
                className="
                  mt-2
                  rounded-xl
                  border
                  border-[#E7E1D8]
                  bg-white
                  p-3
                  shadow-sm
                "
              >

                <LocationSelector
                  value={
                    selectedLocation
                  }
                  onChange={
                    onLocationChange
                  }
                />


                {selectedLocation?.talukId && (

                  <div
                    className="
                      mt-3
                      rounded-lg
                      bg-[#F7F5F0]
                      px-3
                      py-2
                    "
                  >

                    <p
                      className="
                        text-[8px]
                        uppercase
                        tracking-[0.1em]
                        text-[#8B8178]
                      "
                    >
                      Currently Monitoring
                    </p>

                    <p
                      className="
                        mt-1
                        text-[11px]
                        font-semibold
                        text-[#1A1D20]
                      "
                    >
                      {
                        selectedLocation.talukName
                      }
                    </p>

                    <p
                      className="
                        text-[9px]
                        text-[#737A80]
                      "
                    >
                      {
                        selectedLocation.districtName
                      }
                      ,{" "}
                      {
                        selectedLocation.stateName
                      }
                    </p>

                  </div>

                )}


                {defaultLocation?.talukId &&
                  selectedLocation?.talukId !==
                    defaultLocation.talukId && (

                    <button
                      type="button"
                      onClick={
                        onResetToDefault
                      }
                      className="
                        mt-3
                        w-full
                        rounded-lg
                        border
                        border-[#2E9649]
                        px-3
                        py-2
                        text-[10px]
                        font-semibold
                        text-[#2E9649]
                        hover:bg-[#EEF8F0]
                      "
                    >
                      Reset to My Default Location
                    </button>

                  )}

              </div>

            )}

          </div>

        </nav>


        {/* LOGOUT */}

        <div
          className="
            border-t
            border-[#EEE8DE]
            p-[10px]
          "
        >

          <button
            type="button"
            onClick={
              onExit
            }
            className="
              flex
              min-h-[42px]
              w-full
              items-center
              gap-3
              rounded-[9px]
              px-[13px]
              text-[12px]
              text-[#25292D]
              hover:bg-[#F5F0E8]
              hover:text-[#C62828]
            "
          >

            <LogOut
              size={18}
            />

            Logout

          </button>

        </div>

      </aside>

    </>
  );
}
