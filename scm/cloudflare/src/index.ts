export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SESSION_SECRET: string;
  BOOTSTRAP_TOKEN?: string;
  AI?: Ai;
  AI_MODEL?: string;
}

type User = { id: number; username: string; full_name: string; role: string };
type FieldMap = Record<string, string[]>;

const TABLES: FieldMap = {
  vendors: ["code", "name", "category", "email", "phone", "status"],
  sourcing: ["request_no", "title", "department", "estimated_value", "status", "request_date"],
  kak: ["kak_no", "title", "department", "requester", "background", "objective", "scope", "deliverables", "location", "duration", "schedule", "budget", "payment_terms", "requirements", "evaluation_method", "special_terms", "status"],
  contracts: ["contract_no", "vendor_id", "title", "contract_value", "start_date", "end_date", "status"],
  contract_drafts: ["draft_no", "kak_id", "vendor_id", "title", "contract_value", "start_date", "end_date", "scope", "payment_terms", "clauses", "created_by", "status"],
  obligations: ["contract_id", "title", "vendor_name", "due_date", "status", "notes"],
  change_orders: ["contract_id", "change_no", "title", "reason", "value_delta", "status"],
  approvals: ["ref_type", "ref_id", "ref_no", "title", "requester", "status"],
  vendor_performance: ["vendor_id", "score", "quality_score", "delivery_score", "compliance_score", "period_label"]
};
const TABLE_NAMES: Record<string, string> = {
  vendors: "vendors", sourcing: "sourcing_requests", kak: "kak_documents",
  contracts: "contracts", contract_drafts: "contract_drafts", obligations: "obligations",
  change_orders: "change_orders", approvals: "approvals", vendor_performance: "vendor_performance"
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});
const fail = (message: string, status = 400) => json({ ok: false, error: message }, status);
const enc = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const unb64 = (value: string) => Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)), c => c.charCodeAt(0));

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))));
}
async function signSession(user: User, secret: string): Promise<string> {
  const payload = b64(enc.encode(JSON.stringify({ ...user, exp: Date.now() + 8 * 60 * 60 * 1000 })));
  return payload + "." + await hmac(secret, payload);
}
async function currentUser(request: Request, env: Env): Promise<User | null> {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)scm_session=([^;]+)/);
  if (!match || !env.SESSION_SECRET) return null;
  const [payload, signature] = match[1].split(".");
  if (!payload || !signature || await hmac(env.SESSION_SECRET, payload) !== signature) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(unb64(payload)));
    if (!data.exp || data.exp < Date.now()) return null;
    return { id: data.id, username: data.username, full_name: data.full_name, role: data.role };
  } catch { return null; }
}
function cookie(value: string, maxAge: number): string {
  return `scm_session=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
async function passwordHash(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" }, material, 256);
  return `pbkdf2$210000$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}
async function passwordVerify(password: string, stored: string): Promise<boolean> {
  const [scheme, rounds, saltText, hashText] = stored.split("$");
  if (scheme !== "pbkdf2" || !rounds || !saltText || !hashText) return false;
  const material = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt: unb64(saltText), iterations: Number(rounds), hash: "SHA-256" }, material, 256));
  const expected = unb64(hashText);
  return bits.length === expected.length && bits.every((v, i) => v === expected[i]);
}
async function bodyObject(request: Request): Promise<Record<string, any>> {
  const value = await request.json().catch(() => null);
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, any> : {};
}
async function requireUser(request: Request, env: Env): Promise<User | Response> {
  const user = await currentUser(request, env);
  return user || fail("Sesi login tidak ditemukan atau sudah berakhir.", 401);
}
function isResponse(value: User | Response): value is Response { return value instanceof Response; }
function cleanInput(input: Record<string, any>, allowed: string[]) {
  const out: Record<string, any> = {};
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      const value = input[field];
      if (value === null || ["string", "number"].includes(typeof value)) out[field] = value;
    }
  }
  return out;
}

