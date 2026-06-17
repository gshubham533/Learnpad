export function NavBadge({
  count,
  alert,
}: {
  count?: number;
  alert?: boolean;
}) {
  if (alert) {
    return (
      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
        !
      </span>
    );
  }

  if (!count || count <= 0) return null;

  return (
    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function NavDot() {
  return (
    <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-red-600" />
  );
}
