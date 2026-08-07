"use client";

type Props = {
  festivalId: string;
  festivalName: string;
  pinned: boolean;
  onToggle: (id: string) => void;
};

export function FestivalPinButton({
  festivalId,
  festivalName,
  pinned,
  onToggle,
}: Props) {
  return (
    <button
      type="button"
      className={`festival-pin${pinned ? " is-pinned" : ""}`}
      aria-pressed={pinned}
      aria-label={
        pinned
          ? `Unpin ${festivalName}`
          : `Pin ${festivalName}`
      }
      title={pinned ? "Unpin" : "Pin to top"}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle(festivalId);
      }}
    >
      <svg
        className="festival-pin-icon"
        viewBox="0 0 24 24"
        aria-hidden
        focusable="false"
      >
        {pinned ? (
          <path
            fill="currentColor"
            d="M12 2.5 14.9 8.4l6.5.9-4.7 4.6 1.1 6.5L12 17.3 6.2 20.4l1.1-6.5L2.6 9.3l6.5-.9L12 2.5Z"
          />
        ) : (
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            d="M12 3.2 14.6 8.6l6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9L12 3.2Z"
          />
        )}
      </svg>
    </button>
  );
}
