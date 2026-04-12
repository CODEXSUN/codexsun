import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  useZetroMemorySearchQuery,
  useZetroMemoryVectorsQuery,
  useZetroMemoryStatsQuery,
  useStoreZetroMemoryMutation,
  type ZetroMemorySearchResult,
} from "../api/zetro-api";

import { ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell";

export function ZetroMemoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [storeContent, setStoreContent] = useState("");
  const [storeType, setStoreType] = useState<
    "finding" | "run-summary" | "chat-message" | "command-output"
  >("finding");

  const statsQuery = useZetroMemoryStatsQuery();
  const vectorsQuery = useZetroMemoryVectorsQuery({ limit: 20 });
  const searchQueryHook = useZetroMemorySearchQuery(searchQuery || null);
  const storeMutation = useStoreZetroMemoryMutation();

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handleStore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storeContent.trim()) return;

    storeMutation.mutate(
      {
        content: storeContent,
        contentType: storeType,
      },
      {
        onSuccess: () => {
          setStoreContent("");
          void vectorsQuery.refetch();
          void statsQuery.refetch();
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Phase 2.1"
        title="Semantic Memory"
        description="Long-term memory for Zetro using vector embeddings. Search for similar past findings, store new content, and build institutional knowledge."
      />

      {statsQuery.data ? (
        <div className="grid gap-4 md:grid-cols-4">
          <ZetroPanel>
            <CardContent className="space-y-2 p-5">
              <p className="text-muted-foreground text-sm font-medium">
                Total vectors
              </p>
              <p className="text-foreground text-3xl font-semibold">
                {statsQuery.data.total}
              </p>
            </CardContent>
          </ZetroPanel>
          <ZetroPanel>
            <CardContent className="space-y-2 p-5">
              <p className="text-muted-foreground text-sm font-medium">
                Provider
              </p>
              <p className="text-foreground text-lg font-semibold">
                {statsQuery.data.config.provider}
              </p>
            </CardContent>
          </ZetroPanel>
          <ZetroPanel>
            <CardContent className="space-y-2 p-5">
              <p className="text-muted-foreground text-sm font-medium">Model</p>
              <p className="text-foreground text-lg font-semibold">
                {statsQuery.data.config.ollamaModel}
              </p>
            </CardContent>
          </ZetroPanel>
          <ZetroPanel>
            <CardContent className="space-y-2 p-5">
              <p className="text-muted-foreground text-sm font-medium">
                Findings
              </p>
              <p className="text-foreground text-3xl font-semibold">
                {statsQuery.data.byType["finding"] ?? 0}
              </p>
            </CardContent>
          </ZetroPanel>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <ZetroPanel>
          <CardContent className="space-y-4 p-5">
            <p className="text-foreground font-semibold">Search memory</p>
            <form className="space-y-3" onSubmit={handleSearch}>
              <div className="grid gap-2">
                <Label htmlFor="memory-search">Query</Label>
                <Input
                  id="memory-search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search for similar findings..."
                />
              </div>
              <Button
                type="submit"
                className="rounded-md"
                disabled={!searchQuery.trim()}
                onClick={() => searchQueryHook.refetch()}
              >
                Search
              </Button>
            </form>

            {searchQueryHook.data && searchQueryHook.data.length > 0 ? (
              <div className="space-y-3">
                <p className="text-foreground text-sm font-semibold">
                  Results ({searchQueryHook.data.length})
                </p>
                {searchQueryHook.data.map((result: ZetroMemorySearchResult) => (
                  <div
                    key={result.id}
                    className="border-border/70 rounded-md border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="outline" className="rounded-md">
                        {(result.similarity * 100).toFixed(0)}% match
                      </Badge>
                      <Badge variant="secondary" className="rounded-md">
                        {result.contentType}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : searchQuery && !searchQueryHook.isLoading ? (
              <p className="text-muted-foreground text-sm">
                No similar content found.
              </p>
            ) : null}
          </CardContent>
        </ZetroPanel>

        <ZetroPanel>
          <CardContent className="space-y-4 p-5">
            <p className="text-foreground font-semibold">Store in memory</p>
            <form className="space-y-3" onSubmit={handleStore}>
              <div className="grid gap-2">
                <Label>Content type</Label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "finding",
                      "run-summary",
                      "chat-message",
                      "command-output",
                    ] as const
                  ).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      size="sm"
                      variant={storeType === type ? "default" : "outline"}
                      className="rounded-md"
                      onClick={() => setStoreType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="memory-content">Content</Label>
                <Textarea
                  id="memory-content"
                  value={storeContent}
                  onChange={(event) => setStoreContent(event.target.value)}
                  placeholder="Content to store in memory..."
                  rows={4}
                  required
                />
              </div>
              {storeMutation.error ? (
                <p className="text-destructive text-sm">
                  {storeMutation.error.message}
                </p>
              ) : null}
              <Button
                type="submit"
                className="rounded-md"
                disabled={!storeContent.trim() || storeMutation.isPending}
              >
                {storeMutation.isPending ? "Storing..." : "Store"}
              </Button>
            </form>
          </CardContent>
        </ZetroPanel>
      </div>

      <ZetroPanel>
        <CardContent className="space-y-4 p-5">
          <p className="text-foreground font-semibold">Memory vectors</p>
          {(vectorsQuery.data ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No memory vectors stored yet.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {(vectorsQuery.data ?? []).map((vector) => (
                <div
                  key={vector.id}
                  className="border-border/70 rounded-md border p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-md font-mono text-xs"
                    >
                      {vector.id.substring(0, 16)}...
                    </Badge>
                    <Badge variant="secondary" className="rounded-md">
                      {vector.contentType}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-5">
                    {vector.content.substring(0, 150)}...
                  </p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {new Date(vector.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </ZetroPanel>
    </div>
  );
}