async function api(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = request.method;

  if (path[0] === "health" && method === "GET") {
    const result = await env.DB.prepare("SELECT 1 AS ok").first<{ok:number}>().catch(() => null);
    return json({ ok: !!result, service: "SCM Automation API", database: result ? "connected" : "unavailable" }, result ? 200 : 503);
  }

  if (path[0] === "auth" && path[1] === "bootstrap" && method === "POST") {
    if (!env.BOOTSTRAP_TOKEN) return fail("Bootstrap belum diaktifkan. Atur BOOTSTRAP_TOKEN sebagai secret Worker.", 503);
    const input = await bodyObject(request);
    if (input.token !== env.BOOTSTRAP_TOKEN) return fail("Token bootstrap tidak valid.", 403);
    const count = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first<{n:number}>();
    if ((count?.n || 0) > 0) return fail("Administrator sudah dibuat. Gunakan halaman login.", 409);
    const username = String(input.username || "admin").trim().toLowerCase();
    const fullName = String(input.full_name || "SCM Administrator").trim();
    const password = String(input.password || "");
    if (!/^[a-z0-9._-]{3,50}$/.test(username) || password.length < 12) return fail("Username minimal 3 karakter dan password minimal 12 karakter.");
    const hash = await passwordHash(password);
    const result = await env.DB.prepare("INSERT INTO users(username,password_hash,full_name,role) VALUES(?,?,?,'Admin')").bind(username, hash, fullName).run();
    return json({ ok: true, id: result.meta.last_row_id, message: "Administrator berhasil dibuat. Hapus secret BOOTSTRAP_TOKEN setelah setup." }, 201);
  }

  if (path[0] === "auth" && path[1] === "login" && method === "POST") {
    const input = await bodyObject(request);
    const username = String(input.username || "").trim().toLowerCase();
    const password = String(input.password || "");
    const user = await env.DB.prepare("SELECT id,username,password_hash,full_name,role FROM users WHERE username=? AND is_active=1 LIMIT 1").bind(username).first<any>();
    if (!user || !(await passwordVerify(password, user.password_hash))) return fail("Username atau password salah.", 401);
    const token = await signSession({ id: user.id, username: user.username, full_name: user.full_name, role: user.role }, env.SESSION_SECRET);
    return new Response(JSON.stringify({ ok: true, user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role } }), {
      headers: { "content-type": "application/json", "set-cookie": cookie(token, 8 * 60 * 60), "cache-control": "no-store" }
    });
  }
  if (path[0] === "auth" && path[1] === "logout" && method === "POST") {
    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json", "set-cookie": cookie("", 0) } });
  }
  if (path[0] === "auth" && path[1] === "me" && method === "GET") {
    const user = await currentUser(request, env);
    return user ? json({ ok: true, user }) : fail("Belum login.", 401);
  }

  const auth = await requireUser(request, env);
  if (isResponse(auth)) return auth;

  if (path[0] === "dashboard" && method === "GET") {
    const [vendors, sourcing, kaks, contracts, drafts, approvals, obligations] = await Promise.all([
      env.DB.prepare("SELECT COUNT(*) n FROM vendors").first<any>(),
      env.DB.prepare("SELECT COUNT(*) n FROM sourcing_requests").first<any>(),
      env.DB.prepare("SELECT COUNT(*) n FROM kak_documents").first<any>(),
      env.DB.prepare("SELECT COUNT(*) n FROM contracts").first<any>(),
      env.DB.prepare("SELECT COUNT(*) n FROM contract_drafts").first<any>(),
      env.DB.prepare("SELECT COUNT(*) n FROM approvals WHERE status='Pending'").first<any>(),
      env.DB.prepare("SELECT COUNT(*) n FROM obligations WHERE status IN ('Open','Due Soon','Overdue')").first<any>()
    ]);
    return json({ ok: true, metrics: { vendors: vendors?.n || 0, sourcing: sourcing?.n || 0, kak: kaks?.n || 0, contracts: contracts?.n || 0, contract_drafts: drafts?.n || 0, pending_approvals: approvals?.n || 0, open_obligations: obligations?.n || 0 } });
  }

  if (path[0] === "documents") {
    return fail("Penyimpanan lampiran belum diaktifkan pada konfigurasi Cloudflare Free. Data transaksi tetap tersimpan di D1; fitur lampiran akan ditambahkan setelah tersedia media penyimpanan.", 501);
  }

  if (path[0] === "ai" && method === "POST") {
    if (!env.AI) return fail("AI binding belum dikonfigurasi. Aktifkan Workers AI setelah infrastruktur dasar siap.", 503);
    const input = await bodyObject(request);
    const prompt = String(input.prompt || input.message || "").trim();
    if (!prompt) return fail("Prompt AI masih kosong.");
    const response = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: "Anda adalah SCM Procurement Copilot untuk perusahaan Indonesia. Berikan analisis procurement, KAK/TOR, vendor, kontrak dan sourcing secara profesional. Jangan mengarang fakta atau menyetujui keputusan yang harus dilakukan manusia." },
        { role: "user", content: prompt }
      ]
    });
    return json({ ok: true, result: response });
  }

  const resource = path[0];
  const table = TABLE_NAMES[resource];
  const fields = TABLES[resource];
  if (!table || !fields) return fail("Endpoint API tidak ditemukan.", 404);

  if (method === "GET" && path.length === 1) {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 100), 1), 500);
    const rows = await env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT ?`).bind(limit).all();
    return json({ ok: true, data: rows.results || [] });
  }
  if (method === "POST" && path.length === 1) {
    const input = cleanInput(await bodyObject(request), fields);
    const required: Record<string, string[]> = {
      vendors: ["code", "name"], sourcing: ["request_no", "title"], kak: ["kak_no", "title", "department", "requester"],
      contracts: ["contract_no", "title"], contract_drafts: ["draft_no", "title", "start_date", "end_date"],
      obligations: ["title"], change_orders: ["change_no", "title"], approvals: ["ref_type", "ref_id", "ref_no", "title"],
      vendor_performance: ["vendor_id"]
    };
    if ((required[resource] || []).some(k => input[k] === undefined || input[k] === "")) return fail("Lengkapi seluruh field wajib.");
    if (resource === "contract_drafts") input.created_by = auth.id;
    const columns = Object.keys(input);
    if (!columns.length) return fail("Tidak ada data yang dapat disimpan.");
    const placeholders = columns.map(() => "?").join(",");
    const result = await env.DB.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders})`).bind(...columns.map(k => input[k])).run();
    return json({ ok: true, id: result.meta.last_row_id }, 201);
  }
  if (method === "PUT" && path.length === 2) {
    const id = Number(path[1]);
    if (!Number.isInteger(id) || id < 1) return fail("ID tidak valid.");
    const input = cleanInput(await bodyObject(request), fields);
    const columns = Object.keys(input);
    if (!columns.length) return fail("Tidak ada perubahan.");
    const assignments = columns.map(k => `${k}=?`).join(",");
    const result = await env.DB.prepare(`UPDATE ${table} SET ${assignments} WHERE id=?`).bind(...columns.map(k => input[k]), id).run();
    if (!result.meta.changes) return fail("Data tidak ditemukan.", 404);
    return json({ ok: true });
  }
  if (method === "DELETE" && path.length === 2) {
    if (!["vendors", "sourcing", "kak", "contracts", "contract_drafts", "obligations", "change_orders"].includes(resource)) return fail("Penghapusan tidak diizinkan untuk modul ini.", 403);
    const id = Number(path[1]);
    if (!Number.isInteger(id) || id < 1) return fail("ID tidak valid.");
    const result = await env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
    return result.meta.changes ? json({ ok: true }) : fail("Data tidak ditemukan.", 404);
  }
  return fail("Metode atau rute tidak didukung.", 405);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await api(request, env); }
      catch (error) {
        console.error("SCM API error", error);
        return fail("Terjadi kesalahan pada server. Periksa Workers Logs untuk detail.", 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
