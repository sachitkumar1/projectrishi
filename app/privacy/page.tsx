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
        <p className="mt-2 text-sm text-ink/50">Last updated: July 2026</p>

        <div className="mt-8 space-y-6 text-ink/80 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-pine-deep [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-pine [&_a]:underline">
          <p>
            This policy explains how the Project RISHI @ UC Berkeley member
            dashboard (the &ldquo;Dashboard&rdquo;) collects and uses information.
            It applies to members who sign in to the Dashboard. The public pages
            of our website do not require an account and do not collect personal
            information beyond standard web traffic and analytics.
          </p>

          <h2>Who we are</h2>
          <p>
            Project RISHI @ UC Berkeley is a registered student organization. You
            can reach us at{" "}
            <a href="mailto:sachitkumar2025@gmail.com">sachitkumar2025@gmail.com</a>.
          </p>

          <h2>What we collect</h2>
          <p>
            When you sign in with Google, we receive your name and email address
            from your Google account, which we use only to identify you as a club
            member. Only people on the club roster can access the Dashboard. As you
            use the Dashboard, we store the information you and other members create:
          </p>
          <ul>
            <li>
              <strong>Tasks and events</strong> &mdash; titles, descriptions, dates,
              tags, who assigned them and to whom, completion status, and the
              activity history of each item.
            </li>
            <li>
              <strong>Task submissions and comments</strong> &mdash; any note or link
              you submit to complete a task, and comments you leave on tasks.
            </li>
            <li>
              <strong>Chat messages</strong> &mdash; the direct messages and
              group-chat messages you send through the Dashboard, along with any
              emoji reactions and the members included in each conversation.
            </li>
            <li>
              <strong>Notifications</strong> &mdash; a record of the notifications
              shown to you in the Dashboard (which mirror the emails we send).
            </li>
            <li>
              <strong>Profile photo</strong> &mdash; if you upload one for your
              member profile.
            </li>
            <li>
              <strong>Newsletter email</strong> &mdash; if you subscribe through the
              signup on our site, we store the email address you provide.
            </li>
          </ul>

          <h2>Google Calendar access (optional)</h2>
          <p>
            Connecting your Google Calendar is optional and off by default. If you
            connect it, we request permission to manage calendar events so we can
            add your Dashboard tasks and events to your own Google Calendar. This
            is strictly one-way: we only create and update the events that
            originate from your Dashboard. We never read, view, or import your
            existing Google Calendar events, and your personal calendar is never
            shown to other members. You can disconnect at any time using the
            &ldquo;Unsync&rdquo; control, which stops syncing and removes the events
            we added, or by revoking access in your Google Account settings.
          </p>

          <h2>Gmail send access (optional)</h2>
          <p>
            So the Dashboard can send email on the club&rsquo;s behalf, an
            authorized officer connects one or more Google accounts using{" "}
            <strong>send-only</strong> permission (the <code>gmail.send</code>{" "}
            scope). This access can only send messages &mdash; it can never read,
            view, or delete mail in the connected account. The club uses these
            connected accounts to send announcements and newsletters, and to send
            automated task, event, and reminder notifications. Members may also
            optionally connect their own Google account to send messages they
            author. The tokens that permit sending are stored securely on our
            server and are never exposed in the browser or shared with other
            members.
          </p>

          <h2>Background notifications (optional)</h2>
          <p>
            If you allow browser notifications, we store a push subscription for
            that browser or device so we can deliver Dashboard notifications even
            when the site isn&rsquo;t open. You can turn this off at any time in
            your browser or device settings, which stops the notifications and lets
            us discard the subscription.
          </p>

          <h2>How information is stored</h2>
          <p>
            Dashboard data is stored in a secured Postgres database (Supabase) that
            is reachable only by our server using a private service key; row-level
            security prevents any public key from accessing it. Access tokens for
            Google Calendar and Gmail are stored server-side only and never touch
            your browser.
          </p>

          <h2>How we use and share it</h2>
          <p>
            We use your information only to operate the Dashboard for our club. We
            do not sell your information, and we do not use it for advertising. We
            share it only with the service providers that run our application (our
            hosting provider, Vercel, and our database provider, Supabase), and
            with Google when you choose to connect Google Calendar or when the club
            sends email through a connected Google account.
          </p>

          <h2>Google API disclosure</h2>
          <p>
            Project RISHI&rsquo;s use and transfer of information received from
            Google APIs adheres to the{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements. We only request the Google
            Calendar and Gmail-send permissions described above, use them solely to
            provide those features, and do not transfer that data to others except
            as needed to provide the feature, for security, or to comply with law.
          </p>

          <h2>Data retention</h2>
          <p>
            We keep Dashboard data for as long as it&rsquo;s needed to run the club.
            When you leave the club or ask us to, we remove your account
            information. Some content you created (such as tasks or messages shared
            with others) may remain visible to other members unless you ask us to
            remove it.
          </p>

          <h2>Your choices</h2>
          <ul>
            <li>Disconnect Google Calendar or a connected Gmail account at any time from Settings.</li>
            <li>Turn off browser notifications in your browser or device settings.</li>
            <li>Unsubscribe from the newsletter using the link in any newsletter email.</li>
            <li>Request removal of your account data by contacting us at the email above.</li>
          </ul>

          <h2>Eligibility</h2>
          <p>
            The Dashboard is intended for members of Project RISHI @ UC Berkeley,
            who are university students and generally 18 or older. It is not
            directed to children.
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
