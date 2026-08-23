import {
  ShieldCheck,
  Info,
} from "lucide-react";

export default function Settings() {
  return (
    <div>

      <div className="mb-5">

        <h2 className="text-[20px] font-semibold text-[#1F3144]">
          Settings
        </h2>

        <p className="text-[13px] text-[#7A8598] mt-1">
          Administrative profile and platform information.
        </p>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <section className="bg-white rounded-2xl border border-[#E8E2D8] p-6">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-[#0B7A33]/10 text-[#0B7A33] flex items-center justify-center">
              <ShieldCheck size={19} />
            </div>

            <div>

              <h3 className="font-semibold text-[#1F3144]">
                Administrator Access
              </h3>

              <p className="text-[12px] text-[#7A8598]">
                Current portal role
              </p>

            </div>

          </div>

          <div className="space-y-3 text-[13px]">

            <Row
              label="Role"
              value="Company / Admin"
            />

            <Row
              label="Access"
              value="Full surveillance administration"
            />

            <Row
              label="Location scope"
              value="State → District → Taluk"
            />

          </div>

        </section>

        <section className="bg-white rounded-2xl border border-[#E8E2D8] p-6">

          <div className="flex items-center gap-3 mb-5">

            <div className="w-10 h-10 rounded-xl bg-[#F6F3ED] text-[#526073] flex items-center justify-center">
              <Info size={19} />
            </div>

            <div>

              <h3 className="font-semibold text-[#1F3144]">
                Platform Information
              </h3>

              <p className="text-[12px] text-[#7A8598]">
                System configuration
              </p>

            </div>

          </div>

          <div className="space-y-3 text-[13px]">

            <Row
              label="Portal"
              value="DiseaseWatch Admin"
            />

            <Row
              label="Reporting model"
              value="Weekly surveillance"
            />

            <Row
              label="Prediction engine"
              value="Connected ML service"
            />

          </div>

        </section>

      </div>

    </div>
  );
}

function Row({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#F0ECE5] pb-3">

      <span className="text-[#7A8598]">
        {label}
      </span>

      <span className="font-medium text-[#1F3144] text-right">
        {value}
      </span>

    </div>
  );
}