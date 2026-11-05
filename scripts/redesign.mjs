import {readFileSync,writeFileSync} from 'node:fs';
const path='src/components/command-center.tsx';let ui=readFileSync(path,'utf8');
if(!ui.includes("from './token-core'")){
ui=ui.replace("import type {Snapshot,Observation} from '@/lib/monitor';","import type {Snapshot,Observation} from '@/lib/monitor';\nimport {TokenCore,LiveExplorer} from './token-core';");
const start=ui.indexOf("{view==='Dashboard'?<><section className=\"hero-panel\">");const end=ui.indexOf('<section className="metrics">',start);if(start<0||end<0)throw Error('Dashboard marker missing');
ui=ui.slice(0,start)+"{view==='Dashboard'?<><TokenCore connected={!!wallet} onToken={()=>setView('Token')} onWallet={()=>void connect()}/><LiveExplorer data={data}/>"+ui.slice(end);
ui=ui.replace("['Dashboard',LayoutDashboard],['Sentinels',ShieldCheck]","['Dashboard',LayoutDashboard],['Token',Network],['Sentinels',ShieldCheck]").replace("['Community',Users],['Token',Network],['Documentation',BookOpen]","['Community',Users],['Documentation',BookOpen]");writeFileSync(path,ui);
}