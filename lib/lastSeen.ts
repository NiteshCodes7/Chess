export function formatLastSeen(timestamp?: number | null) {
  if (!timestamp) return "Offline";

  const diff = Date.now() - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "Last seen just now";
  if (minutes < 60) return `Last seen ${minutes} min ago`;
  if (hours < 24) return `Last seen ${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `Last seen ${days} day(s) ago`;
}