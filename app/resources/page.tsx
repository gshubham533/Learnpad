import { Suspense } from "react";
import { ResourcesBrowser } from "@/components/resources/ResourcesBrowser";

export const dynamic = "force-dynamic";

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resources</h1>
        <p className="text-muted-foreground">
          Browse documentation, launch assets, and uploaded files. Open a file with{" "}
          <code className="text-xs">?edit=1</code> to edit in place.
        </p>
      </div>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading resources…</p>}>
        <ResourcesBrowser />
      </Suspense>
    </div>
  );
}
