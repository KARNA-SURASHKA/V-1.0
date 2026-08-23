import {
  Globe,
  Brain,
  MapPin,
  Bell,
  Shield,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Disease Monitoring",
    desc: "Monitor disease trends across regions with real-time data.",
  },
  {
    icon: Brain,
    title: "AI Risk Prediction",
    desc: "Predict low, moderate, and high-risk areas using AI models.",
  },
  {
    icon: MapPin,
    title: "Geographic Visualization",
    desc: "Interactive maps at district and taluk levels for better insights.",
  },
  {
    icon: Bell,
    title: "Early Outbreak Alerts",
    desc: "Get notified instantly about emerging disease clusters.",
  },
  {
    icon: Shield,
    title: "Precaution Advisory",
    desc: "Provide region-specific preventive measures and health recommendations.",
  },
  {
    icon: TrendingUp,
    title: "Trend Analytics",
    desc: "Visualize trends and historical patterns through interactive dashboards.",
  },
];

export default function PlatformCapabilities() {
  return (
    <section className="bg-[#FCFAF6] border-t border-[#E7E2D8] py-16">
      <div className="max-w-[1500px] mx-auto px-8">

        {/* Heading */}
        <div className="text-center">
          <h2 className="font-serif text-[56px] font-bold text-[#17203A] leading-tight">
            Platform Capabilities
          </h2>

          <ShieldCheck
            size={18}
            className="mx-auto text-[#118136] mt-3"
          />

          <p className="mt-3 max-w-[720px] mx-auto text-[18px] leading-8 text-[#61708C]">
            Intelligent tools designed to support proactive disease
            surveillance and informed public health decisions.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8 mt-14">

          {features.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                className="
                  group
                  bg-white
                  border
                  border-[#E8E3D9]
                  rounded-[22px]
                  shadow-[0_6px_18px_rgba(0,0,0,0.06)]
                  px-6
                  py-8
                  min-h-[270px]
                  flex
                  flex-col
                  items-center
                  text-center
                  transition-all
                  duration-500
                  hover:bg-[#118136]
                  hover:-translate-y-3
                  hover:shadow-[0_18px_40px_rgba(17,129,54,0.30)]
                "
              >

                {/* Icon */}
                <div
                  className="
                    w-16
                    h-16
                    rounded-full
                    bg-[#EDF8F0]
                    flex
                    items-center
                    justify-center
                    transition-all
                    duration-500
                    group-hover:bg-white
                  "
                >
                  <Icon
                    size={30}
                    className="text-[#118136]"
                  />
                </div>

                {/* Title */}
                <h3
                  className="
                    mt-6
                    text-[20px]
                    font-semibold
                    text-[#17203A]
                    leading-7
                    transition-colors
                    duration-300
                    group-hover:text-white
                  "
                >
                  {item.title}
                </h3>

                {/* Description */}
                <p
                  className="
                    mt-4
                    text-[15px]
                    leading-7
                    text-[#61708C]
                    flex-1
                    transition-colors
                    duration-300
                    group-hover:text-white/95
                  "
                >
                  {item.desc}
                </p>

                {/* Bottom Line */}
                <div
                  className="
                    w-10
                    h-[3px]
                    rounded-full
                    bg-[#118136]
                    mt-6
                    transition-all
                    duration-300
                    group-hover:w-20
                    group-hover:bg-white
                  "
                />
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}