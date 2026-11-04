import {getSnapshot} from '@/lib/monitor';
export const dynamic='force-dynamic';
export async function GET(){const data=await getSnapshot();return Response.json(data,{status:data.status==='live'?200:503,headers:{'Cache-Control':'public, s-maxage=15, stale-while-revalidate=15'}});}
