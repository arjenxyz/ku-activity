"use client";

import { motion } from "framer-motion";
import { FiChevronRight } from "react-icons/fi";

export const SidebarToggleButton = ({ 
  onClick 
}: { 
  onClick: () => void 
}) => {
  return (
    <motion.button
      onClick={onClick}
      className="group fixed top-6 left-4 z-50 p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/40 hover:shadow-purple-500/40 transition-all duration-300"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      whileHover={{
        scale: 1.1,
        rotate: [0, -2, 2, -2, 0],
        transition: { duration: 0.6 }
      }}
      whileTap={{ scale: 0.95 }}
      aria-label="Toggle menu"
    >
      <div className="relative">
        {/* Ana İkon */}
        <motion.div
          className="text-white"
          animate={{
            rotate: 0,
            transition: { type: "spring", stiffness: 300 }
          }}
        >
          <FiChevronRight className="w-6 h-6 transform group-hover:rotate-180 transition-transform" />
        </motion.div>

        {/* Hover Efekt Işıltısı */}
        <motion.div
          className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        />

        {/* Partikül Efektleri */}
        <div className="absolute -top-2 -right-2">
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          />
        </div>
        
        <div className="absolute -bottom-2 -left-2">
          <motion.div
            className="w-2 h-2 bg-white rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          />
        </div>
      </div>
    </motion.button>
  );
};

export default Sidebar;
