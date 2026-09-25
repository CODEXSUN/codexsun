import React from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@codexsun/ui/components/card";
import {
  GlobeIcon,
  MonitorIcon,
  EyeIcon,
  SparklesIcon,
  Volume2Icon,
  CpuIcon,
  LaptopIcon,
  TableIcon,
  FileTextIcon,
  CheckIcon,
  SearchIcon,
  MicIcon,
  SettingsIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react";

interface CapabilitiesPanelProps {
  capabilities: any[];
  webSearchActive: boolean;
  setWebSearchActive: (active: boolean) => void;
  browserActive: boolean;
  setBrowserActive: (active: boolean) => void;
  computerUseActive: boolean;
  setComputerUseActive: (active: boolean) => void;
  imageGenActive: boolean;
  setImageGenActive: (active: boolean) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  autoCorrectSpelling: boolean;
  setAutoCorrectSpelling: (enabled: boolean) => void;
  attachedFiles: Array<{ id: string; name: string; type: "image" | "excel" | "pdf"; size: string }>;
  setAttachedFiles: (files: Array<{ id: string; name: string; type: "image" | "excel" | "pdf"; size: string }>) => void;
  onWebSearch: (query: string) => Promise<void>;
  onBrowserAutomation: (action: string, url: string) => Promise<void>;
  onComputerUse: (command: string) => Promise<void>;
  onImageGeneration: (prompt: string, style: string) => Promise<void>;
  onVisionAnalysis: (filename: string) => Promise<void>;
  onExcelAnalysis: (filename: string) => Promise<void>;
  onPdfAnalysis: (filename: string) => Promise<void>;
  onTranscribeVoice: (audioData: string) => Promise<void>;
}

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  web_search: <GlobeIcon className="w-5 h-5" />,
  browser_automation: <MonitorIcon className="w-5 h-5" />,
  vision: <EyeIcon className="w-5 h-5" />,
  image_generation: <SparklesIcon className="w-5 h-5" />,
  text_to_speech: <Volume2Icon className="w-5 h-5" />,
  multi_model_reasoning: <CpuIcon className="w-5 h-5" />,
  computer_use: <LaptopIcon className="w-5 h-5" />,
  excel_analysis: <TableIcon className="w-5 h-5" />,
  pdf_analysis: <FileTextIcon className="w-5 h-5" />,
  prompt_spelling_corrections: <CheckIcon className="w-5 h-5" />,
  voice_to_text: <MicIcon className="w-5 h-5" />,
};

