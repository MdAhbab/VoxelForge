// VoxelForge mark — an isometric layered cube (additive, built up in layers).
export function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <path d="M16 3 L28 10 L16 17 L4 10 Z" fill="var(--signal)" opacity="0.9" />
      <path d="M4 10 L16 17 L16 29 L4 22 Z" fill="var(--blueprint)" opacity="0.55" />
      <path d="M28 10 L16 17 L16 29 L28 22 Z" fill="var(--ink)" opacity="0.85" />
      <path d="M4 14 L16 21 L28 14" stroke="var(--bg)" strokeWidth="0.8" opacity="0.5" />
      <path d="M4 18 L16 25 L28 18" stroke="var(--bg)" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}
