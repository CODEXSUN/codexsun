import React from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardHeader, CardTitle, CardContent } from "@codexsun/ui/components/card";
import {
  Wand2Icon,
  SearchIcon,
  RefreshCwIcon,
  StarIcon,
  LayersIcon,
  WorkflowIcon,
  ShieldIcon,
  CheckIcon,
  XIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from "lucide-react";

interface SkillsOrganiserPanelProps {
  skillCategoryFilter: string;
  setSkillCategoryFilter: (filter: string) => void;
  skillSearch: string;
  setSkillSearch: (search: string) => void;
  selectedSkillForDetails: any;
  setSelectedSkillForDetails: (skill: any) => void;
  skillToast: string | null;
  setSkillToast: (toast: string | null) => void;
  skillsCatalog: any;
  onScanSkills: () => Promise<void>;
  onOrganizeSkill: (name: string, updates: any) => Promise<void>;
  onRecommendSkills: (prompt: string, limit: number) => Promise<any[]>;
}

export function SkillsOrganiserPanel({
  skillCategoryFilter,
  setSkillCategoryFilter,
  skillSearch,
  setSkillSearch,
  selectedSkillForDetails,
  setSelectedSkillForDetails,
  skillToast,
  setSkillToast,
  skillsCatalog,
  onScanSkills,
  onOrganizeSkill,
  onRecommendSkills,
}: SkillsOrganiserPanelProps) {
  const handleScan = async () => {
    try {
      await onScanSkills();
      setSkillToast("Skills scanned successfully");
      setTimeout(() => setSkillToast(null), 2500);
    } catch (error) {
      setSkillToast("Failed to scan skills");
      setTimeout(() => setSkillToast(null), 2500);
    }
  };

  const filteredSkills = skillsCatalog?.skills?.filter((skill: any) => {
    const matchesCategory = skillCategoryFilter === "all" || skill.category === skillCategoryFilter;
    const matchesSearch = skill.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
                         skill.description.toLowerCase().includes(skillSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const categories = skillsCatalog?.categories || [];

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {skillToast && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
          <CheckIcon className="w-4 h-4" />
          {skillToast}
          <button
            onClick={() => setSkillToast(null)}
            className="ml-auto hover:text-green-200"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2Icon className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Skills Organiser</h3>
          <Badge variant="outline" className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e]">
            {skillsCatalog?.totalCount || 0} skills
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleScan}
          className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e] hover:text-white"
        >
          <RefreshCwIcon className="w-4 h-4 mr-2" />
          Scan Skills
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c8d8e]" />
          <input
            type="text"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#191a1c] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-purple-500/50"
          />
        </div>
        <select
          value={skillCategoryFilter}
          onChange={(e) => setSkillCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#191a1c] border border-[#2a2b2e] text-[#f3f4f6] focus:outline-none focus:border-purple-500/50"
        >
          <option value="all">All Categories</option>
          {categories.map((cat: any) => (
            <option key={cat.name} value={cat.name}>
              {cat.name} ({cat.count})
            </option>
          ))}
        </select>
      </div>

      {/* Skills List */}
      <div className="space-y-2">
        {filteredSkills.map((skill: any) => (
          <Card
            key={skill.id}
            className={`bg-[#191a1c] border-[#2a2b2e] cursor-pointer transition-colors ${
              selectedSkillForDetails?.id === skill.id ? "border-purple-500/50" : "hover:border-[#3a3b3f]"
            }`}
            onClick={() => setSelectedSkillForDetails(skill)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e]">
                    {skill.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <StarIcon className="w-3 h-3 fill-current" />
                    <span className="text-xs">{skill.rating}</span>
                  </div>
                  <span className="text-xs text-[#8c8d8e]">Used {skill.usageCount}x</span>
                </div>
                {selectedSkillForDetails?.id === skill.id ? (
                  <ChevronDownIcon className="w-4 h-4 text-[#8c8d8e]" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-[#8c8d8e]" />
                )}
              </div>
              <h4 className="font-medium text-white mb-1">{skill.name}</h4>
              <p className="text-sm text-[#8c8d8e] line-clamp-2">{skill.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skill Details */}
      {selectedSkillForDetails && (
        <Card className="bg-[#191a1c] border-[#2a2b2e]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-white">{selectedSkillForDetails.name}</CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedSkillForDetails(null)}
                className="text-[#8c8d8e] hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e]">
                {selectedSkillForDetails.category}
              </Badge>
              <Badge variant="outline" className="bg-[#202226] border-[#2a2b2e] text-[#8c8d8e]">
                {selectedSkillForDetails.domain}
              </Badge>
              <div className="flex items-center gap-1 text-yellow-400">
                <StarIcon className="w-3 h-3 fill-current" />
                <span className="text-xs">{selectedSkillForDetails.rating}</span>
              </div>
              <span className="text-xs text-[#8c8d8e]">Used {selectedSkillForDetails.usageCount}x</span>
            </div>

            <div>
              <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                <WorkflowIcon className="w-4 h-4" />
                Workflow
              </h5>
              <ul className="space-y-1">
                {selectedSkillForDetails.workflow?.map((step: string, idx: number) => (
                  <li key={idx} className="text-sm text-[#8c8d8e] flex items-start gap-2">
                    <span className="text-purple-400">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedSkillForDetails.guardrails?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <ShieldIcon className="w-4 h-4" />
                  Guardrails
                </h5>
                <ul className="space-y-1">
                  {selectedSkillForDetails.guardrails.map((guardrail: string, idx: number) => (
                    <li key={idx} className="text-sm text-[#8c8d8e] flex items-start gap-2">
                      <span className="text-red-400">⚠</span>
                      <span>{guardrail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedSkillForDetails.verificationCriteria?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <CheckIcon className="w-4 h-4" />
                  Verification Criteria
                </h5>
                <ul className="space-y-1">
                  {selectedSkillForDetails.verificationCriteria.map((criteria: string, idx: number) => (
                    <li key={idx} className="text-sm text-[#8c8d8e] flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>{criteria}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedSkillForDetails.tags?.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-white mb-2">Tags</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedSkillForDetails.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-[#202226] text-[#8c8d8e]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
