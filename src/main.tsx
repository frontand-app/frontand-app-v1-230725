import { createRoot } from 'react-dom/client'
import SimpleApp from './App-simple.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<SimpleApp />);
