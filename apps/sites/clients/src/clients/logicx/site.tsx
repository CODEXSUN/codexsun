import { LazyMotion } from "framer-motion";
import { LogicxSite } from "./LogicxSite";
const loadFeatures = () => import("./motion-features").then((module) => module.default);
export default function LogicxSurface() {
  return <LazyMotion features={loadFeatures} strict><LogicxSite /></LazyMotion>;
}
