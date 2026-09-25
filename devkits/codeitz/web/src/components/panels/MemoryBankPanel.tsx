import React from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@codexsun/ui/components/card";
import {
  BookOpenIcon,
  DatabaseIcon,
  FileTextIcon,
  BrainCircuitIcon,
  LayersIcon,
  SparklesIcon,
  SearchIcon,
  PlusIcon,
  SaveIcon,
  RefreshCwIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";

interface MemoryBankPanelProps {
  memorySection: "productContext" | "activeContext" | "systemPatterns" | "techContext" | "progress" | "entries";
  setMemorySection: (section: "productContext" | "activeContext" | "systemPatterns" | "techContext" | "progress" | "entries") => void;
  memorySectionDraft: string;
  setMemorySectionDraft: (content: string) => void;
  memorySearch: string;
  setMemorySearch: (search: string) => void;
  newMemoryKey: string;
  setNewMemoryKey: (key: string) => void;
  newMemoryContent: string;
  setNewMemoryContent: (content: string) => void;
  newMemoryCategory: "product" | "active" | "pattern" | "tech" | "progress" | "task_fact" | "custom";
  setNewMemoryCategory: (category: "product" | "active" | "pattern" | "tech" | "progress" | "task_fact" | "custom") => void;
  newMemoryTags: string;
  setNewMemoryTags: (tags: string) => void;
  newMemoryImportance: number;
  setNewMemoryImportance: (importance: number) => void;
  memoryToast: string | null;
  setMemoryToast: (toast: string | null) => void;
  memoryBankData: any;
  onUpdateSection: (section: string, content: string) => Promise<void>;
  onCreateEntry: (entry: any) => Promise<void>;
  onSyncMemory: () => Promise<void>;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  productContext: <BookOpenIcon className="w-4 h-4" />,
  activeContext: <SparklesIcon className="w-4 h-4" />,
  systemPatterns: <LayersIcon className="w-4 h-4" />,
  techContext: <DatabaseIcon className="w-4 h-4" />,
  progress: <BrainCircuitIcon className="w-4 h-4" />,
  entries: <FileTextIcon className="w-4 h-4" />,
};

const SECTION_TITLES: Record<string, string> = {
  productContext: "Product Context",
  activeContext: "Active Context",
  systemPatterns: "System Patterns",
  techContext: "Tech Context",
  progress: "Progress",
  entries: "Memory Entries",
};

export function MemoryBankPanel({
  memorySection,
  setMemorySection,
  memorySectionDraft,
  setMemorySectionDraft,
  memorySearch,
  setMemorySearch,
  newMemoryKey,
  setNewMemoryKey,
  newMemoryContent,
  setNewMemoryContent,
  newMemoryCategory,
  setNewMemoryCategory,
  newMemoryTags,
  setNewMemoryTags,
  newMemoryImportance,
  setNewMemoryImportance,
  memoryToast,
  setMemoryToast,
  memoryBankData,
  onUpdateSection,
  onCreateEntry,
  onSyncMemory,
}: MemoryBankPanelProps) {
  const handleSaveSection = async () => {
    try {
      await onUpdateSection(memorySection, memorySectionDraft);
      setMemoryToast("Section updated successfully");
      setTimeout(() => setMemoryToast(null), 2500);
    } catch (error) {
      setMemoryToast("Failed to update section");
      setTimeout(() => setMemoryToast(null), 2500);
    }
  };

  const handleCreateEntry = async () => {
    if (!newMemoryKey || !newMemoryContent) {
      setMemoryToast("Key and content are required");
      setTimeout(() => setMemoryToast(null), 2500);
      return;
    }

    try {
      await onCreateEntry({
        key: newMemoryKey,
        content: newMemoryContent,
        category: newMemoryCategory,
        tags: newMemoryTags.split(",").map(t => t.trim()).filter(t => t),
        importance: newMemoryImportance,
      });
      setMemoryToast("Memory entry created");
      setNewMemoryKey("");
      setNewMemoryContent("");
      setNewMemoryTags("");
      setNewMemoryImportance(5);
      setTimeout(() => setMemoryToast(null), 2500);
    } catch (error) {
      setMemoryToast("Failed to create entry");
      setTimeout(() => setMemoryToast(null), 2500);
    }
  };

  const handleSync = async () => {
    try {
      await onSyncMemory();
      setMemoryToast("Memory bank synced");
      setTimeout(() => setMemoryToast(null), 2500);
    } catch (error) {
      setMemoryToast("Failed to sync memory");
      setTimeout(() => setMemoryToast(null), 2500);
    }
  };

  const filteredEntries = memoryBankData?.entries?.filter((entry: any) =>
    entry.key.toLowerCase().includes(memorySearch.toLowerCase()) ||
    entry.content.toLowerCase().includes(memorySearch.toLowerCase()) ||
    entry.tags?.some((tag: string) => tag.toLowerCase().includes(memorySearch.toLowerCase()))
  ) || [];

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {memoryToast && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
          <CheckIcon className="w-4 h-4" />
          {memoryToast}
          <button
            onClick={() => setMemoryToast(null)}
            className="ml-auto hover:text-green-200"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(SECTION_ICONS).map((section) => (
          <button
            key={section}
            onClick={() => setMemorySection(section as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              memorySection === section
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-[#191a1c] text-[#8c8d8e] border border-[#2a2b2e] hover:border-[#3a3b3f]"
            }`}
          >
            {SECTION_ICONS[section]}
            {SECTION_TITLES[section]}
          </button>
        ))}
      </div>

      {/* Section Content Editor */}
      {memorySection !== "entries" && (
        <Card className="bg-[#191a1c] border-[#2a2b2e]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                {SECTION_ICONS[memorySection]}
                {SECTION_TITLES[memorySection]}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e] hover:text-white"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Sync
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveSection}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={memorySectionDraft}
              onChange={(e) => setMemorySectionDraft(e.target.value)}
              className="w-full h-64 p-3 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] font-mono text-sm resize-none focus:outline-none focus:border-blue-500/50"
              placeholder={`Edit ${SECTION_TITLES[memorySection]}...`}
            />
          </CardContent>
        </Card>
      )}

      {/* Memory Entries */}
      {memorySection === "entries" && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8d8e]" />
            <input
              type="text"
              value={memorySearch}
              onChange={(e) => setMemorySearch(e.target.value)}
              placeholder="Search memory entries..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#191a1c] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* New Entry Form */}
          <Card className="bg-[#191a1c] border-[#2a2b2e]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                New Memory Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                type="text"
                value={newMemoryKey}
                onChange={(e) => setNewMemoryKey(e.target.value)}
                placeholder="Entry key (e.g., 'repo_boundary_rule')"
                className="w-full px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50"
              />
              <textarea
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                placeholder="Entry content..."
                className="w-full h-24 px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50 resize-none"
              />
              <div className="flex gap-3">
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] focus:outline-none focus:border-blue-500/50"
                >
                  <option value="product">Product</option>
                  <option value="active">Active</option>
                  <option value="pattern">Pattern</option>
                  <option value="tech">Tech</option>
                  <option value="progress">Progress</option>
                  <option value="task_fact">Task Fact</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  type="text"
                  value={newMemoryTags}
                  onChange={(e) => setNewMemoryTags(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="flex-1 px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50"
                />
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newMemoryImportance}
                  onChange={(e) => setNewMemoryImportance(parseInt(e.target.value))}
                  className="w-20 px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <Button onClick={handleCreateEntry} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Entry
              </Button>
            </CardContent>
          </Card>

          {/* Entries List */}
          <div className="space-y-2">
            {filteredEntries.map((entry: any) => (
              <Card key={entry.id} className="bg-[#191a1c] border-[#2a2b2e]">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e]">
                        {entry.category}
                      </Badge>
                      <span className="text-xs text-[#8c8d8e]">Importance: {entry.importance}</span>
                    </div>
                    <span className="text-xs text-[#8c8d8e]">{new Date(entry.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-medium text-white mb-1">{entry.key}</h4>
                  <p className="text-sm text-[#8c8d8e] mb-2">{entry.content}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-[#202226] text-[#8c8d8e]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
