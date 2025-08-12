import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as normalizers from './lib/normalizers'

// Expose normalizers for non-async dynamic access used by executionApi CSV builder
;(window as any).__frontand_normalizers__ = normalizers

createRoot(document.getElementById("root")!).render(<App />);
