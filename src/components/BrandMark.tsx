/** Wordmark with angled raindrop tittles on each “i”. */
function RaindropTittle() {
  return (
    <svg
      className="brand-raindrop"
      viewBox="0 0 12 16"
      aria-hidden
      focusable="false"
    >
      <path d="M6 0C6 0 0 7.2 0 10.5 0 13.54 2.69 16 6 16s6-2.46 6-5.5C12 7.2 6 0 6 0Z" />
    </svg>
  );
}

function BrandI() {
  return (
    <span className="brand-i">
      <span className="brand-i-stem">ı</span>
      <RaindropTittle />
    </span>
  );
}

type Props = {
  className?: string;
};

export function BrandMark({ className = "brand-mark" }: Props) {
  return (
    <>
      <span className="sr-only">Drizzle.live</span>
      <span className={className} aria-hidden="true">
        Dr
        <BrandI />
        zzle.l
        <BrandI />
        ve
      </span>
    </>
  );
}
