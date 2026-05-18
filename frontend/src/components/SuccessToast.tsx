import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";

interface SuccessToastProps {
  message: string | null;
  onClose?: () => void;
}

export function SuccessToast({ message, onClose }: SuccessToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed right-6 top-6 z-[70] flex items-center gap-3 rounded-2xl border border-rag-green/30 bg-white px-4 py-3 text-sm text-ink shadow-[0_18px_36px_-24px_rgba(16,185,129,0.45)]"
        >
          <CheckCircle2 size={16} className="text-rag-green" />
          <span>{message}</span>
          <button
            type="button"
            aria-label="Close notification"
            className="rounded-full p-1 text-ink-subtle transition-colors hover:bg-bg-elevated hover:text-ink"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
