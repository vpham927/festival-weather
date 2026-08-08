"use client";

import { useSyncExternalStore } from "react";

/** Tick from the browser clock — never the server. */
function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(id);
}

function getClientSnapshot() {
  return Math.floor(Date.now() / 1000);
}

/** Placeholder until hydration so we never paint server/UTC time. */
function getServerSnapshot() {
  return 0;
}

function formatNow(epochSeconds: number): {
  date: string;
  time: string;
  zone: string;
} {
  const date = new Date(epochSeconds * 1000);
  // Omit timeZone so Intl uses the visitor's local zone.
  const zone =
    new Intl.DateTimeFormat("en-GB", { timeZoneName: "short" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  return {
    date: date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
    zone,
  };
}

export function SiteClock() {
  const epochSeconds = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  if (epochSeconds === 0) {
    return (
      <time className="site-clock" aria-hidden>
        <span className="site-clock-date">&nbsp;</span>
        <span className="site-clock-time">&nbsp;</span>
      </time>
    );
  }

  const { date, time, zone } = formatNow(epochSeconds);

  return (
    <time
      className="site-clock"
      dateTime={new Date(epochSeconds * 1000).toISOString()}
    >
      <span className="site-clock-date">{date}</span>
      <span className="site-clock-time">
        {time}
        {zone ? ` ${zone}` : ""}
      </span>
    </time>
  );
}
