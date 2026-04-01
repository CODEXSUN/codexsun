import { Routes, Route } from "react-router-dom";
import { DocsLayout } from "./layout";
import IndexPage from "./pages/index";
import ButtonPage from "./pages/button";
import BadgePage from "./pages/badge";
import CardPage from "./pages/card";
import InputPage from "./pages/input";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DocsLayout />}>
        <Route index element={<IndexPage />} />
        <Route path="button" element={<ButtonPage />} />
        <Route path="badge" element={<BadgePage />} />
        <Route path="card" element={<CardPage />} />
        <Route path="input" element={<InputPage />} />
        <Route path="*" element={<div><h2 className="text-2xl font-bold p-8">Component Not Added Yet...</h2></div>} />
      </Route>
    </Routes>
  );
}
