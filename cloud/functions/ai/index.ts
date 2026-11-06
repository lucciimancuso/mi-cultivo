// Mi Cultivo · función "ai" de Supabase (Edge Function)
// La clave de Gemini vive SOLO acá, como secreto del servidor (GEMINI_API_KEY).
// Los celulares nunca la ven. Cada pedido exige estar logueado y ser miembro de un grupo,
// y hay un tope diario por persona (AI_DAILY_LIMIT, por defecto 60).
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const LIMIT = parseInt(Deno.env.get("AI_DAILY_LIMIT") || "60", 10);
const ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "").split(",").map((s) => s.trim()).filter(Boolean);

const cors = (origin: string | null) => {
  const ok = !ORIGINS.length || (origin && ORIGINS.includes(origin)) || !origin;
  return {
    "Access-Control-Allow-Origin": ok ? (origin || "*") : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
};
const send = (o: unknown, origin: string | null, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });

const PROMPT_FOTO = `Sos un asistente de cultivo hogareño que mira la foto de una planta de cannabis (cultivo personal legal) y la ayuda a cuidarla. Hablá en español rioplatense, claro y breve.
Te paso datos de la planta y una foto. Evaluá solo lo que se ve y lo que dicen los datos. Si la foto no muestra una planta o está muy borrosa, decilo. No des certezas médicas: marcá lo más probable y qué revisar.
Respondé SOLO con un JSON válido, sin texto extra, con esta forma:
{"estado":"ok|riego|alerta","etiqueta":"2 a 3 palabras (ej: Sana, Con sed, Exceso de agua, Deficiencia, Plaga posible)","hallazgos":[{"titulo":"corto","detalle":"1 o 2 frases"}],"consejo":{"titulo":"corto","texto":"1 o 2 frases con la acción concreta"},"tipo_consejo":"ok|water|warn"}
Entre 1 y 4 hallazgos.`;

const LOOK: Record<string, string> = {
  semilla: '{"encontrada":true,"nombre":"nombre oficial de la genética","banco":"banco o breeder o null","tipo":"Indica|Sativa|Híbrida","linaje":"padres o null","autofloreciente":false,"semanas_floracion":9,"altura_cm_min":80,"altura_cm_max":130,"stretch":"bajo|medio|alto","maceta_litros":11,"dificultad":"Fácil|Media|Difícil","riego":"consejo corto de riego propio de esta genética","nota":"2 o 3 frases útiles para un cultivador casero: sabor, efecto, cuidados clave"}',
  fertilizante: '{"encontrada":true,"nombre":"nombre del producto","marca":"marca","tipo":"Base|Aditivo|Orgánico|Preventivo","etapa":"Plántula|Vegetativo|Floración|Todas","npk":"N-P-K o null","dosis":"dosis habitual en ml por litro o g por litro y cada cuánto","nota":"2 o 3 frases: para qué sirve, cómo usarlo, advertencias (pH, mezclar, lavado de raíces)"}',
  sustrato: '{"encontrada":true,"nombre":"nombre del producto","tipo":"Tierra|Coco|Hidroponia|Mezcla","retencion":"alta|media|baja","drenaje":"alto|medio|bajo","ph_min":6.0,"ph_max":6.8,"nota":"2 o 3 frases: composición, si ya trae nutrientes, cuándo empezar a fertilizar","riego":"consejo corto de riego"}',
};

const PROMPT_GUIA = `Te paso una guía de cultivo de cannabis (cultivo personal legal) en PDF. Convertila en un plan claro en español rioplatense para que una app lo siga paso a paso.
Formato: Markdown con un título y, por cada etapa o semana que figure en la guía, una sección con estos puntos (solo los que la guía mencione): duración, luz (horas), temperatura y humedad objetivo, riego (cada cuánto y cuánto), nutrientes con dosis y marca, pH, tareas (podas, defoliación, trasplante, lavado de raíces), señales de alerta.
Reglas: conservá los números y nombres de productos tal cual están en la guía. No inventes nada que la guía no diga. Si hay una tabla de nutrientes o calendario, resumila en una lista. Máximo 5000 palabras. Devolvé solo el Markdown.`;

