import { motion, AnimatePresence } from "framer-motion";

export default function DropdownMenu({ isOpen, onSelectRole }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.2 }}
          className="absolute right-0 top-[62px] w-56 rounded-2xl bg-white border border-[#E8E2D8] shadow-xl overflow-hidden z-50"
        >
          <button
            onClick={() => onSelectRole && onSelectRole("admin")}
            className="w-full px-6 py-4 text-left text-[#0B6D2E] font-medium hover:bg-[#F6F3ED] transition-colors"
          >
            Admin Portal
          </button>

          <div className="border-t border-[#E8E2D8]" />

          <button
            onClick={() => onSelectRole && onSelectRole("agent")}
            className="w-full px-6 py-4 text-left text-[#0B6D2E] font-medium hover:bg-[#F6F3ED] transition-colors"
          >
            Agent Portal
          </button>

          <div className="border-t border-[#E8E2D8]" />

          <button
            onClick={() =>
              onSelectRole && onSelectRole("medical_supervisor")
            }
            className="w-full px-6 py-4 text-left text-[#0B6D2E] font-medium hover:bg-[#F6F3ED] transition-colors"
          >
            Medical Supervisor
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}