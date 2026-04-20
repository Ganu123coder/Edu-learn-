import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@/lib/custom-fetch"; 
// OR correct relative path if different

setBaseUrl(import.meta.env.VITE_API_URL);

createRoot(document.getElementById("root")!).render(<App />);
