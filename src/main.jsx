import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/theme.css";

import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, HashRouter } from "react-router-dom";

const isElectron = window.navigator.userAgent.includes('Electron');
const Router = isElectron ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")).render(
  <Router>
    <App />
  </Router>
);