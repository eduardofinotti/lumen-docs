export function SectionHeading({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="label-caps">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-display-md text-balance sm:text-display-lg">
        {title}
      </h2>
    </div>
  );
}
