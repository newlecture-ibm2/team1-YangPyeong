export interface PolicySummary {
  title: string;
  category: string | null;
  support_amount: string | null;
}

export interface CropRiskSummary {
  crop: string;
  status: string;
  ratio: number | null;
}

export interface AlternativeCropSummary {
  crop: string;
  reason: string | null;
}

export interface GraphSource {
  type: string;
  description: string;
}

export interface ExtractedEntities {
  region: string | null;
  crop: string | null;
  farm: string | null;
}

export interface GovGraphSummary {
  intent: string;
  user_role: string;
  target_region: string | null;
  target_crop: string | null;
  target_farm: string | null;
  supply_status: string | null;
  supply_ratio: number | null;
  related_policies: PolicySummary[];
  risk_crops: CropRiskSummary[];
  recommended_crops: AlternativeCropSummary[];
  sources: GraphSource[];
}

export interface GovChatResponse {
  intent: string | null;
  entities: ExtractedEntities | null;
  answer: string;
  graph_summary: GovGraphSummary | null;
  error: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: number;
  sources?: GraphSource[];
}
