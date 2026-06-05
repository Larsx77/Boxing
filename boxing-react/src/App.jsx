import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Champions from "./pages/Champions";
import Titels from "./pages/Titels";
import UpcomingFights from "./pages/UpcomingFights";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "");

Review Janine: Werkt prima voor de huidige omvang van de applicatie. Ik mis alleen nog een catch-all route voor onbekende paden en eventueel 
lazy loading van pagina's als de applicatie groter wordt.

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/champions" element={<Champions />} />
        <Route path="/titels" element={<Titels />} />
        <Route path="/upcoming-fights" element={<UpcomingFights />} />
      </Routes>
    </BrowserRouter>
  );
}
