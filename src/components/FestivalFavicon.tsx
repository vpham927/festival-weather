"use client";

import { iconUrlFromWebsite } from "@/data/festivals";
import { useState } from "react";

type Props = {
  name: string;
  iconUrl?: string;
  website?: string;
  size?: "sm" | "md";
};

export function FestivalFavicon({
  name,
  iconUrl,
  website,
  size = "md",
}: Props) {
  const [failed, setFailed] = useState(false);
  const px = size === "sm" ? 32 : 64;
  const src =
    iconUrl?.trim() ||
    (website ? iconUrlFromWebsite(website, px) : "") ||
    null;

  if (!src || failed) {
    return (
      <span
        className={`festival-favicon festival-favicon--${size} festival-favicon--fallback`}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote icon URLs from DB / favicon CDN
    <img
      className={`festival-favicon festival-favicon--${size}`}
      src={src}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      title={name}
    />
  );
}
