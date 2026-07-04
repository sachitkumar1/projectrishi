import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using the Project RISHI @ UC Berkeley member dashboard.",
};

export default function TermsPage() {
  return (
    <section className="bg-paper pt-[var(--header-h)]">
      <div className="container-rishi max-w-3xl py-16">
        <h1 className="font-display text-4xl font-semibold text-pine-deep">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: July 2026</p>

        <div className="mt-8 space-y-6 text-ink/80 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-pine-deep [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-pine [&_a]:underline">
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the
            Project RISHI @ UC Berkeley member dashboard (the &ldquo;Dashboard&rdquo;).
            By signing in and using the Dashboard, you agree to these Terms. If you
            don&rsquo;t agree, please don&rsquo;t use the Dashboard. Use of your data
            is described in our{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>

          <h2>Who can use the Dashboard</h2>
          <p>
            The Dashboard is a private, internal tool for members of Project RISHI @
            UC Berkeley. Access is limited to people on the club roster and requires
            signing in with the Google account associated with your membership. You
            are responsible for keeping your account secure and for activity that
            happens under it.
          </p>

          <h2>What the Dashboard is for</h2>
          <p>
            The Dashboard exists to help the club run its work &mdash; assigning and
            tracking tasks, coordinating events and a shared calendar, messaging
            other members, sending club communications, and looking up chapter
            history. Please use it only for these club purposes.
          </p>

          <h2>Acceptable use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Dashboard to harass, threaten, demean, or discriminate against anyone.</li>
            <li>Post or send content that is unlawful, hateful, or otherwise inappropriate for a student organization.</li>
            <li>Send spam, or use the club&rsquo;s connected email accounts to send anything other than legitimate club communications.</li>
            <li>Attempt to access accounts, data, or areas of the system you aren&rsquo;t authorized to use, or interfere with the service&rsquo;s security or operation.</li>
            <li>Share your access with people outside the club, or scrape or export other members&rsquo; personal information.</li>
          </ul>

          <h2>Messages and content you create</h2>
          <p>
            You are responsible for the tasks, comments, messages, and other content
            you create. Content you share is visible to the members you share it with,
            and chat and other messages are stored so conversations persist. Club
            officers may view, moderate, or remove content and may restrict access
            where needed to keep the community safe or to enforce these Terms. Be
            respectful &mdash; treat the chat and dashboard the way you would treat any
            club space.
          </p>

          <h2>Accounts, roles, and access</h2>
          <p>
            Different roles (for example, leads, exec, and the VP/President) can do
            different things in the Dashboard, and some features are limited
            accordingly. Your access is tied to your membership: when you leave the
            club or your role changes, your access may be changed or removed. The club
            may suspend or revoke access for misuse or violations of these Terms.
          </p>

          <h2>Email and calendar features</h2>
          <p>
            Connecting a personal Google Calendar or a Gmail account for sending is
            optional and controlled by you (or, for the club&rsquo;s shared sending
            accounts, by authorized officers). You agree to use these features only as
            intended and not to send unauthorized or misleading email through connected
            accounts. See the Privacy Policy for exactly what each connection can and
            cannot do.
          </p>

          <h2>Third-party services</h2>
          <p>
            The Dashboard relies on third-party services, including Google (sign-in,
            Calendar, and Gmail), Supabase (database), and Vercel (hosting). Your use of
            those integrations is also subject to those companies&rsquo; own terms and
            policies.
          </p>

          <h2>Intellectual property</h2>
          <p>
            The Project RISHI name, site content, and branding belong to Project RISHI
            and are used with permission by the UC Berkeley chapter. Please don&rsquo;t
            copy, redistribute, or reuse them outside the club without permission. You
            keep ownership of the content you create, and you grant the club permission
            to store and display it as needed to operate the Dashboard.
          </p>

          <h2>No warranty</h2>
          <p>
            The Dashboard is a volunteer-built internal tool provided on an
            &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without warranties
            of any kind. We don&rsquo;t guarantee it will always be available,
            error-free, or that notifications, reminders, or emails will always be
            delivered on time.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent allowed by law, Project RISHI @ UC Berkeley and the
            people who build and run the Dashboard are not liable for any indirect or
            incidental damages arising from your use of the Dashboard. It is an internal
            club tool, not a commercial service.
          </p>

          <h2>Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be
            reflected by the &ldquo;Last updated&rdquo; date above, and your continued
            use of the Dashboard means you accept the updated Terms.
          </p>

          <h2>Governing law</h2>
          <p>
            These Terms are governed by the laws of the State of California, United
            States, without regard to its conflict-of-laws rules.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these Terms? Email us at{" "}
            <a href="mailto:sachitkumar2025@gmail.com">sachitkumar2025@gmail.com</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
