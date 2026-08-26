import {
  ArrowRight,
  BarChart3,
  BellRing,
  HeartPulse,
  Bot,
} from "lucide-react";


export default function QuickAccess({
  onNavigate,
}) {

  const items = [
    {
      key: "analytics",
      label: "Analytics",
      icon: BarChart3,
      iconColor: "#2E9649",
      bg: "#EAF7EC",
    },

    {
      key: "alerts",
      label: "Emergency Alerts",
      icon: BellRing,
      iconColor: "#F04444",
      bg: "#FFF0DF",
    },

    {
      key: "medical-chat",
      label: "Medical Assistant",
      icon: Bot,
      iconColor: "#7B42E8",
      bg: "#F2E9FF",
    },

    {
      key: "home-relief",
      label: "Home Relief",
      icon: HeartPulse,
      iconColor: "#F04444",
      bg: "#FFE9E9",
    },
  ];


  return (
    <section className="
      h-full
      rounded-[14px]
      border
      border-[#E5E2DC]
      bg-white
      p-[15px]
      shadow-[0_1px_5px_rgba(44,35,24,0.035)]
    ">

      <h2 className="
        text-[12px]
        font-semibold
        uppercase
        tracking-[0.02em]
        text-[#1B1D1F]
      ">
        QUICK ACCESS
      </h2>


      <div className="
        mt-[10px]
        grid
        grid-cols-2
        gap-[10px]
      ">

        {items.map(
          ({
            key,
            label,
            icon: Icon,
            iconColor,
            bg,
          }) => (

            <button
              key={key}
              type="button"
              onClick={() =>
                onNavigate?.(
                  key
                )
              }
              className="
                flex
                h-[50px]
                items-center
                gap-3
                rounded-[9px]
                border
                border-transparent
                px-3
                text-left
                transition
                hover:-translate-y-0.5
                hover:shadow-sm
              "
              style={{
                backgroundColor:
                  bg,
              }}
            >

              <Icon
                size={24}
                style={{
                  color:
                    iconColor,
                }}
              />

              <span className="
                flex-1
                text-[10px]
                font-semibold
                leading-4
                text-[#1C2024]
              ">
                {label}
              </span>

              <ArrowRight
                size={15}
                style={{
                  color:
                    iconColor,
                }}
              />

            </button>

          )
        )}

      </div>

    </section>
  );
}