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
import logo from "../../assets/ui/logo.png";

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

  const go = (page) => {
    onNavigate(page);

    setOpen(false);

    if (page !== "location") {
      setLocationExpanded(false);
    }
  };

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
        <Menu size={20} />
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
          w-[262px]
          flex-col
          border-r
          border-[#E7E7E2]
          bg-white
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

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="
          flex
          h-[108px]
          shrink-0
          items-center
          border-b
          border-[#EEEEEA]
          px-[21px]
        ">

          <div className="
            relative
            h-[57px]
            w-[214px]
            shrink-0
            overflow-hidden
          ">

            <img
              src={logo}
              alt="Hyperlocal Disease Surveillance"
              draggable="false"
              className="
                absolute
                inset-0
                h-[57px]
                w-[214px]
                object-contain
              "
            />

            {/* Re-colour subtitle to match reference */}
            <span className="
              absolute
              bottom-0
              left-[54px]
              h-[13px]
              w-[160px]
              bg-white
              px-[2px]
              text-[9px]
              font-semibold
              leading-[11px]
              tracking-[0.02em]
              text-[#16803C]
            ">
              DISEASE SURVEILLANCE
            </span>

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
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="
          flex-1
          overflow-y-auto
          px-[16px]
          py-[17px]
        ">

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
                    ? "mt-[25px]"
                    : ""
                }
              >

                {group.label && (
                  <p className="
                    mb-[10px]
                    px-[15px]
                    text-[10px]
                    font-semibold
                    tracking-[0.13em]
                    text-[#55585C]
                  ">
                    {group.label}
                  </p>
                )}


                <div className="
                  space-y-[3px]
                ">

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
                            min-h-[56px]
                            w-full
                            items-center
                            gap-4
                            rounded-[11px]
                            px-[16px]
                            text-left
                            text-[14px]
                            transition

                            ${
                              active
                                ? "bg-[#E8F5EC] font-semibold text-[#16803C]"
                                : "text-[#1E252B] hover:bg-[#F6F8F5]"
                            }
                          `}
                        >

                          <Icon
                            size={22}
                            strokeWidth={
                              active
                                ? 2.1
                                : 1.8
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


          {/* =================================================
              LOCATION
          ================================================= */}

          <div className="
            mt-[25px]
          ">

            <p className="
              mb-[10px]
              px-[15px]
              text-[10px]
              font-semibold
              tracking-[0.13em]
              text-[#55585C]
            ">
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
                min-h-[56px]
                w-full
                items-center
                gap-4
                rounded-[11px]
                px-[16px]
                text-left
                text-[14px]

                ${
                  locationExpanded
                    ? "bg-[#F4F8F4] font-medium"
                    : "text-[#1E252B] hover:bg-[#F6F8F5]"
                }
              `}
            >

              <MapPin
                size={22}
                strokeWidth={1.8}
              />

              <span className="
                flex-1
              ">
                Location
              </span>

              <ChevronDown
                size={18}
                className={
                  locationExpanded
                    ? "rotate-180"
                    : ""
                }
              />

            </button>


            {locationExpanded && (
              <div className="
                mt-2
                rounded-xl
                border
                border-[#E7E1D8]
                bg-white
                p-3
                shadow-sm
              ">

                <LocationSelector
                  value={
                    selectedLocation
                  }
                  onChange={
                    onLocationChange
                  }
                />


                {selectedLocation?.talukId && (
                  <div className="
                    mt-3
                    rounded-lg
                    bg-[#F7F8F6]
                    px-3
                    py-2
                  ">

                    <p className="
                      text-[8px]
                      uppercase
                      tracking-[0.1em]
                      text-[#8B8178]
                    ">
                      Currently Monitoring
                    </p>

                    <p className="
                      mt-1
                      text-[11px]
                      font-semibold
                      text-[#1A1D20]
                    ">
                      {
                        selectedLocation.talukName
                      }
                    </p>

                    <p className="
                      text-[9px]
                      text-[#737A80]
                    ">
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


        {/* =================================================
            LOGOUT
        ================================================= */}

        <div className="
          border-t
          border-[#EEEEEA]
          px-[16px]
          py-[15px]
        ">

          <button
            type="button"
            onClick={
              onExit
            }
            className="
              flex
              min-h-[50px]
              w-full
              items-center
              gap-4
              rounded-[11px]
              px-[16px]
              text-[14px]
              text-[#20262B]
              hover:bg-[#F7F8F6]
              hover:text-[#C62828]
            "
          >

            <LogOut
              size={22}
            />

            Logout

          </button>

        </div>

      </aside>
    </>
  );
}