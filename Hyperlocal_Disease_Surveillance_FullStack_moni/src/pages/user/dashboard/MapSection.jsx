import MapPanel from "./MapPanel";

export default function MapSection({
  taluk,
}) {

  return (
    <section
      className="
        w-full
        overflow-visible
        rounded-[24px]
        border
        border-[#E7E2D8]
        bg-white
        shadow-[0_4px_20px_rgba(0,0,0,0.05)]
      "
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-[#EFE9DD]
          px-6
          py-5
        "
      >

        <div>

          <h3
            className="
              text-[30px]
              font-bold
              text-[#13264B]
            "
          >
            Karnataka Disease Map
          </h3>

          <p
            className="
              mt-1
              text-[15px]
              text-[#667085]
            "
          >
            Click anywhere on the map to view local
            disease information
          </p>

        </div>

      </div>


      {/* =====================================================
          MAP
      ===================================================== */}

      <div
        className="
          overflow-visible
          p-4
        "
      >

        <MapPanel
          taluk={taluk}
        />

      </div>

    </section>
  );
}