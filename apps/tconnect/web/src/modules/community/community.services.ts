import { publicRequest } from "../../transport";
import type { CommunityPost } from "./community.types";
export const getCommunity = () => publicRequest<CommunityPost[]>("/public/tconnect/community");
