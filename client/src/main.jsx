import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// 1. Import Bootstrap ก่อน
import "bootstrap/dist/css/bootstrap.min.css";

// 2. Import CSS ของเราทีหลัง (เพื่อให้ Font Mitr ทับ Font เดิมได้)
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
