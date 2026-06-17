import Link from "next/link";
import {
  Bot,
  Sparkles,
  FileText,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IDEA_CARDS = [
  {
    icon: Bot,
    title: "Supervised autonomous agent",
    description:
      "Click Start and the agent works in the background. It reads your goal, plans small steps, writes code and docs, and pauses when it needs your input.",
  },
  {
    icon: Sparkles,
    title: "Dashboard that grows with your project",
    description:
      "New dashboard blocks and pages appear as the agent works — tailored to what you're achieving.",
  },
  {
    icon: FileText,
    title: "No database, just files",
    description:
      "Everything lives in simple files on disk. The UI is a window onto your progress — easy to read, easy to understand.",
  },
] as const;

const USAGE_STEPS = [
  {
    step: 1,
    title: "Complete Setup",
    description: "Enter your name, Cursor API key, and describe what you want to achieve.",
    href: "/setup",
  },
  {
    step: 2,
    title: "Start the agent",
    description: "Click Start agent on Home. The agent begins working toward your goal.",
    href: "/",
  },
  {
    step: 3,
    title: "Watch progress",
    description: "Open What's Happening to see live activity and a running journal of what's been done.",
    href: "/activity",
  },
  {
    step: 4,
    title: "Answer tasks",
    description: "When the agent needs a decision from you, it will show up on Your tasks.",
    href: "/tasks",
  },
  {
    step: 5,
    title: "Browse resources",
    description: "Docs, launch assets, and uploads the agent creates appear in Resources.",
    href: "/resources",
  },
  {
    step: 6,
    title: "Chat anytime",
    description: "Use the chat on Home to ask questions, steer direction, or get explanations.",
    href: "/",
  },
] as const;

const PAGE_GUIDE = [
  {
    page: "Home",
    href: "/",
    description: "Chat with the agent, Start/Stop the loop, and see your progress dashboard.",
  },
  {
    page: "What's Happening",
    href: "/activity",
    description: "Live agent stream, current task, and full activity journal.",
  },
  {
    page: "Your tasks",
    href: "/tasks",
    description: "Answer questions and provide input the agent needs to keep going.",
  },
  {
    page: "Resources",
    href: "/resources",
    description: "Browse agent-created docs, launch assets, and uploaded files.",
  },
  {
    page: "Settings",
    href: "/settings",
    description: "Toggle self-prompting, change model, and adjust timeouts.",
  },
  {
    page: "Setup",
    href: "/setup",
    description: "Update your API key, name, or goal.",
  },
] as const;

const AGENT_LOOP_STEPS = [
  "You set a goal",
  "Agent plans a step",
  "Builds & updates progress",
  "Shows results in the UI",
  "Pauses if it needs you",
  "Repeats until done",
] as const;

const TIPS = [
  "Answer tasks promptly — the agent is waiting on you when something appears on Your tasks.",
  "Check What's Happening if you're unsure what the agent is doing.",
  "Use Chat on Home to steer direction or ask for explanations.",
  "Idle or waiting states are normal — the agent explains why on Your tasks.",
] as const;

export default function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <div>
        <Badge className="mb-2" variant="secondary">
          Open cockpit for goal-driven agent projects
        </Badge>
        <h1 className="text-2xl font-bold">How Runboard works</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Runboard is a stateful agent workspace for long-horizon projects — ship an MVP,
          run a launch, or drive a multi-week initiative. Describe what you want to achieve
          in plain language, and a supervised agent works toward it while you watch, chat,
          and answer when it needs a decision.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {IDEA_CARDS.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <CardHeader className="pb-2">
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to use Runboard</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {USAGE_STEPS.map(({ step, title, description, href }) => (
              <li key={step} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {step}
                </span>
                <div>
                  <Link
                    href={href}
                    className="font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {title}
                  </Link>
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {PAGE_GUIDE.map(({ page, href, description }) => (
              <div
                key={page}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <Link
                  href={href}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {page}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>The agent loop</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            {AGENT_LOOP_STEPS.map((label, i) => (
              <span key={label} className="flex items-center gap-2">
                <span className="rounded-md bg-background px-2.5 py-1.5 font-medium shadow-sm">
                  {label}
                </span>
                {i < AGENT_LOOP_STEPS.length - 1 && (
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                )}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <strong className="font-medium text-foreground">Self-prompting</strong> controls
            whether the agent keeps going automatically. When it&apos;s on, the agent
            continues step after step. When it&apos;s off, it does one step and waits for you
            to start again. Toggle it in{" "}
            <Link href="/settings" className="text-primary underline">
              Settings
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-amber-500" />
            Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
            {TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
