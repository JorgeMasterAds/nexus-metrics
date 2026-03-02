import { motion } from "framer-motion";

export default function ChartLoaderInline({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <motion.span
        className="text-4xl"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      >
        🚀
      </motion.span>
      {text && (
        <motion.p
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}