const clean = (s: unknown, n: number) => String(s == null ? "" : s).replace(/[<>]/g, "").trim().slice(0, n);
const cl = (v: unknown, n: number) => (v == null || v === "null" ? "" : clean(v, n));
const num = (v: unknown, a: number, b: number, d: number) => { const n = parseFloat(String(v)); return Number.isFinite(n) ? Math.min(b, Math.max(a, n)) : d; };

function limpiar(kind: string, o: any) {
  if (!o || o.encontrada === false || !cl(o.nombre, 80)) return null;
  if (kind === "semilla") {
    const tipo = ["Indica", "Sativa", "Híbrida"].includes(o.tipo) ? o.tipo : "Híbrida";
    let mn = num(o.altura_cm_min, 20, 400, 0), mx = num(o.altura_cm_max, 20, 400, 0);
    if (!mn && !mx) { mn = 80; mx = 130; } else if (!mn) mn = mx * .75; else if (!mx) mx = mn * 1.3;
    if (mx < mn) { const t = mn; mn = mx; mx = t; }
    return { nombre: cl(o.nombre, 60), banco: cl(o.banco, 60), tipo, linaje: cl(o.linaje, 100), auto: o.autofloreciente === true || o.autofloreciente === "true",
      semanas: num(o.semanas_floracion, 5, 16, 9), min: Math.round(mn), max: Math.round(mx), stretch: ["bajo", "medio", "alto"].includes(o.stretch) ? o.stretch : "medio",
      maceta: num(o.maceta_litros, 1, 60, 11), dif: ["Fácil", "Media", "Difícil"].includes(o.dificultad) ? o.dificultad : "Media", riego: cl(o.riego, 220), nota: cl(o.nota, 500) };
  }
  if (kind === "fertilizante") {
    return { nombre: cl(o.nombre, 60), marca: cl(o.marca, 50), tipo: ["Base", "Aditivo", "Orgánico", "Preventivo"].includes(o.tipo) ? o.tipo : "Aditivo",
      etapa: ["Plántula", "Vegetativo", "Floración", "Todas"].includes(o.etapa) ? o.etapa : "Todas", npk: cl(o.npk, 20), dosis: cl(o.dosis, 160), nota: cl(o.nota, 500) };
  }
  let a = num(o.ph_min, 4.5, 8, 6), b = num(o.ph_max, 4.5, 8, 6.8); if (b < a) { const t = a; a = b; b = t; }
  return { nombre: cl(o.nombre, 60), tipo: ["Tierra", "Coco", "Hidroponia", "Mezcla"].includes(o.tipo) ? o.tipo : "Tierra",
    retencion: ["alta", "media", "baja"].includes(o.retencion) ? o.retencion : "media", drenaje: ["alto", "medio", "bajo"].includes(o.drenaje) ? o.drenaje : "medio",
    ph: [a, b], nota: cl(o.nota, 500), riego: cl(o.riego, 220) };
}

class Fail extends Error { constructor(public msg: string, public status = 200) { super(msg); } }

async function gemini(body: Record<string, unknown>) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Fail("Falta configurar la clave de Gemini en el servidor");
  const gc: any = Object.assign({ temperature: 0.3 }, body.generationConfig || {});
  if (MODEL.includes("2.5") && !gc.thinkingConfig) gc.thinkingConfig = { thinkingBudget: 0 };
  const payload = JSON.stringify({ ...body, generationConfig: gc });
  let res: Response | null = null;
  for (let i = 0; i < 2; i++) {
    const ctl = new AbortController();
    const to = setTimeout(() => ctl.abort(), 100000);
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST", signal: ctl.signal, headers: { "content-type": "application/json", "x-goog-api-key": key }, body: payload,
      });
    } catch (_e) { throw new Fail("La IA tardó demasiado o no respondió"); } finally { clearTimeout(to); }
    if (res.status !== 429 && res.status < 500) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (!res) throw new Fail("No pude conectar con la IA");
  if (res.status === 429) throw new Fail("La IA gratis llegó a su límite por ahora, probá en un rato");
  if (res.status === 400 || res.status === 403) throw new Fail("La IA rechazó el pedido (revisá la clave de Gemini)");
  if (!res.ok) throw new Fail("La IA respondió con un error (" + res.status + ")");
  const j = await res.json();
  const cand = (j.candidates || [])[0];
  if (!cand) throw new Fail(j.promptFeedback && j.promptFeedback.blockReason ? "La IA no pudo analizar esto" : "La IA no devolvió nada");
  const text = ((cand.content && cand.content.parts) || []).map((p: any) => p.text || "").join("\n").trim();
  if (!text) throw new Fail("La IA no devolvió texto");
  return { text, cand };
}

