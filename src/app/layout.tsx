import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'SentinelX — Security Command Center',description:'Independent, evidence-first security monitoring for Robinhood Chain. Read-only testnet beta.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
