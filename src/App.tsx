import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CaseSelection from "@/pages/CaseSelection";
import Dispatch from "@/pages/Dispatch";
import Review from "@/pages/Review";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CaseSelection />} />
        <Route path="/dispatch" element={<Dispatch />} />
        <Route path="/review" element={<Review />} />
      </Routes>
    </Router>
  );
}
