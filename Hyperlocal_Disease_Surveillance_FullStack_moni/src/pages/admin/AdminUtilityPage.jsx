import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function AdminUtilityPage({
  title,
  description,
  icon: Icon = ShieldCheck,
}) {
  return (
    <section
      className="
        rounded-2xl
        border
        border-[#DCE2DF]
        bg-white
        p-6
        shadow-[0_2px_8px_rgba(20,40,55,0.035)]
      "
    >

      <div
        className="
          flex
          items-start
          gap-4
        "
      >

        <div
          className="
            h-11 w-11
            rounded-xl
            bg-[#EAF6EE]
            text-[#0A8542]
            flex items-center
            justify-center
          "
        >
          <Icon size={21} />
        </div>

        <div>

          <h1
            className="
              text-[22px]
              font-bold
              tracking-[-0.03em]
              text-[#102943]
            "
          >
            {title}
          </h1>

          <p
            className="
              mt-1
              text-[12px]
              text-[#6B7B8E]
            "
          >
            {description}
          </p>

        </div>

      </div>

      <div
        className="
          mt-7
          grid
          grid-cols-1
          md:grid-cols-3
          gap-3
        "
      >

        <Info
          title="Administrative access"
          text="This area is restricted to System Administrators."
        />

        <Info
          title="Audit friendly"
          text="Changes should remain traceable through Activity Logs."
        />

        <Info
          title="System boundary"
          text="Medical decisions remain with the Medical Supervisor role."
        />

      </div>

      <div
        className="
          mt-6
          rounded-xl
          bg-[#F5F8F6]
          border
          border-[#E3E9E5]
          px-4 py-3
          text-[11px]
          text-[#526476]
          flex items-center
          gap-2
        "
      >

        <span>
          Use the dedicated management
          screen when its API is enabled.
        </span>

        <ArrowRight
          size={14}
          className="text-[#0A8542]"
        />

      </div>

    </section>
  );
}

function Info({
  title,
  text,
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-[#E3E8E5]
        p-4
      "
    >

      <div
        className="
          text-[11px]
          font-semibold
          text-[#17304A]
        "
      >
        {title}
      </div>

      <p
        className="
          mt-1
          text-[10px]
          leading-4
          text-[#718095]
        "
      >
        {text}
      </p>

    </div>
  );
}