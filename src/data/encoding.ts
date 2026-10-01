/**
 * Answers are base64-encoded so they are not plainly readable in the shipped
 * bundle. This deters casual "view source" peeking only — it is not security,
 * and anything stronger would need a server.
 */
export function decode(value: string): string {
  return decodeURIComponent(escape(atob(value)))
}

export function encode(value: string): string {
  return btoa(unescape(encodeURIComponent(value)))
}
