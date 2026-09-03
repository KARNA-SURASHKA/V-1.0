import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronDown,
} from "lucide-react";

function getCurrentDate() {
  const now = new Date();

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(now);

  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(now);

  return {
    date,
    day,
  };
}

export default function AdminHeader({ activePage }) {
  const [currentDate, setCurrentDate] = useState(
    getCurrentDate()
  );

  /*
   * Update the displayed date automatically.
   *
   * This means:
   * - Admin logs in today -> today's date is displayed.
   * - The application remains open overnight -> the date
   *   automatically changes to the new date.
   */
  useEffect(() => {
    const updateDate = () => {
      setCurrentDate(getCurrentDate());
    };

    updateDate();

    // Check once every minute so the date/day changes
    // automatically when midnight is crossed.
    const interval = setInterval(
      updateDate,
      60 * 1000
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="
        h-[68px]
        bg-white
        border-b
        border-[#E3E7E4]

        flex
        items-center
        justify-between

        px-4
        sm:px-6
        lg:px-0

        pl-16
        lg:pl-0

        shrink-0
      "
    >
      {/* =====================================================
          LEFT SIDE
      ====================================================== */}
      <div className="flex h-full items-center">

        {/* Mobile / sidebar spacing */}
        <div className="lg:hidden w-1" />

        {/* ===================================================
            LOCATION
        ==================================================== */}
        <div
          className="
            h-full
            flex
            items-center

            px-4
            sm:px-6

            border-r
            border-[#E3E7E4]
          "
        >
          <div
            className="
              flex
              items-center
              gap-2

              text-[#172B43]
            "
          >
            {/* Location icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[#172B43]"
            >
              <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle
                cx="12"
                cy="10"
                r="2.5"
              />
            </svg>

            <span
              className="
                text-[11px]
                sm:text-[12px]
                font-semibold
                text-[#172B43]
                whitespace-nowrap
              "
            >
              Virajpet, Kodagu
            </span>

            <ChevronDown
              size={13}
              strokeWidth={1.8}
              className="text-[#526073]"
            />
          </div>
        </div>

        {/* ===================================================
            ACTUAL DATE + ACTUAL DAY
        ==================================================== */}
        <div
          className="
            hidden
            sm:flex

            h-full
            items-center

            px-4
            sm:px-5

            gap-3
          "
        >
          {/* Calendar icon */}
          <CalendarDays
            size={16}
            strokeWidth={1.8}
            className="text-[#172B43]"
          />

          {/* Actual date */}
          <span
            className="
              text-[11px]
              sm:text-[12px]

              font-medium

              text-[#172B43]

              whitespace-nowrap
            "
          >
            {currentDate.date}
          </span>

          {/* Vertical separator */}
          <span
            className="
              h-[16px]
              w-px
              bg-[#DCE2DE]
            "
          />

          {/* Actual day */}
          <span
            className="
              text-[11px]
              sm:text-[12px]

              font-medium

              text-[#7A8598]

              whitespace-nowrap
            "
          >
            {currentDate.day}
          </span>
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE
      ====================================================== */}
      <div
        className="
          flex
          h-full
          items-center
        "
      >

        {/* ===================================================
            NOTIFICATION
        ==================================================== */}
        <button
          type="button"
          aria-label="Notifications"
          className="
            relative

            h-full
            w-[58px]

            flex
            items-center
            justify-center

            border-l
            border-[#E3E7E4]

            text-[#172B43]

            hover:bg-[#F8FAF8]

            transition-colors
          "
        >
          <Bell
            size={19}
            strokeWidth={1.7}
          />

          {/* Notification count */}
          <span
            className="
              absolute

              top-[13px]
              right-[13px]

              min-w-[15px]
              h-[15px]

              px-[3px]

              rounded-full

              bg-[#D8232A]
              text-white

              flex
              items-center
              justify-center

              text-[8px]
              leading-none
              font-bold
            "
          >
            7
          </span>
        </button>

        {/* ===================================================
            ADMIN PROFILE
        ==================================================== */}
        <button
          type="button"
          className="
            h-full

            px-4
            sm:px-5

            flex
            items-center
            gap-2.5

            border-l
            border-[#E3E7E4]

            hover:bg-[#F8FAF8]

            transition-colors
          "
        >
          {/* Avatar */}
          <div
            className="
              h-[32px]
              w-[32px]

              rounded-full

              bg-[#087A3A]

              flex
              items-center
              justify-center

              text-white

              text-[10px]
              font-bold
            "
          >
            MA
          </div>

          {/* Admin information */}
          <div
            className="
              hidden
              sm:block

              text-left
            "
          >
            <p
              className="
                text-[11px]
                sm:text-[12px]

                leading-[15px]

                font-semibold

                text-[#172B43]
              "
            >
              Monish Ayyappa
            </p>

            <p
              className="
                mt-[1px]

                text-[8px]
                sm:text-[9px]

                leading-[11px]

                text-[#7A8598]
              "
            >
              System Administrator
            </p>
          </div>

          <ChevronDown
            size={14}
            strokeWidth={1.8}
            className="
              text-[#526073]
              shrink-0
            "
          />
        </button>
      </div>
    </header>
  );
}