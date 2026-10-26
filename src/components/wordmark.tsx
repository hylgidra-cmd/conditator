/** "Jumis AI" yozuvi: oxirgi so'z urg'u rangida. */
export function Wordmark({ brand }: { brand: string }) {
  const split = brand.lastIndexOf(" ");
  if (split < 0) return brand;
  return (
    <>
      {brand.slice(0, split + 1)}
      <span className="text-brand">{brand.slice(split + 1)}</span>
    </>
  );
}
