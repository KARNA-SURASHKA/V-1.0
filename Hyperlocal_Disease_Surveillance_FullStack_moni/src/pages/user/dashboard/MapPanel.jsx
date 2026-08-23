import {
  useState,
} from "react";

import KarnatakaMap
  from "../../../assets/maps/Karnataka-map.png";

import MapPopup
  from "./MapPopup";


export default function MapPanel({
  taluk,
}) {

  const [
    popup,
    setPopup,
  ] = useState(null);


  const handleClick = (
    e
  ) => {

    const rect =
      e.currentTarget.getBoundingClientRect();


    const x =
      e.clientX -
      rect.left;


    const y =
      e.clientY -
      rect.top;


    const locationName =
      typeof taluk === "string"
        ? taluk
        : (
            taluk?.talukName ||
            taluk?.name ||
            "Selected Taluk"
          );


    setPopup({

      x,

      y,

      location:
        locationName,

    });

  };


  return (
    <div
      className="
        relative
        w-full
        overflow-visible
      "
    >

      {/* =====================================================
          MAP CONTAINER
      ===================================================== */}

      <div
        onClick={handleClick}
        className="
          relative
          min-h-[520px]
          cursor-crosshair
          overflow-visible
          rounded-[18px]
          bg-[#F8FAFC]
        "
      >

        {/* ===================================================
            KARNATAKA MAP
        =================================================== */}

        <img
          src={KarnatakaMap}
          alt="Karnataka Disease Map"
          draggable="false"
          className="
            block
            h-auto
            w-full
            select-none
            object-contain
          "
        />


        {/* ===================================================
            MAP POPUP
        =================================================== */}

        {popup && (

          <MapPopup
            {...popup}
            onClose={() =>
              setPopup(null)
            }
          />

        )}

      </div>

    </div>
  );
}