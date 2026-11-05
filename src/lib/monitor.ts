import { createPublicClient, http, keccak256, toHex, formatEther } from 'viem';
import {chain, monitored} from './chain';
export type Observation = {id:string;agent:string;title:string;severity:'info'|'medium'|'high';block:string;hash:string;address:string;detail:string;confidence:number;kind:'transaction'|'block'};
export type Snapshot = {status:'live'|'unavailable';chainId:number;head:string;checkedAt:string;latency:number;blocks:{number:string;transactions:number;timestamp:number;hash:string}[];observations:Observation[];contracts:typeof monitored;agents:{name:string;status:string;detail:string;processed:number}[];error?:string};
export function classifyTransaction(tx:{hash:string;to:string|null;value:bigint;input:string}, block:string):Observation|null {
 if(tx.value < 10n**19n) return null;
 return {id:`flow:${tx.hash}`,agent:'Transaction Guardian',title:'Large native transfer',severity:'medium',block,hash:tx.hash,address:tx.to??'',detail:`${formatEther(tx.value)} ETH transferred. Configured threshold: 10 ETH. Threshold signal only; this does not establish malicious activity.`,confidence:100,kind:'transaction'};
}
export function isStale(updatedAt:bigint,now:bigint,maxAge:bigint){return updatedAt===0n||updatedAt>now||now-updatedAt>maxAge;}
export function contributionScore(useful:number,reputation:number,bond:number,uptime:number,fraud:number){
 if([useful,reputation,bond,uptime,fraud].some(x=>!Number.isFinite(x)||x<0)) throw new Error('Invalid score input');
 return Math.floor(Math.min(useful,100)*Math.min(reputation,2)*Math.sqrt(Math.min(bond,10000))*Math.min(uptime,1)*Math.min(fraud,1)*1000)/1000;
}
export async function getSnapshot():Promise<Snapshot>{
 const start=Date.now();const base={chainId:chain.id,checkedAt:new Date().toISOString(),contracts:monitored};
 let stage='chain-id';
 try{
 const client=createPublicClient({chain,transport:http(process.env.ROBINHOOD_RPC_URL||chain.rpcUrls.default.http[0],{timeout:12000,retryCount:1})});
 const id=await client.getChainId();if(id!==chain.id)throw new Error('RPC chain ID mismatch');
 stage='block-number';const head=await client.getBlockNumber({cacheTime:0});
 stage='blocks';
 const blocks=await Promise.all(Array.from({length:8},(_,i)=>client.getBlock({blockNumber:head-BigInt(i),includeTransactions:true})));
 const from=head>7n?head-7n:0n;
 stage='logs';const logs=await client.getLogs({address:monitored.map(c=>c.address),fromBlock:from,toBlock:head});
 const privileged=new Set(['OwnershipTransferred(address,address)','Upgraded(address)','RoleGranted(bytes32,address,address)','RoleRevoked(bytes32,address,address)'].map(x=>keccak256(toHex(x))));
 const observations:Observation[]=logs.filter(l=>l.topics[0]&&privileged.has(l.topics[0])).map(l=>({id:`contract:${l.transactionHash}:${l.logIndex}`,agent:'Contract Guardian',title:'Privileged contract event',severity:'high',block:String(l.blockNumber),hash:l.transactionHash!,address:l.address,detail:`Allowlisted contract emitted event topic ${l.topics[0]}. Review transaction receipt and authorization. Recent blocks are provisional and may reorganize.`,confidence:100,kind:'transaction'}));
 for(const b of blocks)for(const tx of b.transactions){if(typeof tx==='string')continue;const o=classifyTransaction(tx,String(b.number));if(o)observations.push(o);}
 return {...base,status:'live',head:String(head),latency:Date.now()-start,blocks:blocks.map(b=>({number:String(b.number),transactions:b.transactions.length,timestamp:Number(b.timestamp),hash:b.hash!})),observations,agents:[{name:'Contract Guardian',status:'running',detail:'Ownership, role and upgrade event rules · 2 system addresses · rolling 8-block window',processed:logs.length},{name:'Transaction Guardian',status:'running',detail:'Native transfers ≥ 10 ETH · all transactions in sampled blocks',processed:blocks.reduce((n,b)=>n+b.transactions.length,0)},{name:'Oracle Guardian',status:'unconfigured',detail:'No verified testnet feed configured; no oracle coverage claimed.',processed:0},{name:'RWA Guardian',status:'unconfigured',detail:'Canonical stock-token registry integration pending verification.',processed:0}]};
 }catch(error){const e=error as {name?:string;shortMessage?:string;status?:number;cause?:{name?:string;status?:number}};console.error('Monitor request failed',JSON.stringify({stage,name:e.name,status:e.status,cause:e.cause?.name,causeStatus:e.cause?.status}));return {...base,status:'unavailable',head:'—',latency:Date.now()-start,blocks:[],observations:[],agents:[],error:`Chain data unavailable at ${stage}. RPC request failed or returned an unexpected chain. No network health conclusion can be made.`};}
}
