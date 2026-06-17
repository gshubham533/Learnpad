import { HomeChat } from "@/components/home/HomeChat";
import { DashboardSection } from "@/components/home/DashboardSection";

export default function HomePage() {
  return (
    <>
      <section id="chat" className="home-chat-gradient -mx-0 flex flex-col md:-mx-0">
        <HomeChat />
      </section>
      <section id="dashboard" className="scroll-mt-4 border-t border-border py-8">
        <DashboardSection />
      </section>
    </>
  );
}
