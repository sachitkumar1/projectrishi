// ============================================================================
//  Mail merge — replace {{tags}} with a recipient's details
// ----------------------------------------------------------------------------
//  Used both when sending personalized emails and when rendering an
//  announcement/newsletter on a specific member's dashboard.
// ============================================================================

import { findMember, memberFullName } from "@/lib/members";

export const MERGE_TAGS = [
  { tag: "{{firstName}}", label: "First name" },
  { tag: "{{lastName}}", label: "Last name" },
  { tag: "{{fullName}}", label: "Full name" },
  { tag: "{{email}}", label: "Email" },
  { tag: "{{group}}", label: "Project group" },
];

const GROUP_LABELS: Record<string, string> = {
  E: "Education",
  R: "Water & Sanitation",
  W: "Women's Empowerment",
  H: "Health",
};

/**
 * Replace merge tags for one recipient email. Members resolve all fields;
 * external newsletter subscribers (not on the roster) get a friendly fallback.
 */
export function applyMergeTags(text: string, recipientEmail: string): string {
  const m = findMember(recipientEmail);
  const values: Record<string, string> = m
    ? {
        "{{firstName}}": m.firstName,
        "{{lastName}}": m.lastName,
        "{{fullName}}": memberFullName(m),
        "{{email}}": m.email,
        "{{group}}": GROUP_LABELS[m.group] ?? m.group,
      }
    : {
        "{{firstName}}": "there",
        "{{lastName}}": "",
        "{{fullName}}": "there",
        "{{email}}": recipientEmail,
        "{{group}}": "",
      };
  let out = text;
  for (const [tag, val] of Object.entries(values)) {
    out = out.split(tag).join(val);
  }
  return out;
}
