import Reveal from "@/components/Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  align = "left",
  accent = "marigold",
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  align?: "left" | "center";
  accent?: "marigold" | "pine";
  /** "light" = for paper/light sections; "dark" = for pine/dark sections */
  tone?: "light" | "dark";
}) {
  const dot = accent === "marigold" ? "bg-marigold" : "bg-pine";
  const eyebrowColor = tone === "dark" ? "text-marigold-soft" : "text-sage";
  const titleColor = tone === "dark" ? "text-paper" : "text-pine-deep";

  return (
    <Reveal className={align === "center" ? "text-center" : ""}>
      {eyebrow && (
        <span className={`eyebrow ${eyebrowColor}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {eyebrow}
        </span>
      )}
      <h2 className={`mt-3 font-display text-3xl font-semibold sm:text-4xl ${titleColor}`}>
        {title}
      </h2>
    </Reveal>
  );
}
