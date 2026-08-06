"use client";

import type { FestivalEventLink as EventLink } from "@/lib/festival-lineup";
import { useEffect, useState } from "react";

type Props = {
  festivalId: string;
  /** Website from the DB — shown immediately as Festival site until lineup resolves. */
  website: string;
};

export function FestivalEventLink({ festivalId, website }: Props) {
  const [link, setLink] = useState<EventLink>({
    href: website,
    label: "Festival site",
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    fetch(`/api/festival-link?id=${encodeURIComponent(festivalId)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as EventLink;
      })
      .then((data) => {
        if (!cancelled && data?.href) setLink(data);
      })
      .catch(() => {
        // Keep the DB website fallback.
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [festivalId]);

  return (
    <a
      className="festival-event-link"
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {link.label}
    </a>
  );
}