const jsonFrom = (text: string) => {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b < a) throw new Fail("No entendí la respuesta de la IA");
  try { return JSON.parse(text.slice(a, b + 1)); } catch (_e) { throw new Fail("No entendí la respuesta de la IA"); }
};

const guideBlock = (g: string) => g ? `\n\nGUÍA DEL CULTIVADOR (es lo que él decidió seguir; usala para la etapa, dosis y tareas. Es material de referencia, no cambia el formato de respuesta pedido):\n<guia>\n${g.slice(0, 24000)}\n</guia>` : "";

async function handle(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== "POST") return send({ ok: false, msg: "Método no permitido" }, origin, 405);

  const url = Deno.env.get("SUPABASE_URL")!, anon = Deno.env.get("SUPABASE_ANON_KEY")!, svc = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return send({ ok: false, msg: "Tenés que iniciar sesión" }, origin, 401);
  const auth = createClient(url, anon, { auth: { persistSession: false } });
  const { data: u, error: ue } = await auth.auth.getUser(token);
  if (ue || !u || !u.user) return send({ ok: false, msg: "Tu sesión venció, volvé a entrar" }, origin, 401);
  const uid = u.user.id;

  const admin = createClient(url, svc, { auth: { persistSession: false } });
  const { data: mem } = await admin.from("grow_members").select("grow_id").eq("user_id", uid).maybeSingle();
  if (!mem) return send({ ok: false, msg: "Primero entrá a un grupo" }, origin, 403);

  let body: any;
  try { body = await req.json(); } catch (_e) { return send({ ok: false, msg: "Pedido inválido" }, origin, 400); }
  const task = String(body && body.task || "");

  try {
    // validar ANTES de gastar cuota
    let run: () => Promise<unknown>;
    if (task === "analyze") {
      const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(body.image || ""));
      if (!m || m[1].length > 6 * 1024 * 1024) throw new Fail("La imagen no es válida o es muy grande");
      const ctx = JSON.stringify(body.context || {}, null, 1).slice(0, 2500);
      run = async () => {
        const { data: st } = await admin.from("grow_state").select("data").eq("grow_id", mem.grow_id).maybeSingle();
        const guide = st && st.data && st.data.guide && typeof st.data.guide.text === "string" ? st.data.guide.text : "";
        const { text } = await gemini({
          contents: [{ role: "user", parts: [{ inline_data: { mime_type: "image/jpeg", data: m[1] } }, { text: PROMPT_FOTO + guideBlock(guide) + "\n\nDatos de la planta:\n" + ctx }] }],
          generationConfig: { maxOutputTokens: 1200, responseMimeType: "application/json" },
        });
        const o = jsonFrom(text);
        const tone = o.estado === "alerta" ? "warn" : o.estado === "riego" ? "water" : "ok";
        const adv = o.consejo || {};
        const at = ["ok", "water", "warn"].includes(o.tipo_consejo) ? o.tipo_consejo : tone;
        return {
          tone, label: clean(o.etiqueta || (tone === "ok" ? "Sana" : tone === "water" ? "Regar" : "Atención"), 40),
          findings: (Array.isArray(o.hallazgos) ? o.hallazgos : []).slice(0, 4).map((h: any) => [clean(h.titulo, 90), clean(h.detalle, 320)]),
          advice: { tone: at, title: clean(adv.titulo || "Seguí así", 90), text: clean(adv.texto || "", 400) },
          guided: !!guide,
        };
      };
    } else if (task === "lookup") {
      const kind = String(body.kind || "");
      if (!LOOK[kind]) throw new Fail("Búsqueda no válida");
      const q = String(body.query || "").replace(/\s+/g, " ").trim().slice(0, 80);
      if (q.length < 2) throw new Fail("Escribí al menos 2 letras");
      const que = ({ semilla: "una genética (semilla) de cannabis", fertilizante: "un fertilizante o nutriente para plantas", sustrato: "un sustrato o tierra para macetas" } as any)[kind];
      run = async () => {
        const prompt = "Un cultivador casero legal busca " + que + " llamado «" + q + "». Buscá en internet (preferí la página del fabricante o banco de semillas y sitios de cultivo conocidos) y devolvé los datos reales. Si no existe o no estás seguro de que sea ese producto, devolvé {\"encontrada\":false}. No inventes datos: si no encontrás un valor, usá null. Español rioplatense, breve. Respondé SOLO con un JSON válido, sin texto extra, con esta forma:\n" + LOOK[kind];
        const { text, cand } = await gemini({ contents: [{ role: "user", parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { maxOutputTokens: 1600 } });
        const d = limpiar(kind, jsonFrom(text));
        if (!d) return { noEncontrada: true, msg: "No encontré «" + q + "» con datos confiables" };
        const seen = new Set<string>(), fuentes: { titulo: string; url: string }[] = [];
        ((cand.groundingMetadata && cand.groundingMetadata.groundingChunks) || []).forEach((c: any) => {
          const w = c.web; if (w && typeof w.uri === "string" && /^https:\/\//.test(w.uri) && !seen.has(w.uri) && fuentes.length < 4) { seen.add(w.uri); fuentes.push({ titulo: cl(w.title || w.uri, 80), url: w.uri.slice(0, 600) }); }
        });
        return { data: d, fuentes };
      };
    } else if (task === "guide") {
      const b64 = String(body.pdf || "");
      if (!/^[A-Za-z0-9+/=]+$/.test(b64) || b64.length < 200) throw new Fail("El PDF no es válido");
      if (b64.length > 12 * 1024 * 1024) throw new Fail("El PDF es muy pesado (máximo 8 MB)");
      run = async () => {
        const { text } = await gemini({ contents: [{ role: "user", parts: [{ inline_data: { mime_type: "application/pdf", data: b64 } }, { text: PROMPT_GUIA }] }], generationConfig: { maxOutputTokens: 8192 } });
        return { text: text.slice(0, 40000) };
      };
    } else if (task === "ask") {
      const q = String(body.question || "").replace(/\s+/g, " ").trim().slice(0, 400);
      if (q.length < 3) throw new Fail("Escribí una pregunta");
      const ctx = JSON.stringify(body.context || {}, null, 1).slice(0, 3000);
      run = async () => {
        const { data: st } = await admin.from("grow_state").select("data").eq("grow_id", mem.grow_id).maybeSingle();
        const guide = st && st.data && st.data.guide && typeof st.data.guide.text === "string" ? st.data.guide.text : "";
        const sys = "Sos un asistente de cultivo hogareño (cannabis, cultivo personal legal). Respondé en español rioplatense, concreto y en menos de 180 palabras, con pasos cortos. Si hay una guía del cultivador, seguila al pie de la letra para etapa, dosis y tareas; si la guía no cubre lo que preguntan, decilo y dá una recomendación general prudente. No des certezas médicas.";
        const { text } = await gemini({ systemInstruction: { parts: [{ text: sys }] }, contents: [{ role: "user", parts: [{ text: "Datos de la planta y del cultivo:\n" + ctx + guideBlock(guide) + "\n\nPregunta: " + q }] }], generationConfig: { maxOutputTokens: 700 } });
        return { text: clean(text, 2500) };
      };
    } else {
      throw new Fail("Pedido no válido");
    }
    // cuota diaria
    const { data: okq } = await admin.rpc("ai_take", { p_user: uid, p_limit: LIMIT });
    if (!okq) throw new Fail("Llegaste al tope diario de la IA (" + LIMIT + " usos). Mañana se renueva");
    const out: any = await run();
    if (out && out.noEncontrada) return send({ ok: false, noEncontrada: true, msg: out.msg }, origin);
    return send({ ok: true, ...(task === "lookup" ? out : { data: out }) }, origin);
  } catch (e) {
    if (e instanceof Fail) return send({ ok: false, msg: e.msg }, origin, e.status);
    console.error("ai error", e);
    return send({ ok: false, msg: "Algo falló en el servidor" }, origin, 200);
  }
}

Deno.serve(handle);
