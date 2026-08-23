import { ShieldCheck } from "lucide-react";
import { FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";
import footerImage from "../assets/footer_extract.png";

export default function Footer() {
  return (
    <footer className="bg-[#FCFAF6] border-t border-[#E8E2D8]">
      <div className="max-w-[1536px] mx-auto px-10 pt-14 pb-6">

        {/* =========================
            TOP SECTION
        ========================== */}
        <div className="grid grid-cols-[520px_1fr_150px_150px_190px] gap-12 items-start">

          {/* WHO IMAGE */}
          <div className="flex items-center">
            <img
              src={footerImage}
              alt="WHO"
              draggable={false}
              className="w-[510px] h-auto select-none pointer-events-none"
            />
          </div>

          {/* TRUSTED */}
          <div>
            <div className="flex items-center gap-3">
              <ShieldCheck
                size={18}
                className="text-[#118136]"
              />

              <h3 className="text-[18px] font-semibold text-[#17203A]">
                Trusted by Health Authorities Worldwide
              </h3>
            </div>

            <p className="mt-5 text-[15px] leading-8 text-[#5D6F87] max-w-[320px]">
              Committed to global public health through innovation,
              collaboration and data-driven decision making.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h3 className="text-[18px] font-semibold text-[#17203A] mb-6">
              Quick Links
            </h3>

            <ul className="space-y-3 text-[15px] text-[#516A90]">
              {[
                "About Us",
                "Features",
                "How It Works",
                "Resources",
                "Contact",
              ].map((item) => (
                <li
                  key={item}
                  className="cursor-pointer transition-all duration-200 hover:text-[#118136] hover:translate-x-1"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="text-[18px] font-semibold text-[#17203A] mb-6">
              Support
            </h3>

            <ul className="space-y-3 text-[15px] text-[#516A90]">
              {[
                "Help Center",
                "FAQs",
                "Documentation",
                "Privacy Policy",
                "Terms of Use",
              ].map((item) => (
                <li
                  key={item}
                  className="cursor-pointer transition-all duration-200 hover:text-[#118136] hover:translate-x-1"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* SOCIAL */}
          <div>
            <h3 className="text-[18px] font-semibold text-[#17203A] mb-6">
              Connect With Us
            </h3>

            <div className="flex gap-4">

              <div className="w-11 h-11 rounded-full bg-[#118136] flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <FaTwitter size={17} />
              </div>

              <div className="w-11 h-11 rounded-full bg-[#118136] flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <FaLinkedin size={17} />
              </div>

              <div className="w-11 h-11 rounded-full bg-[#118136] flex items-center justify-center text-white cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <FaGithub size={17} />
              </div>

            </div>
          </div>

        </div>

        {/* =========================
            COPYRIGHT
        ========================== */}
        <div className="border-t border-[#E7E2D8] mt-12 pt-7 text-center">

          <p className="text-[14px] tracking-wide text-[#6D7D92]">
            © 2025 Karna Suraksha. All rights reserved.
          </p>

        </div>

      </div>
    </footer>
  );
}