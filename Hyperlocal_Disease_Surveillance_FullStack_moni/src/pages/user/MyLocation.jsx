import {
  useState,
} from "react";

import {
  MapPin,
  CheckCircle2,
} from "lucide-react";

import LocationSelector from "../../components/LocationSelector";


export default function MyLocation({
  selectedLocation,
  defaultLocation,
  onLocationChange,
}) {

  const [
    pendingLocation,
    setPendingLocation,
  ] = useState(
    selectedLocation ||
    defaultLocation ||
    null
  );


  const [
    saved,
    setSaved,
  ] = useState(false);


  const handleApply = () => {

    if (!pendingLocation?.talukId) {
      return;
    }


    onLocationChange(
      pendingLocation
    );


    setSaved(true);


    setTimeout(() => {
      setSaved(false);
    }, 2500);

  };


  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div>

        <h2
          className="
            text-[22px]
            font-bold
            text-[#1F3144]
          "
        >
          My Location
        </h2>

        <p
          className="
            mt-1
            text-[14px]
            text-[#7A8598]
          "
        >
          Choose the area you want to monitor
          for disease surveillance.
        </p>

      </div>


      {/* CURRENT LOCATION */}

      <div
        className="
          rounded-2xl
          border
          border-[#E8E2D8]
          bg-white
          p-6
          shadow-sm
        "
      >

        <div className="flex items-start gap-4">

          <div
            className="
              flex
              h-11
              w-11
              flex-shrink-0
              items-center
              justify-center
              rounded-xl
              bg-[#EAF6EE]
              text-[#0B7A33]
            "
          >
            <MapPin size={21} />
          </div>

          <div>

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.14em]
                text-[#9A9489]
              "
            >
              Currently Monitoring
            </p>

            <h3
              className="
                mt-1
                text-[19px]
                font-bold
                text-[#1F3144]
              "
            >
              {selectedLocation?.talukName ||
                "No location selected"}
            </h3>

            <p
              className="
                mt-1
                text-[13px]
                text-[#7A8598]
              "
            >
              {selectedLocation?.districtName
                ? `${selectedLocation.districtName}, `
                : ""}
              {selectedLocation?.stateName ||
                "Karnataka"}
            </p>

          </div>

        </div>


        {/* LOCATION DETAILS */}

        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-3
          "
        >

          <Info
            label="State"
            value={
              selectedLocation?.stateName ||
              "Karnataka"
            }
          />

          <Info
            label="District"
            value={
              selectedLocation?.districtName ||
              "—"
            }
          />

          <Info
            label="Taluk"
            value={
              selectedLocation?.talukName ||
              "—"
            }
          />

        </div>

      </div>


      {/* CHANGE LOCATION */}

      <div
        className="
          rounded-2xl
          border
          border-[#E8E2D8]
          bg-white
          p-6
          shadow-sm
        "
      >

        <h3
          className="
            text-[17px]
            font-semibold
            text-[#1F3144]
          "
        >
          Change Monitoring Location
        </h3>

        <p
          className="
            mt-1
            text-[13px]
            text-[#7A8598]
          "
        >
          Select a State, District, and Taluk.
          Your surveillance dashboard will use
          the selected location.
        </p>


        <div className="mt-5">

          <LocationSelector
            onChange={(location) => {
              setPendingLocation(
                location
              );
              setSaved(false);
            }}
          />

        </div>


        {/* SAVE */}

        <div className="mt-5 flex items-center gap-3">

          <button
            type="button"
            disabled={
              !pendingLocation?.talukId
            }
            onClick={handleApply}
            className="
              rounded-xl
              bg-[#0B7A33]
              px-5
              py-2.5
              text-[13px]
              font-semibold
              text-white
              transition
              hover:bg-[#086629]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Apply Location
          </button>


          {saved && (
            <div
              className="
                flex
                items-center
                gap-1.5
                text-[13px]
                font-medium
                text-[#0B7A33]
              "
            >
              <CheckCircle2 size={16} />
              Location updated
            </div>
          )}

        </div>

      </div>

    </div>
  );
}


// ============================================================
// INFO
// ============================================================

function Info({
  label,
  value,
}) {

  return (
    <div
      className="
        rounded-xl
        bg-[#F6F3ED]
        px-4
        py-3
      "
    >

      <p
        className="
          text-[10px]
          font-semibold
          uppercase
          tracking-[0.12em]
          text-[#9A9489]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-[14px]
          font-semibold
          text-[#1F3144]
        "
      >
        {value}
      </p>

    </div>
  );
}