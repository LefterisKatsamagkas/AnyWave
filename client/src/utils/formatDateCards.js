export function formatDateCards(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const formatted = date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
  });

  return formatted;
}