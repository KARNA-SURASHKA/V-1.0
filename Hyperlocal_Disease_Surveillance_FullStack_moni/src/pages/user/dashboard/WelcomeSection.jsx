import {
  MapPin,
  Clock,
} from "lucide-react";

import HeroBg from "../../../assets/hero-bg.png";


export default function WelcomeSection({
  username,
  selectedLocation,
}) {

  const taluk =
    selectedLocation?.talukName ||
    "Select Taluk";

  const district =
    selectedLocation?.districtName ||
    "";


  const location =
    district
      ? `${taluk}, ${district} District`
      : taluk;


  return (
    <section className="
      relative
      h-[250px]
      overflow-hidden
      rounded-[28px]
      border
      border-[#E7E2D8]
      bg-white
      shadow-sm
    ">

      {/* BACKGROUND */}

      <div className="
        absolute
        inset-0
        overflow-hidden
        pointer-events-none
      ">

        <img
          src={HeroBg}
          alt=""
          className="
            absolute
            right-[-40px]
            top-1/2
            -translate-y-1/2
            w-[68%]
            max-w-none
            object-contain
            opacity-95
            select-none
          "
        />


        <div className="
          absolute
          inset-0
          bg-gradient-to-r
          from-white
          via-white/88
          via-[42%]
          to-transparent
        " />

      </div>


      {/* CONTENT */}

      <div className="
        relative
        z-10
        flex
        h-full
        flex-col
        justify-center
        px-10
      ">

        <div className="
          flex
          items-center
        ">

          <h1 className="
            text-[46px]
            font-bold
            leading-none
            text-[#13264B]
          ">
            Good Afternoon, {username}
          </h1>

          <span className="
            ml-2
            text-[38px]
            leading-none
          ">
            👋
          </span>

        </div>


        <p className="
          mt-8
          text-[18px]
          text-[#4B5563]
        ">
          Monitoring disease situation for
        </p>


        <div className="
          mt-5
          inline-flex
          h-12
          w-fit
          items-center
          gap-2
          rounded-full
          bg-[#E9F9EF]
          px-6
        ">

          <MapPin
            size={18}
            className="text-[#16803C]"
          />

          <span className="
            text-[17px]
            font-semibold
            text-[#16803C]
          ">
            {location}
          </span>

        </div>


        <div className="
          mt-7
          flex
          items-center
          gap-2
          text-[#667085]
        ">

          <Clock size={18} />

          <span className="text-[16px]">
            Live surveillance data
          </span>

        </div>

      </div>

    </section>
  );
}