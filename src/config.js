import { PORT } from "../backend/config";

const API_URL = import.meta.env.VITE_API_URL || `http://localhost:${PORT}`;
export default API_URL;