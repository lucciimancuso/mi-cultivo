// Mi Cultivo · función "notify" de Supabase (Edge Function)
// La llama el reloj de la base de datos (pg_cron) cada 5 minutos con una clave secreta propia.
// Busca los avisos que ya les toca salir (tabla push_plan), los manda por Web Push y los marca como enviados.
// Secretos del servidor: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (opcional), CRON_SECRET.
// Esta función se despliega con "Verify JWT" APAGADO: la protege CRON_SECRET, no un login.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const PUB = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const PRIV = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const SUBJECT = Deno.env.get("VAPID_SUBJECT") || "https://lucciimancuso.github.io/mi-cultivo/";
const SECRET = Deno.env.get("CRON_SECRET") || "";
const VENTANA_H = 6;   // un aviso atrasado más de 6 horas ya no sirve: se descarta
const POR_CELU = 3;    // máximo de avisos por celu en una pasada (si estuvo todo caído, no lo spameamos)

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const same = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, msg: "Método no permitido" }, 405);
  if (!SECRET || !same(req.headers.get("x-cron-secret") || "", SECRET)) return json({ ok: false, msg: "No autorizado" }, 401);
  if (!PUB || !PRIV) return json({ ok: false, msg: "Faltan las claves VAPID en los secretos" }, 500);
  webpush.setVapidDetails(SUBJECT, PUB, PRIV);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const ahora = Date.now();
  const desde = new Date(ahora - VENTANA_H * 3600e3).toISOString();

  // lo que ya venció y no salió; lo muy viejo se marca como enviado sin mandarlo
  await admin.from("push_plan").update({ sent: true }).eq("sent", false).lt("at", desde);
  const { data: due, error } = await admin.from("push_plan").select("id,endpoint,title,body,at")
    .eq("sent", false).lte("at", new Date(ahora).toISOString()).order("at", { ascending: true }).limit(200);
  if (error) return json({ ok: false, msg: error.message }, 500);
  if (!due || !due.length) return json({ ok: true, sent: 0 });

  // "reservo" los avisos (sent=true) antes de mandar, así dos pasadas seguidas no mandan lo mismo dos veces
  const ids = due.map((d: any) => d.id);
  const { data: claimed, error: e2 } = await admin.from("push_plan").update({ sent: true }).in("id", ids).eq("sent", false).select("id");
  if (e2) return json({ ok: false, msg: e2.message }, 500);
  const mine = new Set((claimed || []).map((c: any) => c.id));
  const list = due.filter((d: any) => mine.has(d.id));

  const porCelu = new Map<string, any[]>();
  for (const d of list) { const a = porCelu.get(d.endpoint) || []; a.push(d); porCelu.set(d.endpoint, a); }
  const { data: subs } = await admin.from("push_subs").select("endpoint,p256dh,auth").in("endpoint", [...porCelu.keys()]);
  const subOf = new Map((subs || []).map((s: any) => [s.endpoint, s]));

  let sent = 0, failed = 0, removed = 0;
  const retry: number[] = [], gone: string[] = [];
  for (const [endpoint, items] of porCelu) {
    const s: any = subOf.get(endpoint);
    if (!s) continue;
    for (const it of items.slice(-POR_CELU)) {
      try {
        await webpush.sendNotification(
          { endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: it.title, body: it.body, tag: "mc-" + it.id, url: "./" }),
          { TTL: VENTANA_H * 3600, urgency: "normal", timeout: 15000 },
        );
        sent++;
      } catch (e: any) {
        const st = e && e.statusCode;
        if (st === 404 || st === 410) { gone.push(endpoint); removed++; break; }  // el celu se desinstaló o quitó el permiso
        failed++;
        if (!st || st >= 500 || st === 429) retry.push(it.id);                       // error pasajero: se reintenta en la próxima pasada
      }
    }
  }
  if (gone.length) await admin.from("push_subs").delete().in("endpoint", gone);
  if (retry.length) await admin.from("push_plan").update({ sent: false }).in("id", retry);
  return json({ ok: true, sent, failed, removed });
});
