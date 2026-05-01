export function filterItems(items, query) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item => item.basename.toLowerCase().includes(q));
}
