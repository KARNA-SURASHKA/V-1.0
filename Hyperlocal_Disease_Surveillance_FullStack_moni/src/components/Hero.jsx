import { Users, ArrowRight, ShieldCheck } from "lucide-react";
import mapExtract from "../assets/map_extract.png";

export default function Hero({ onSelectRole }) {
  return (
    <section className="relative overflow-hidden bg-[#FCFAF6] border-b border-[#E8E2D8]">
      <div className="max-w-[1536px] mx-auto px-8">
        <div className="relative min-h-[550px] flex items-center">

          {/* LEFT CONTENT */}
          <div className="relative z-20 w-[540px] py-8">

            {/* Top Badge */}
            <div className="inline-flex items-center gap-4 rounded-xl bg-[#EAF3DD] px-5 py-2.5 text-[13px] font-medium text-[#087A32]">
              <span>AI-DRIVEN</span>

              <span className="w-1 h-1 rounded-full bg-[#087A32]" />

              <span>DATA-POWERED</span>

              <span className="w-1 h-1 rounded-full bg-[#087A32]" />

              <span>COMMUNITY-FOCUSED</span>
            </div>

            {/* Heading */}
            <h1 className="mt-7 text-[64px] leading-[64px] tracking-[-2px] font-bold font-serif text-[#0B243C]">
              Monitoring the World.
              <br />
              Protecting{" "}
              <span className="text-[#0B8A33]">
                Every Life.
              </span>
            </h1>

            {/* Divider */}
            <div className="mt-10 flex items-center w-[500px]">
              <div className="flex-1 h-px bg-[#DDD7CC]" />

              <div className="mx-5">
                <div className="w-8 h-8 rounded-full bg-[#0B8A33] flex items-center justify-center shadow-sm">
                  <ShieldCheck
                    size={17}
                    strokeWidth={2.6}
                    className="text-white"
                  />
                </div>
              </div>

              <div className="flex-1 h-px bg-[#DDD7CC]" />
            </div>

            {/* Description */}
            <p className="mt-6 max-w-[490px] text-[18px] leading-[34px] text-[#163A5C]">
              An intelligent platform to monitor diseases worldwide,
              predict outbreak risks, and provide timely precautionary
              advisories for a healthier tomorrow.
            </p>

            {/* User Portal */}
            <button
              onClick={() => onSelectRole && onSelectRole("user")}
              className="
                mt-8
                w-[500px]
                h-[92px]
                rounded-[14px]
                bg-gradient-to-r
                from-[#07892F]
                to-[#049437]
                hover:from-[#067C2B]
                hover:to-[#038A31]
                shadow-[0_14px_32px_rgba(0,128,55,0.25)]
                hover:shadow-[0_18px_40px_rgba(0,128,55,0.30)]
                transition-all
                duration-300
                hover:-translate-y-1
                flex
                items-center
                px-8
                group
              "
            >
              <div className="w-[80px] flex justify-center">
                <Users
                  size={46}
                  strokeWidth={1.6}
                  className="text-white transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              <div className="flex-1 ml-2 text-left">
                <h3 className="text-[24px] font-semibold text-white">
                  User Portal
                </h3>

                <p className="mt-1 text-[16px] text-white/95">
                  View data, alerts &amp; trends
                </p>
              </div>

              <ArrowRight
                size={32}
                className="text-white transition-transform duration-300 group-hover:translate-x-2"
              />
            </button>

            {/* Trusted */}
            <div className="flex items-center justify-center gap-2 mt-4 w-[500px]">
              <ShieldCheck
                size={18}
                className="text-[#078A35]"
              />

              <span className="text-[14px] text-[#18456D]">
                Trusted by Health Authorities Worldwide
              </span>
            </div>

          </div>

          {/* Background Glow */}
          <div
            className="
              absolute
              -z-10
              right-[-150px]
              top-[-80px]
              w-[850px]
              h-[850px]
              rounded-full
              bg-[#FFF6E8]
              blur-[90px]
              opacity-70
            "
          />

          {/* Right Map */}
          <div
            className="
              absolute
              top-[-10px]
              right-[-110px]
              w-[1150px]
              h-[560px]
              flex
              items-center
              justify-center
              pointer-events-none
            "
          >
            <img
              src={mapExtract}
              alt="Global Disease Surveillance Map"
              draggable={false}
              className="w-full h-full object-contain select-none"
            />
          </div>

        </div>
      </div>
    </section>
  );
}