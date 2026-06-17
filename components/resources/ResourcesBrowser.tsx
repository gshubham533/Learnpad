"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResourceEntry, ResourceListResult } from "@/agent/lib/resources";
import { resourceUrl } from "@/lib/resource-url";
import { ResourceBreadcrumbs } from "./ResourceBreadcrumbs";
import { ResourceFolderTree } from "./ResourceFolderTree";
import { ResourceFileList } from "./ResourceFileList";
import { ResourcePreview } from "./ResourcePreview";
import { ResourceUploadZone } from "./ResourceUploadZone";
import { ResourceSummaryPanels } from "./ResourceSummaryPanels";

const PUBLISHED_PAGES = [
  { label: "Launch kit preview", href: "/generated/launch-kit" },
  { label: "MVP offer page", href: "/generated/offer" },
  { label: "Full profit plan", href: "/generated/profit-plan" },
];

export function ResourcesBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPath, setCurrentPath] = useState("state");
  const [list, setList] = useState<ResourceListResult | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [summaryRefresh, setSummaryRefresh] = useState(0);

  const syncUrl = useCallback(
    (path: string | null, edit: boolean) => {
      if (!path) {
        router.replace("/resources");
        return;
      }
      router.replace(resourceUrl(path, { edit }));
    },
    [router]
  );

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

  useEffect(() => {
    const path = searchParams.get("path");
    const edit = searchParams.get("edit") === "1";
    if (!path) return;

    const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "state";
    setCurrentPath(folder);
    setSelectedPath(path);
    setEditMode(edit);
  }, [searchParams]);

  function navigate(path: string) {
    setCurrentPath(path);
    setSelectedPath(null);
    setEditMode(false);
    syncUrl(null, false);
  }

  function openEntry(entry: ResourceEntry, edit = false) {
    if (entry.type === "dir") {
      navigate(entry.path);
      return;
    }

    const folder = entry.path.includes("/")
      ? entry.path.slice(0, entry.path.lastIndexOf("/"))
      : "state";
    setCurrentPath(folder);
    setSelectedPath(entry.path);
    setEditMode(edit);
    syncUrl(entry.path, edit);
  }

  function openFromSummary(entry: ResourceEntry) {
    openEntry(entry, false);
  }

  function handleEditModeChange(edit: boolean) {
    setEditMode(edit);
    if (selectedPath) syncUrl(selectedPath, edit);
  }

  function handleSelect(entry: ResourceEntry) {
    setSelectedPath(entry.path);
    setEditMode(false);
    syncUrl(entry.path, false);
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

      <ResourceSummaryPanels
        refreshToken={summaryRefresh}
        onOpenDocument={openFromSummary}
        onEditDocument={(entry) => openEntry(entry, true)}
      />

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
                  onUploaded={() => {
                    loadFolder(currentPath);
                    setSummaryRefresh((n) => n + 1);
                  }}
                />
              </div>
              {!writable && (
                <p className="text-xs text-muted-foreground">
                  This folder is read-only. Upload to{" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => navigate("state/resources")}
                  >
                    state/resources
                  </button>{" "}
                  or{" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => navigate("state/product")}
                  >
                    state/product
                  </button>
                  .
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
                  onOpen={(entry) => openEntry(entry, false)}
                  onSelect={handleSelect}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card className="w-full shrink-0 lg:w-80 xl:w-96">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{editMode ? "Editor" : "Preview"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ResourcePreview
                path={selectedPath}
                writable={selectedWritable}
                editMode={editMode}
                onEditModeChange={handleEditModeChange}
                onDeleted={() => {
                  setSelectedPath(null);
                  setEditMode(false);
                  syncUrl(null, false);
                  loadFolder(currentPath);
                  setSummaryRefresh((n) => n + 1);
                }}
                onSaved={() => {
                  loadFolder(currentPath);
                  setSummaryRefresh((n) => n + 1);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
