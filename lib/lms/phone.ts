// US phone formatting helpers, shared by the server (directory/store) and the
// client (edit inputs). Non-standard inputs are left as-is.

/** Format a completed number as (###) ###-####. Handles a leading US "1".
 *  If it isn't a standard 10-digit number, the trimmed input is returned. */
export function formatPhone(input: string): string {
  const raw = (input ?? "").trim();
  let d = raw.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return raw;
}

/** Progressive formatting for a text input as the user types. Caps at 10 digits. */
export function formatPhoneInput(input: string): string {
  const d = (input ?? "").replace(/\D/g, "").slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
