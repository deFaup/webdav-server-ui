export async function requestHostPermission(url) {
  if (!chrome?.permissions) return true; // Not in extension context

  const origin = new URL(url).origin + '/*';

  const granted = await chrome.permissions.request({
    origins: [origin],
  });

  if (!granted) {
    throw new Error(`Permission denied for ${origin}`);
  }
  return true;
}
