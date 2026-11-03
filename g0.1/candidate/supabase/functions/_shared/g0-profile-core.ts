export interface ProfileRepository {
  authenticate(token: string): Promise<string | null>;
  verify(): Promise<void>;
  readSelf(id: string): Promise<unknown>;
}
export class Failure extends Error {
  constructor(public status: number, public code: string) { super(code); }
}
export function makeProfileHandler(mode: 'read' | 'recover', repository: (token: string) => ProfileRepository, cors: Record<string,string>) {
  const json = (body: unknown, status=200) => new Response(JSON.stringify(body), {
    status, headers: {...cors, 'Content-Type':'application/json', 'Cache-Control':'no-store'},
  });
  return async (req: Request) => {
    if (req.method==='OPTIONS') return json({});
    if (req.method!=='POST') return json({code:'METHOD_NOT_ALLOWED'},405);
    try {
      const match=req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i);
      if (!match) throw new Failure(401,'AUTH_REQUIRED');
      const repo=repository(match[1]);
      const id=await repo.authenticate(match[1]);
      if (!id) throw new Failure(401,'AUTH_REQUIRED');
      let body: unknown;
      try { body=await req.json(); } catch { throw new Failure(400,'INVALID_JSON'); }
      if (!body || typeof body!=='object' || Array.isArray(body)) throw new Failure(400,'INVALID_BODY');
      const fields=body as Record<string,unknown>;
      if (Object.keys(fields).some(k=>k!=='user_id')) throw new Failure(400,'FIELD_NOT_ALLOWED');
      if (fields.user_id!==undefined) {
        if (typeof fields.user_id!=='string' || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(fields.user_id)) throw new Failure(400,'INVALID_USER_ID');
        if (fields.user_id.toLowerCase()!==id.toLowerCase()) throw new Failure(403,'FORBIDDEN');
      }
      if (mode==='recover') await repo.verify();
      return json(await repo.readSelf(id));
    } catch (error) {
      return error instanceof Failure ? json({code:error.code},error.status) : json({code:'SERVICE_UNAVAILABLE'},503);
    }
  };
}