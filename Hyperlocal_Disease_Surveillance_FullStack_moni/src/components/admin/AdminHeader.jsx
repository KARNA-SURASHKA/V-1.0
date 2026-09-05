import {
  useEffect,
  useState,
} from "react";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  MapPin,
  Menu,
} from "lucide-react";


function getCurrentDate() {

  const now =
    new Date();


  const date =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    ).format(now);


  const day =
    new Intl.DateTimeFormat(
      "en-US",
      {
        weekday: "long",
      }
    ).format(now);


  return {
    date,
    day,
  };

}


export default function AdminHeader({
  onOpenLocation,
}) {

  const [
    currentDate,
    setCurrentDate,
  ] =
    useState(
      getCurrentDate()
    );


  useEffect(() => {

    const update =
      () =>
        setCurrentDate(
          getCurrentDate()
        );


    update();


    const interval =
      setInterval(
        update,
        60000
      );


    return () =>
      clearInterval(
        interval
      );

  }, []);


  return (

    <header className="admin-header">


      {/* =================================================
          MENU
      ================================================= */}

      <button
        type="button"
        className="admin-header-menu"
        aria-label="Menu"
      >

        <Menu
          size={23}
          strokeWidth={1.6}
        />

      </button>


      {/* =================================================
          LOCATION
      ================================================= */}

      <button
        type="button"
        className="admin-header-location"
        onClick={onOpenLocation}
      >

        <MapPin
          size={18}
          strokeWidth={1.7}
        />

        <span>
          Virajpet, Kodagu
        </span>

        <ChevronDown
          size={15}
          strokeWidth={1.8}
        />

      </button>


      {/* =================================================
          DATE
      ================================================= */}

      <div className="admin-header-date">

        <CalendarDays
          size={19}
          strokeWidth={1.7}
        />

        <span>
          {currentDate.date}
        </span>

        <i />

        <span>
          {currentDate.day}
        </span>

      </div>


      {/* =================================================
          RIGHT
      ================================================= */}

      <div className="admin-header-right">


        {/* NOTIFICATIONS */}

        <button
          type="button"
          className="admin-header-notification"
          aria-label="Notifications"
        >

          <Bell
            size={22}
            strokeWidth={1.6}
          />

          <span>
            7
          </span>

        </button>


        {/* PROFILE */}

        <button
          type="button"
          className="admin-header-profile"
        >

          <div className="admin-profile-avatar">
            MA
          </div>


          <div className="admin-profile-details">

            <strong>
              Monish Ayyappa
            </strong>

            <span>
              System Administrator
            </span>

          </div>


          <ChevronDown
            size={16}
            strokeWidth={1.7}
          />

        </button>

      </div>

    </header>

  );

}