export function CapabilitiesPanel({
  capabilities,
  webSearchActive,
  setWebSearchActive,
  browserActive,
  setBrowserActive,
  computerUseActive,
  setComputerUseActive,
  imageGenActive,
  setImageGenActive,
  ttsEnabled,
  setTtsEnabled,
  autoCorrectSpelling,
  setAutoCorrectSpelling,
  attachedFiles,
  setAttachedFiles,
  onWebSearch,
  onBrowserAutomation,
  onComputerUse,
  onImageGeneration,
  onVisionAnalysis,
  onExcelAnalysis,
  onPdfAnalysis,
  onTranscribeVoice,
}: CapabilitiesPanelProps) {
  const [webSearchQuery, setWebSearchQuery] = React.useState("");
  const [browserAction, setBrowserAction] = React.useState("navigate");
  const [browserUrl, setBrowserUrl] = React.useState("");
  const [computerCommand, setComputerCommand] = React.useState("");
  const [imagePrompt, setImagePrompt] = React.useState("");
  const [imageStyle, setImageStyle] = React.useState("diagram");

  const handleWebSearch = async () => {
    if (webSearchQuery.trim()) {
      await onWebSearch(webSearchQuery);
      setWebSearchQuery("");
    }
  };

  const handleBrowserAutomation = async () => {
    if (browserUrl.trim()) {
      await onBrowserAutomation(browserAction, browserUrl);
      setBrowserUrl("");
    }
  };

  const handleComputerUse = async () => {
    if (computerCommand.trim()) {
      await onComputerUse(computerCommand);
      setComputerCommand("");
    }
  };

  const handleImageGeneration = async () => {
    if (imagePrompt.trim()) {
      await onImageGeneration(imagePrompt, imageStyle);
      setImagePrompt("");
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: (file.type.startsWith("image/") ? "image" :
               file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.name.endsWith(".csv") ? "excel" :
               file.name.endsWith(".pdf") ? "pdf" : "image") as "image" | "excel" | "pdf",
        size: `${(file.size / 1024).toFixed(1)} KB`,
      }));
      setAttachedFiles([...attachedFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (id: string) => {
    setAttachedFiles(attachedFiles.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Capabilities</h3>
          <Badge variant="outline" className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e]">
            {capabilities.filter(c => c.enabled).length} active
          </Badge>
        </div>
      </div>

      {/* Capability Toggles */}
      <div className="grid grid-cols-2 gap-2">
        {capabilities.map((capability) => (
          <button
            key={capability.id}
            onClick={() => {
              switch (capability.id) {
                case "web_search": setWebSearchActive(!webSearchActive); break;
                case "browser_automation": setBrowserActive(!browserActive); break;
                case "computer_use": setComputerUseActive(!computerUseActive); break;
                case "image_generation": setImageGenActive(!imageGenActive); break;
                case "text_to_speech": setTtsEnabled(!ttsEnabled); break;
                case "prompt_spelling_corrections": setAutoCorrectSpelling(!autoCorrectSpelling); break;
              }
            }}
            className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
              ((capability.id === "web_search" && webSearchActive) ||
               (capability.id === "browser_automation" && browserActive) ||
               (capability.id === "computer_use" && computerUseActive) ||
               (capability.id === "image_generation" && imageGenActive) ||
               (capability.id === "text_to_speech" && ttsEnabled) ||
               (capability.id === "prompt_spelling_corrections" && autoCorrectSpelling))
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "bg-[#191a1c] text-[#8c8d8e] border border-[#2a2b2e] hover:border-[#3a3b3f]"
            }`}
          >
            {CAPABILITY_ICONS[capability.id]}
            <div className="flex-1">
              <div className="font-medium text-sm">{capability.name}</div>
              <div className="text-xs opacity-70">{capability.category}</div>
            </div>
            {((capability.id === "web_search" && webSearchActive) ||
             (capability.id === "browser_automation" && browserActive) ||
             (capability.id === "computer_use" && computerUseActive) ||
             (capability.id === "image_generation" && imageGenActive) ||
             (capability.id === "text_to_speech" && ttsEnabled) ||
             (capability.id === "prompt_spelling_corrections" && autoCorrectSpelling)) && (
              <CheckIcon className="w-4 h-4" />
            )}
          </button>
        ))}
      </div>

      {/* Active Capability Panels */}
      {webSearchActive && (
        <Card className="bg-[#191a1c] border-[#2a2b2e]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <GlobeIcon className="w-4 h-4" />
              Web Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleWebSearch()}
                placeholder="Search documentation, APIs, packages..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50"
              />
              <Button onClick={handleWebSearch} className="bg-blue-500 hover:bg-blue-600 text-white">
                <SearchIcon className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {browserActive && (
        <Card className="bg-[#191a1c] border-[#2a2b2e]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <MonitorIcon className="w-4 h-4" />
              Browser Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={browserAction}
              onChange={(e) => setBrowserAction(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] focus:outline-none focus:border-blue-500/50"
            >
              <option value="navigate">Navigate</option>
              <option value="click">Click Element</option>
              <option value="fill">Fill Form</option>
              <option value="screenshot">Screenshot</option>
            </select>
            <div className="flex gap-2">
              <input
                type="text"
                value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                placeholder="URL or selector..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50"
              />
              <Button onClick={handleBrowserAutomation} className="bg-blue-500 hover:bg-blue-600 text-white">
                Run
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {computerUseActive && (
        <Card className="bg-[#191a1c] border-[#2a2b2e]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <LaptopIcon className="w-4 h-4" />
              Computer Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={computerCommand}
                onChange={(e) => setComputerCommand(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleComputerUse()}
                placeholder="Enter system command..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50"
              />
              <Button onClick={handleComputerUse} className="bg-blue-500 hover:bg-blue-600 text-white">
                Execute
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {imageGenActive && (
        <Card className="bg-[#191a1c] border-[#2a2b2e]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <SparklesIcon className="w-4 h-4" />
              Image Generation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full h-24 px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50 resize-none"
            />
            <div className="flex gap-2">
              <select
                value={imageStyle}
                onChange={(e) => setImageStyle(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#f3f4f6] focus:outline-none focus:border-blue-500/50"
              >
                <option value="diagram">Diagram</option>
                <option value="mockup">Mockup</option>
                <option value="flowchart">Flowchart</option>
                <option value="architecture">Architecture</option>
              </select>
              <Button onClick={handleImageGeneration} className="bg-blue-500 hover:bg-blue-600 text-white">
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Attachments */}
      <Card className="bg-[#191a1c] border-[#2a2b2e]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white flex items-center gap-2">
            <PaperclipIcon className="w-4 h-4" />
            Attached Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <input
              type="file"
              multiple
              accept="image/*,.xlsx,.xls,.csv,.pdf"
              onChange={handleFileAttach}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="flex-1 px-3 py-2 rounded-lg bg-[#121315] border border-[#2a2b2e] text-[#8c8d8e] text-center cursor-pointer hover:border-blue-500/50 transition-colors"
            >
              Click to attach files (images, Excel, PDF)
            </label>
          </div>
          {attachedFiles.length > 0 && (
            <div className="space-y-2">
              {attachedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 rounded bg-[#121315] border border-[#2a2b2e]">
                  <div className="flex items-center gap-2">
                    {file.type === "image" && <EyeIcon className="w-4 h-4 text-blue-400" />}
                    {file.type === "excel" && <TableIcon className="w-4 h-4 text-green-400" />}
                    {file.type === "pdf" && <FileTextIcon className="w-4 h-4 text-red-400" />}
                    <span className="text-sm text-[#f3f4f6]">{file.name}</span>
                    <span className="text-xs text-[#8c8d8e]">{file.size}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveFile(file.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <XIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
