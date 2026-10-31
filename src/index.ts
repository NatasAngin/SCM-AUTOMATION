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
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, material, 256);
  return `pbkdf2$100000$${b64(salt)}$${b64(new Uint8Array(bits))}`;
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

  // User administration: restricted to Admin role.
  if (path[0] === "users") {
    if (auth.role !== "Admin") return fail("Akses hanya untuk Administrator.", 403);
    if (method === "GET" && path.length === 1) {
      const rows = await env.DB.prepare("SELECT id,username,full_name,role,is_active,created_at FROM users ORDER BY full_name COLLATE NOCASE").all();
      return json({ ok: true, data: rows.results || [] });
    }
    if (method === "POST" && path.length === 1) {
      const input = await bodyObject(request);
      const username = String(input.username || "").trim().toLowerCase();
      const fullName = String(input.full_name || "").trim();
      const role = String(input.role || "").trim();
      const password = String(input.password || "");
      const allowedRoles = ["Admin", "Section Head", "Procurement", "Authorized Approver", "System & Helpdesk Specialist", "Network & Equipment Specialist", "Viewer"];
      if (!/^[a-z0-9._-]{3,50}$/.test(username)) return fail("Username harus 3–50 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung.");
      if (fullName.length < 2 || fullName.length > 100) return fail("Nama lengkap wajib diisi (2–100 karakter).");
      if (!allowedRoles.includes(role)) return fail("Role tidak valid.");
      if (password.length < 12 || password.length > 128) return fail("Password harus 12–128 karakter.");
      const hash = await passwordHash(password);
      try {
        const result = await env.DB.prepare("INSERT INTO users(username,password_hash,full_name,role,is_active) VALUES(?,?,?,?,1)").bind(username, hash, fullName, role).run();
        return json({ ok: true, id: result.meta.last_row_id, message: "User berhasil dibuat." }, 201);
      } catch (error) {
        if (String(error).toLowerCase().includes("unique")) return fail("Username sudah digunakan.", 409);
        throw error;
      }
    }
    if (method === "POST" && path.length === 3 && path[2] === "reset-password") {
      const id = Number(path[1]);
      if (!Number.isInteger(id) || id < 1) return fail("ID user tidak valid.");
      const input = await bodyObject(request);
      const password = String(input.password || "");
      if (password.length < 12 || password.length > 128) return fail("Password baru harus 12–128 karakter.");
      const target = await env.DB.prepare("SELECT id FROM users WHERE id=?").bind(id).first<any>();
      if (!target) return fail("User tidak ditemukan.", 404);
      const hash = await passwordHash(password);
      await env.DB.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(hash, id).run();
      return json({ ok: true, message: "Password user berhasil direset. Sesi login aktif user tersebut dapat tetap berlaku sampai kedaluwarsa." });
    }
    return fail("Metode atau rute user tidak didukung.", 405);
  }

  // Notifications: each authenticated user receives a personal inbox entry.
  if (path[0] === "notifications") {
    if (method === "GET" && path.length === 1) {
      const rows = await env.DB.prepare("SELECT id,type,title,message,resource,resource_id,is_read,created_at FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 50").bind(auth.id).all();
      const unread = await env.DB.prepare("SELECT COUNT(*) AS n FROM notifications WHERE user_id=? AND is_read=0").bind(auth.id).first<any>();
      return json({ ok: true, data: rows.results || [], unread: unread?.n || 0 });
    }
    if (method === "POST" && path.length === 3 && path[2] === "read") {
      const id = Number(path[1]);
      if (!Number.isInteger(id) || id < 1) return fail("ID notifikasi tidak valid.");
      await env.DB.prepare("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?").bind(id, auth.id).run();
      return json({ ok: true });
    }
    if (method === "POST" && path.length === 2 && path[1] === "read-all") {
      await env.DB.prepare("UPDATE notifications SET is_read=1 WHERE user_id=? AND is_read=0").bind(auth.id).run();
      return json({ ok: true });
    }
    return fail("Rute notifikasi tidak didukung.", 405);
  }

  if (path[0] === "documents") {
    return fail("Penyimpanan lampiran belum diaktifkan pada konfigurasi Cloudflare Free. Data transaksi tetap tersimpan di D1; fitur lampiran akan ditambahkan setelah tersedia media penyimpanan.", 501);
  }

  // KAK/TOR workflow: dual review (Section Head + Procurement), Admin-only revisions, authorized final approval.
  if (path[0] === "kak" && path[1] && path[2] === "workflow") {
    const kakId = Number(path[1]);
    if (!Number.isInteger(kakId) || kakId < 1) return fail("ID KAK tidak valid.");
    const kak = await env.DB.prepare("SELECT id,kak_no,title,requester FROM kak_documents WHERE id=?").bind(kakId).first<any>();
    if (!kak) return fail("KAK tidak ditemukan.", 404);
    if (method === "GET") {
      const workflow = await env.DB.prepare("SELECT * FROM kak_workflows WHERE kak_id=?").bind(kakId).first<any>();
      const reviews = await env.DB.prepare("SELECT r.id,r.reviewer_role,r.status,r.note,r.reviewer_id,r.decided_at,u.full_name AS reviewer_name FROM kak_workflow_reviews r LEFT JOIN users u ON u.id=r.reviewer_id WHERE r.kak_id=? ORDER BY r.id").bind(kakId).all<any>();
      const events = await env.DB.prepare("SELECT e.id,e.event_type,e.from_status,e.to_status,e.note,e.created_at,u.full_name AS actor_name FROM kak_workflow_events e LEFT JOIN users u ON u.id=e.actor_id WHERE e.kak_id=? ORDER BY e.id DESC LIMIT 100").bind(kakId).all<any>();
      return json({ok:true,workflow:workflow||{workflow_status:"Draft",current_step:"Draft"},reviews:reviews.results||[],events:events.results||[]});
    }
    if (method !== "POST") return fail("Metode workflow tidak didukung.",405);
    const input = await bodyObject(request);
    const action = String(input.action||"").trim();
    const note = String(input.note||"").trim().slice(0,3000);
    const current = await env.DB.prepare("SELECT * FROM kak_workflows WHERE kak_id=?").bind(kakId).first<any>();
    const status = current?.workflow_status || "Draft";
    const notify = async (type:string,title:string,message:string) => env.DB.prepare("INSERT INTO notifications(user_id,type,title,message,resource,resource_id) SELECT id,?,?,?,'kak',? FROM users WHERE is_active=1").bind(type,title,message,kakId).run();
    const event = async (eventType:string,from:string,to:string) => env.DB.prepare("INSERT INTO kak_workflow_events(kak_id,actor_id,event_type,from_status,to_status,note) VALUES(?,?,?,?,?,?)").bind(kakId,auth.id,eventType,from,to,note).run();
    if (action === "submit") {
      if (!["Draft","Revision"].includes(status)) return fail("Dokumen hanya dapat diajukan dari status Draft atau Revisi.",409);
      if (status === "Revision" && auth.role !== "Admin") return fail("Hanya Admin yang berhak mengedit dan mengajukan ulang hasil revisi.",403);
      await env.DB.batch([
        env.DB.prepare("INSERT INTO kak_workflows(kak_id,workflow_status,current_step,submitted_by,updated_at) VALUES(?,'Review','Dual Review',?,CURRENT_TIMESTAMP) ON CONFLICT(kak_id) DO UPDATE SET workflow_status='Review',current_step='Dual Review',submitted_by=excluded.submitted_by,revision_note=NULL,updated_at=CURRENT_TIMESTAMP").bind(kakId,auth.id),
        env.DB.prepare("DELETE FROM kak_workflow_reviews WHERE kak_id=?").bind(kakId),
        env.DB.prepare("INSERT INTO kak_workflow_reviews(kak_id,reviewer_role,status) VALUES(?,'Section Head','Pending'),(?,'Procurement','Pending')").bind(kakId,kakId),
        env.DB.prepare("UPDATE kak_documents SET status='Review' WHERE id=?").bind(kakId),
        env.DB.prepare("INSERT INTO kak_workflow_events(kak_id,actor_id,event_type,from_status,to_status,note) VALUES(?,?,'SUBMITTED',?,?,?)").bind(kakId,auth.id,status,"Review",note)
      ]);
      await notify("kak_submitted","KAK diajukan untuk pemeriksaan",kak.kak_no+" — "+kak.title);
      return json({ok:true,workflow_status:"Review",message:"KAK berhasil diajukan ke Section Head dan Procurement."});
    }
    if (action === "review") {
      if (status !== "Review") return fail("KAK tidak sedang dalam tahap pemeriksaan.",409);
      if (!["Section Head","Procurement"].includes(auth.role)) return fail("Pemeriksaan hanya dapat dilakukan Section Head atau Procurement.",403);
      const decision=String(input.decision||"").trim();
      if (!["Approved","Revision"].includes(decision)) return fail("Keputusan pemeriksa tidak valid.");
      const task=await env.DB.prepare("SELECT id,status FROM kak_workflow_reviews WHERE kak_id=? AND reviewer_role=?").bind(kakId,auth.role).first<any>();
      if (!task) return fail("Tugas pemeriksaan untuk role Anda tidak ditemukan.",404);
      if (task.status!=="Pending") return fail("Pemeriksaan role Anda sudah diputuskan.",409);
      await env.DB.prepare("UPDATE kak_workflow_reviews SET status=?,note=?,reviewer_id=?,decided_at=CURRENT_TIMESTAMP WHERE id=?").bind(decision,note,auth.id,task.id).run();
      if(decision==="Revision"){
        await env.DB.prepare("UPDATE kak_workflows SET workflow_status='Revision',current_step='Admin Revision',revision_note=?,updated_at=CURRENT_TIMESTAMP WHERE kak_id=?").bind(note,kakId).run();
        await env.DB.prepare("UPDATE kak_documents SET status='Draft' WHERE id=?").bind(kakId).run();
        await event("REVISION_REQUESTED","Review","Revision");
        await notify("kak_revision","KAK dikembalikan untuk revisi",kak.kak_no+" — "+(note||"Perlu perbaikan"));
        return json({ok:true,workflow_status:"Revision",message:"KAK dikembalikan kepada Admin untuk revisi."});
      }
      const pending=await env.DB.prepare("SELECT COUNT(*) AS n FROM kak_workflow_reviews WHERE kak_id=? AND status='Pending'").bind(kakId).first<any>();
      if((pending?.n||0)===0){
        await env.DB.prepare("UPDATE kak_workflows SET workflow_status='Final Approval',current_step='Authorized Approver',updated_at=CURRENT_TIMESTAMP WHERE kak_id=?").bind(kakId).run();
        await event("DUAL_REVIEW_COMPLETED","Review","Final Approval");
        await notify("kak_final_approval","KAK menunggu persetujuan final",kak.kak_no+" — "+kak.title);
        return json({ok:true,workflow_status:"Final Approval",message:"Kedua pemeriksa menyetujui. KAK diteruskan ke pejabat berwenang."});
      }
      await event("REVIEW_APPROVED","Review","Review");
      await notify("kak_review_approved","Pemeriksaan KAK disetujui",kak.kak_no+" — "+auth.role);
      return json({ok:true,workflow_status:"Review",message:"Keputusan tersimpan. Menunggu pemeriksa lainnya."});
    }
    if (action === "final_approve") {
      if (status!=="Final Approval") return fail("KAK belum menyelesaikan kedua pemeriksaan.",409);
      if (auth.role !== "Authorized Approver") return fail("Persetujuan final hanya untuk Authorized Approver.",403);
      await env.DB.batch([
        env.DB.prepare("UPDATE kak_workflows SET workflow_status='Final',current_step='Completed',final_approved_by=?,final_approved_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE kak_id=?").bind(auth.id,kakId),
        env.DB.prepare("UPDATE kak_documents SET status='Approved' WHERE id=?").bind(kakId),
        env.DB.prepare("INSERT INTO kak_workflow_events(kak_id,actor_id,event_type,from_status,to_status,note) VALUES(?,?,'FINAL_APPROVED','Final Approval','Final',?)").bind(kakId,auth.id,note)
      ]);
      await notify("kak_final","KAK disetujui final",kak.kak_no+" — "+kak.title);
      return json({ok:true,workflow_status:"Final",message:"KAK telah disetujui final."});
    }
    if (action === "edit") {
      if (status==="Revision" && auth.role!=="Admin") return fail("Hanya Admin yang dapat mengedit KAK pada tahap revisi.",403);
      if (status==="Draft" && auth.role!=="Admin" && kak.requester!==auth.full_name) return fail("Draft hanya dapat diedit oleh pembuat dokumen atau Admin.",403);
      if (!["Draft","Revision"].includes(status)) return fail("Isi KAK terkunci setelah diajukan. Perubahan hanya melalui tahap revisi.",409);
      const allowed=TABLES.kak.filter(k=>!["status"].includes(k));
      const data=cleanInput(input.data&&typeof input.data==="object"?input.data:{},allowed);
      const cols=Object.keys(data);
      if(!cols.length)return fail("Tidak ada perubahan data.");
      const assignments=cols.map(k=>k+"=?").join(",");
      const old=await env.DB.prepare("SELECT * FROM kak_documents WHERE id=?").bind(kakId).first<any>();
      const update=await env.DB.prepare("UPDATE kak_documents SET "+assignments+" WHERE id=?").bind(...cols.map(k=>data[k]),kakId).run();
      if(!update.meta.changes)return fail("Tidak ada perubahan data.",404);
      await env.DB.prepare("INSERT INTO kak_workflow_revisions(kak_id,revision_no,edited_by,change_summary,snapshot_json) VALUES(?,COALESCE((SELECT MAX(revision_no)+1 FROM kak_workflow_revisions WHERE kak_id=?),1),?,?,?)").bind(kakId,kakId,auth.id,note,JSON.stringify(old||{})).run();
      await env.DB.prepare("UPDATE kak_workflows SET updated_at=CURRENT_TIMESTAMP WHERE kak_id=?").bind(kakId).run();
      await env.DB.prepare("INSERT INTO kak_workflow_events(kak_id,actor_id,event_type,from_status,to_status,note) VALUES(?,?,'ADMIN_EDITED',?,?,?)").bind(kakId,auth.id,status,status,note).run();
      await notify("kak_edited","KAK diperbarui oleh Admin",kak.kak_no+" — "+kak.title);
      return json({ok:true,message:"Perubahan KAK tersimpan dan tercatat dalam riwayat revisi."});
    }
    return fail("Aksi workflow tidak dikenal.");
  }

  if (path[0] === "ai" && path[1] === "documents" && method === "GET") {
    const [kaks, drafts, contracts] = await Promise.all([
      env.DB.prepare("SELECT id, kak_no AS document_no, title, status, 'kak' AS resource, 'KAK / TOR' AS document_type, created_at FROM kak_documents ORDER BY id DESC LIMIT 500").all<any>(),
      env.DB.prepare("SELECT id, draft_no AS document_no, title, status, 'contract_drafts' AS resource, 'Draft Contract' AS document_type, created_at FROM contract_drafts ORDER BY id DESC LIMIT 500").all<any>(),
      env.DB.prepare("SELECT id, contract_no AS document_no, title, status, 'contracts' AS resource, 'Kontrak' AS document_type, created_at FROM contracts ORDER BY id DESC LIMIT 500").all<any>()
    ]);
    const data = [...(kaks.results || []), ...(drafts.results || []), ...(contracts.results || [])]
      .sort((a: any, b: any) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
    return json({ ok: true, data });
  }

  if (path[0] === "ai" && path[1] === "review" && method === "POST") {
    if (!env.AI) return fail("AI binding belum dikonfigurasi. Aktifkan Workers AI pada Worker preview.", 503);
    const input = await bodyObject(request);
    const resource = String(input.resource || "").trim();
    const id = Number(input.id);
    const tableByResource: Record<string, string> = { kak: "kak_documents", contracts: "contracts", contract_drafts: "contract_drafts" };
    const table = tableByResource[resource];
    if (!table || !Number.isInteger(id) || id < 1) return fail("Pilih jenis dokumen dan ID dokumen yang valid.");
    const document = await env.DB.prepare("SELECT * FROM " + table + " WHERE id=?").bind(id).first<any>();
    if (!document) return fail("Dokumen tidak ditemukan.", 404);
    const instruction = String(input.instruction || "Lakukan review menyeluruh dan identifikasi kekurangan, inkonsistensi, risiko, dan tahapan yang belum terpenuhi.").trim().slice(0, 4000);
    try {
    const response: any = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fp8", { messages: [
      { role: "system", content: "Anda adalah AI Procurement Governance Reviewer. Gunakan hanya fakta dalam dokumen. Data yang tidak tersedia harus ditandai BELUM ADA DATA. Periksa kelengkapan administratif, ruang lingkup, spesifikasi/deliverables, jadwal, anggaran, metode pengadaan/evaluasi, syarat komersial, pembayaran, jaminan, risiko hukum/operasional, konsistensi, approval dan bukti pendukung. Untuk kontrak periksa para pihak, objek, nilai, masa berlaku, ruang lingkup, pembayaran, denda/sanksi, jaminan, perubahan, terminasi dan kewajiban. Susun Bahasa Indonesia dengan bagian RINGKASAN, STATUS (Siap ditinjau manusia/Perlu perbaikan/Data tidak cukup), TEMUAN KRITIS, TEMUAN LAIN, CHECKLIST TAHAPAN BELUM TERPENUHI, REKOMENDASI TINDAKAN, dan HAL YANG WAJIB DISETUJUI MANUSIA. Setiap temuan diberi risiko Tinggi/Sedang/Rendah. Jangan mengubah data, memberi approval, menetapkan pemenang, atau menandatangani kontrak." },
      { role: "user", content: "Jenis dokumen: " + resource + "\nInstruksi: " + instruction + "\nData dokumen JSON: " + JSON.stringify(document).slice(0, 18000) }
    ] });
    const result = typeof response === "string" ? response : (response?.response || response?.result || JSON.stringify(response));
    return json({ ok: true, resource, document_id: id, document_title: document.title || document.kak_no || document.contract_no || document.draft_no || ("Dokumen #" + id), result });
    } catch (error) {
      console.error("SCM AI review error", error);
      return fail("AI gagal memproses review. Periksa ketersediaan model Workers AI, kuota akun, dan Workers Logs.", 502);
    }
  }
  if (path[0] === "ai" && method === "POST") {
    if (!env.AI) return fail("AI binding belum dikonfigurasi. Aktifkan Workers AI setelah infrastruktur dasar siap.", 503);
    const input = await bodyObject(request);
    const prompt = String(input.prompt || input.message || "").trim();
    if (!prompt) return fail("Prompt AI masih kosong.");
    const response = await env.AI.run(env.AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fp8", {
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
    if (resource === "kak") input.status = "Draft";
    if (resource === "contract_drafts") input.created_by = auth.id;
    const columns = Object.keys(input);
    if (!columns.length) return fail("Tidak ada data yang dapat disimpan.");
    const placeholders = columns.map(() => "?").join(",");
    const result = await env.DB.prepare(`INSERT INTO ${table} (${columns.join(",")}) VALUES (${placeholders})`).bind(...columns.map(k => input[k])).run();
    const notificationTypes: Record<string, { type: string; label: string; numberField: string }> = {
      kak: { type: "kak_created", label: "KAK baru dibuat", numberField: "kak_no" },
      sourcing: { type: "sourcing_created", label: "Sourcing Request baru dibuat", numberField: "request_no" },
      contracts: { type: "contract_created", label: "Kontrak baru dibuat", numberField: "contract_no" },
      contract_drafts: { type: "contract_draft_created", label: "Draft kontrak baru dibuat", numberField: "draft_no" }
    };
    const event = notificationTypes[resource];
    if (event) {
      const reference = String(input[event.numberField] || "");
      const title = String(input.title || "Tanpa judul");
      const message = [reference, title].filter(Boolean).join(" — ");
      await env.DB.prepare(
        "INSERT INTO notifications(user_id,type,title,message,resource,resource_id) SELECT id,?,?,?,?,? FROM users WHERE is_active=1"
      ).bind(event.type, event.label, message, resource, result.meta.last_row_id).run();
    }
    return json({ ok: true, id: result.meta.last_row_id }, 201);
  }
  if (method === "PUT" && path.length === 2) {
    if (resource === "kak") return fail("Perubahan KAK harus melalui endpoint workflow agar hak akses dan audit trail terjaga.",403);
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
