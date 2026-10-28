// Pages Functions: deliberately fail closed until a verified authenticated API is migrated.
// Never return the SPA HTML for an /api request.
export async function onRequest():Promise<Response>{
 return new Response(JSON.stringify({error:'API_UNAVAILABLE',message:'এই API এখনো নিরাপদ Cloudflare পরিবেশে স্থানান্তরিত হয়নি।'}),{
  status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}
 });
}
