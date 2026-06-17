import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How the Project RISHI @ UC Berkeley member dashboard handles your data.",
};

export default function PrivacyPage() {
  return (
    <section className="bg-paper pt-[var(--header-h)]">
      <div className="container-rishi max-w-3xl py-16">
        <h1 className="font-display text-4xl font-semibold text-pine-deep">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: June 2026</p>

        <div className="mt-8 space-y-6 text-ink/80 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-pine-deep [&_h2]:mt-8">
          <p>
            This policy explains how the Project RISHI @ UC Berkeley member
            dashboard (the &ldquo;Dashboard&rdquo;) collects and uses information.
            It applies to members who sign in to the Dashboard. The public pages
            of our website do not require an account and do not collect personal
            information beyond standard web traffic.
          </p>

          <h2>Who we are</h2>
          <p>
            Project RISHI @ UC Berkeley is a student organization. You can reach
            us at <a className="text-pine underline" href="mailto:ucberkeley@projectrishi.org">ucberkeley@projectrishi.org</a>.
          </p>

          <h2>What we collect</h2>
          <p>
            When you sign in with Google, we receive your name and email address
            from your Google account, which we use only to identify you as a club
            member and to show your tasks and events. Within the Dashboard, we
            store the tasks and events that you and other members create
            (titles, descriptions, dates, tags, and who they are assigned to).
          </p>

          <h2>Google Calendar access</h2>
          <p>
            Connecting your Google Calendar is optional. If you choose to connect
            it, we request permission to manage calendar events so that we can add
            your Dashboard tasks and events to your own Google Calendar. This is
            strictly one-way: we only create and update the events that originate
            from your Dashboard. We never read, view, or import your existing
            Google Calendar events, and your personal calendar is never shown to
            other members. You can disconnect at any time using the
            &ldquo;Unsync&rdquo; button, which stops syncing and removes the events
            we added, or by revoking access in your Google Account settings.
          </p>

          <h2>How information is stored</h2>
          <p>
            Dashboard data is stored in a secured database accessed only by our
            server. If you connect Google Calendar, the token that lets us add
            events on your behalf is stored securely on the server and is never
            shared with other members or exposed in your browser.
          </p>

          <h2>How we use and share it</h2>
          <p>
            We use your information only to operate the Dashboard for our club. We
            do not sell your information or share it with third parties, except
            with the service providers that host our application and database, and
            with Google when you choose to sync your calendar. We do not use your
            data for advertising.
          </p>

          <h2>Your choices</h2>
          <p>
            You can disconnect Google Calendar at any time, and you can request
            removal of your account data by contacting us at the email above.
          </p>

          <h2>Changes</h2>
          <p>
            We may update this policy from time to time. Material changes will be
            reflected by the &ldquo;Last updated&rdquo; date above.
          </p>
        </div>
      </div>
    </section>
  );
}
