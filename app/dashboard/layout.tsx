import ChatWidget from "@/components/ChatWidget";
import PushManager from "@/components/PushManager";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PushManager />
      <ChatWidget />
    </>
  );
}
