import { Menu } from "lucide-react";
import { useState } from "react";
import DropdownMenu from "./DropdownMenu";

export default function Navbar({ onSelectRole }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-[#FCFAF6]">
      <div className="max-w-[1500px] h-[90px] mx-auto px-10 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center">

          <div className="w-[58px] h-[58px] rounded-[16px] bg-[#0B7A33] shadow-md flex items-center justify-center">

            <svg
              width="36"
              height="36"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 6L48 12V27C48 38 40.5 47.5 32 52C23.5 47.5 16 38 16 27V12L32 6Z"
                fill="white"
              />

              <path
                d="M32 14L42 18V27C42 35 37.5 41.5 32 45C26.5 41.5 22 35 22 27V18L32 14Z"
                fill="#0B7A33"
              />

              <rect
                x="28"
                y="20"
                width="8"
                height="18"
                rx="2"
                fill="white"
              />

              <rect
                x="23"
                y="25"
                width="18"
                height="8"
                rx="2"
                fill="white"
              />
            </svg>

          </div>

          <div className="ml-5">

            <h1 className="text-[32px] leading-none font-semibold tracking-tight text-[#0B6D2E]">
              KARNA SURAKSHA
            </h1>

            <p className="mt-1 text-[15px] text-[#445064]">
              Disease Surveillance Platform
            </p>

          </div>

        </div>

        {/* CENTER */}
        <nav className="flex items-center gap-8 text-[15px]">

          <a
            href="#"
            className="relative font-semibold text-[#0B6D2E] transition-colors duration-200"
          >
            Home

            <span className="absolute left-0 -bottom-[10px] h-[3px] w-full rounded-full bg-[#0B6D2E]" />

          </a>

          <a
            href="#"
            className="font-medium text-[#1F3144] transition-colors duration-200 hover:text-[#0B6D2E]"
          >
            About Us
          </a>

          <a
            href="#"
            className="font-medium text-[#1F3144] transition-colors duration-200 hover:text-[#0B6D2E]"
          >
            Features
          </a>

          <a
            href="#"
            className="font-medium text-[#1F3144] transition-colors duration-200 hover:text-[#0B6D2E]"
          >
            How It Works
          </a>

          <a
            href="#"
            className="font-medium text-[#1F3144] transition-colors duration-200 hover:text-[#0B6D2E]"
          >
            Resources
          </a>

          <a
            href="#"
            className="font-medium text-[#1F3144] transition-colors duration-200 hover:text-[#0B6D2E]"
          >
            Contact
          </a>

        </nav>

        {/* RIGHT */}
        <div className="relative">

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="
              flex
              items-center
              justify-center
              p-1
              text-[#1F3144]
              transition-all
              duration-200
              hover:text-[#0B6D2E]
              active:scale-95
            "
            aria-label="Toggle menu"
          >
            <Menu
              size={34}
              strokeWidth={1.8}
            />
          </button>

          <DropdownMenu isOpen={isOpen} onSelectRole={onSelectRole} />

        </div>

      </div>
    </header>
  );
}