"use client";

import { iconUrlFromWebsite } from "@/data/festivals";
import { isAggregatorWebsite, officialWebsite } from "@/data/festival-websites";
import { useState } from "react";

type Props = {
  name: string;
  iconUrl?: string;
  website?: string;
  size?: "sm" | "md";
};

function isAggregatorFavicon(iconUrl: string): boolean {
  try {
    const url = new URL(iconUrl);
    if (
      !url.hostname.includes("google.") ||
      !url.pathname.includes("favicons")
    ) {
      return false;
    }
    const domain = url.searchParams.get("domain") ?? "";
    return Boolean(domain) && isAggregatorWebsite(`https://${domain}/`);
  } catch {
    return false;
  }
}

export function FestivalFavicon({
  name,
  iconUrl,
  website,
  size = "md",
}: Props) {
  const [failed, setFailed] = useState(false);
  const px = size === "sm" ? 32 : 64;
  const fromSite = website
    ? iconUrlFromWebsite(officialWebsite(website), px)
    : "";
  const stored =
    iconUrl?.trim() && !isAggregatorFavicon(iconUrl) ? iconUrl.trim() : "";
  const src = fromSite || stored || null;

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
