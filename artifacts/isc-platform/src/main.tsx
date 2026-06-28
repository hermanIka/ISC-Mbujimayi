import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/index";
import { setDemoUserId } from "@workspace/api-client-react";

const savedDemoId = localStorage.getItem("isc_demo_user_id");
if (savedDemoId) setDemoUserId(savedDemoId);

createRoot(document.getElementById("root")!).render(<App />);
