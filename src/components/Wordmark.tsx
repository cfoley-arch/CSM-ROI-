/**
 * Text-based placeholder for the real ClearCo logomark + wordmark
 * (Section 6: "black or white only, minimum 24px height, needs clear
 * space"). No logo asset was provided in this build — swap this for an
 * <Image> of the real SVG/PNG lockup as soon as one is available, keeping
 * the same min-height and surrounding clear space.
 */
export function Wordmark({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <span
      className={`font-display text-[24px] leading-none tracking-tight ${
        variant === "light" ? "text-cc-white" : "text-cc-cast-iron"
      }`}
    >
      ClearCompany
    </span>
  );
}
