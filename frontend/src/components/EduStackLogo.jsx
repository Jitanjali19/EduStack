const EduStackLogo = ({ compact = false }) => (
  <span className={`inline-flex items-center ${compact ? '' : 'gap-3'}`}>
    <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-sky-400/40 bg-slate-800 shadow-lg shadow-sky-950/40">
      <span className="absolute left-1 top-1 text-xl font-black leading-none text-white">E</span>
      <span className="absolute bottom-1 right-1 text-xl font-black leading-none text-sky-300">S</span>
      <span className="absolute inset-x-2 top-1/2 h-px bg-white/25" />
    </span>
    {!compact && (
      <span className="text-xl font-bold tracking-tight text-white">
        Edu<span className="text-sky-300">Stack</span>
      </span>
    )}
  </span>
);

export default EduStackLogo;
