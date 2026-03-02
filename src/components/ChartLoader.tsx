import { motion } from "framer-motion";

export default function ChartLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
      <motion.span
        className="text-6xl"
        animate={{ y: [0, -14, 0] }}
        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
      >
        🚀
      </motion.span>
      <div className="h-1 w-24 rounded-full overflow-hidden bg-muted">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ width: "60%" }}
        />
      </div>
      <motion.p
        className="text-sm text-muted-foreground font-medium"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.p>
    </div>
  );
}
