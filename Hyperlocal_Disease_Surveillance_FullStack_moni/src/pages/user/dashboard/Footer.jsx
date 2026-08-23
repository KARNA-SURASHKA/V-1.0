import {
  ShieldCheck,
  FileText,
  Scale,
  Phone,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-12 bg-[#0F6A37] text-white">

      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-10 py-6">

        {/* Left */}

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <ShieldCheck size={26} />
          </div>

          <div>

            <h3 className="text-[22px] font-bold">
              Karna Suraksha
            </h3>

            <p className="text-sm text-white/80">
              Disease Surveillance System
            </p>

          </div>

        </div>

        {/* Center */}

        <div className="flex items-center gap-12">

          <button className="flex items-center gap-2 text-[15px] text-white/90 transition hover:text-white">
            <FileText size={18} />
            Privacy Policy
          </button>

          <button className="flex items-center gap-2 text-[15px] text-white/90 transition hover:text-white">
            <Scale size={18} />
            Terms of Use
          </button>

          <button className="flex items-center gap-2 text-[15px] text-white/90 transition hover:text-white">
            <Phone size={18} />
            Contact Us
          </button>

        </div>

        {/* Right */}

        <div className="text-right">

          <p className="text-[15px] text-white/90">
            © 2026 Karna Suraksha
          </p>

          <p className="mt-1 text-sm text-white/70">
            All rights reserved.
          </p>

        </div>

      </div>

    </footer>
  );
}