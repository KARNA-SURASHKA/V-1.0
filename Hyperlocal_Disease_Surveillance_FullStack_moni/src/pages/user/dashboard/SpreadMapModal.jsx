import { X, MapPinned, Activity } from "lucide-react";
import KarnatakaMap from "../../../assets/maps/Karnataka-map.png";

export default function SpreadMapModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-6">

      {/* Modal */}
      <div className="relative max-h-[90vh] w-full max-w-[1200px] overflow-hidden rounded-[28px] bg-white shadow-2xl">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-[#E7E2D8] px-7 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E9F9EF]">
              <MapPinned
                size={22}
                className="text-[#16803C]"
              />
            </div>

            <div>
              <h2 className="text-[26px] font-bold text-[#13264B]">
                Disease Spread Map
              </h2>

              <p className="mt-1 text-[14px] text-[#667085]">
                Visual overview of reported disease activity across Karnataka
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              text-[#667085]
              transition
              hover:bg-[#F3F4F6]
              hover:text-[#13264B]
            "
            aria-label="Close spread map"
          >
            <X size={22} />
          </button>

        </div>

        {/* ================= MAP AREA ================= */}
        <div className="relative flex min-h-[600px] items-center justify-center bg-[#F8FAFC] p-8">

          <img
            src={KarnatakaMap}
            alt="Disease Spread Map of Karnataka"
            className="max-h-[560px] w-full object-contain select-none"
          />

          {/* ================= LEGEND ================= */}
          <div className="absolute bottom-8 left-8 rounded-2xl border border-[#E7E2D8] bg-white p-5 shadow-lg">

            <div className="mb-3 flex items-center gap-2">

              <Activity
                size={18}
                className="text-[#13264B]"
              />

              <span className="text-[15px] font-semibold text-[#13264B]">
                Disease Risk
              </span>

            </div>

            <div className="space-y-2 text-[13px] text-[#667085]">

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span>High Risk</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                <span>Moderate Risk</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span>Low Risk</span>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}