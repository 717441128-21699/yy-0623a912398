import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CaseSelection from "@/pages/CaseSelection";
import Dispatch from "@/pages/Dispatch";
import Review from "@/pages/Review";
import TeacherDashboard from "@/pages/TeacherDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CaseSelection />} />
        <Route path="/dispatch" element={<Dispatch />} />
        <Route path="/review" element={<Review />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Routes>
    </Router>
  );
}
