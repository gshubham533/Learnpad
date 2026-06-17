"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResourceEntry, ResourceListResult } from "@/agent/lib/resources";
import { ResourceBreadcrumbs } from "./ResourceBreadcrumbs";
import { ResourceFolderTree } from "./ResourceFolderTree";
import { ResourceFileList } from "./ResourceFileList";
import { ResourcePreview } from "./ResourcePreview";
import { ResourceUploadZone } from "./ResourceUploadZone";

const PUBLISHED_PAGES = [
  { label: "Launch kit preview", href: "/generated/launch-kit" },
  { label: "MVP offer page", href: "/generated/offer" },
  { label: "Full profit plan", href: "/generated/profit-plan" },
];

export function ResourcesBrowser() {
  const [currentPath, setCurrentPath] = useState("state");
  const [list, setList] = useState<ResourceListResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);

  const loadFolder = useCallback(async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources?path=${encodeURIComponent(path)}`);
      const data: ResourceListResult = await res.json();
      if (res.ok) setList(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFolder(currentPath);
  }, [currentPath, loadFolder]);

  function navigate(path: string) {
    setCurrentPath(path);
    setSelectedPath(null);
  }

  function openEntry(entry: ResourceEntry) {
    if (entry.type === "dir") {
      navigate(entry.path);
    } else {
      setSelectedPath(entry.path);
    }
  }

  const writable = list?.writable ?? false;
  const selectedWritable =
    selectedPath !== null &&
    (selectedPath.startsWith("state/resources/") || selectedPath.startsWith("state/product/"));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Published pages</CardTitle>
          <CardDescription>Agent-built pages you can share or review.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {PUBLISHED_PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
            >
              {page.label}
              <ExternalLink className="size-3 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Card className="w-full shrink-0 lg:w-56 xl:w-64">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Folders</CardTitle>
          </CardHeader>
          <CardContent className="p-2 pt-0">
            <ResourceFolderTree currentPath={currentPath} onNavigate={navigate} />
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row">
          <Card className="min-w-0 flex-1">
            <CardHeader className="space-y-3 pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">Files</CardTitle>
                  {list && (
                    <ResourceBreadcrumbs crumbs={list.breadcrumbs} onNavigate={navigate} />
                  )}
                </div>
                <ResourceUploadZone
                  folder={currentPath}
                  disabled={!writable}
                  onUploaded={() => loadFolder(currentPath)}
                />
              </div>
              {!writable && (
                <p className="text-xs text-muted-foreground">
                  This folder is read-only. Upload to <button type="button" className="text-primary underline" onClick={() => navigate("state/resources")}>state/resources</button> or <button type="button" className="text-primary underline" onClick={() => navigate("state/product")}>state/product</button>.
                </p>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : list ? (
                <ResourceFileList
                  entries={list.entries}
                  selectedPath={selectedPath}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onOpen={openEntry}
                  onSelect={(entry) => setSelectedPath(entry.path)}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card className="w-full shrink-0 lg:w-80 xl:w-96">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ResourcePreview
                path={selectedPath}
                writable={selectedWritable}
                onDeleted={() => {
                  setSelectedPath(null);
                  loadFolder(currentPath);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
