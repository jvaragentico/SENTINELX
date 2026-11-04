import {createPublicClient,http} from 'viem';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {chain} from '../src/lib/chain';
import {getSnapshot} from '../src/lib/monitor';
const file=process.env.WORKER_STATE_PATH||'./data/worker.json';
const client=createPublicClient({chain,transport:http(process.env.ROBINHOOD_RPC_URL||chain.rpcUrls.default.http[0],{timeout:12000,retryCount:2})});
type State={cursor:string;hash:string;observations:Record<string,unknown>;updatedAt:string};
let state:State={cursor:'0',hash:'',observations:{},updatedAt:''};
try{state=JSON.parse(await readFile(file,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
let stopping=false;process.on('SIGINT',()=>{stopping=true;});process.on('SIGTERM',()=>{stopping=true;});
await mkdir(dirname(file),{recursive:true});
while(!stopping){
 try{
  if(await client.getChainId()!==chain.id)throw new Error('Chain ID mismatch');
  const head=await client.getBlockNumber({cacheTime:0});
  if(state.hash){const previous=await client.getBlock({blockNumber:BigInt(state.cursor)});if(previous.hash!==state.hash){state={cursor:String(BigInt(state.cursor)>64n?BigInt(state.cursor)-64n:0n),hash:'',observations:{},updatedAt:''};console.warn('Reorg detected: rewinding 64 blocks; discarding provisional observations');}}
  // Catch up every 8-block batch, not just the latest head. Use a fixed RPC view for each batch.
  const target=head>12n?head-12n:0n;
  let next=BigInt(state.cursor)===0n?(target>8n?target-8n:0n):BigInt(state.cursor);
  while(next<target&&!stopping){
   const end=next+8n>target?target:next+8n;
   const block=await client.getBlock({blockNumber:end});
   const {classifyTransaction}=await import('../src/lib/monitor');
   const {monitored}=await import('../src/lib/chain');
   const {keccak256,toHex}=await import('viem');
   const topics=new Set(['OwnershipTransferred(address,address)','Upgraded(address)','RoleGranted(bytes32,address,address)','RoleRevoked(bytes32,address,address)'].map(x=>keccak256(toHex(x))));
   for(let n=next+1n;n<=end;n++){const b=await client.getBlock({blockNumber:n,includeTransactions:true});for(const tx of b.transactions){if(typeof tx==='string')continue;const o=classifyTransaction(tx,String(n));if(o)state.observations[o.id]=o;}}
   const logs=await client.getLogs({address:monitored.map(c=>c.address),fromBlock:next+1n,toBlock:end});
   for(const log of logs)if(log.topics[0]&&topics.has(log.topics[0])){const id=`contract:${log.transactionHash}:${log.logIndex}`;state.observations[id]={id,agent:'Contract Guardian',title:'Privileged event',block:String(log.blockNumber),hash:log.transactionHash,address:log.address,topic:log.topics[0]};}
   // Verify batch anchor before committing; replay keys are transaction hash + log index.
   if((await client.getBlock({blockNumber:end})).hash!==block.hash)throw new Error('Reorg during batch; replay required');
   next=end;state.cursor=String(end);state.hash=block.hash!;state.updatedAt=new Date().toISOString();
   await writeFile(file+'.tmp',JSON.stringify(state));await rename(file+'.tmp',file);
  }
  const snapshot=await getSnapshot();console.log(JSON.stringify({at:new Date().toISOString(),cursor:state.cursor,signals:Object.keys(state.observations).length,snapshot:snapshot.status}));
 }catch(e){console.error(JSON.stringify({at:new Date().toISOString(),error:(e as Error).message,retrying:true}));}
 if(process.argv.includes('--once'))break;
 await new Promise(r=>setTimeout(r,Math.max(5000,Number(process.env.WORKER_POLL_MS)||15000)));
}
