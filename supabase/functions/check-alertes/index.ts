import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Notification {
  user_id: string;
  type: "info" | "warning" | "error" | "success";
  titre: string;
  message: string;
  lu: boolean;
  priorite: "faible" | "normale" | "haute" | "critique";
  lien_cible?: string | null;
}

interface Chantier {
  id: string;
  user_id: string;
  nom: string;
  ville: string;
  statut: string;
  avancement: number;
  budget_prevu: number;
  budget_consomme: number;
  date_fin_prevue: string | null;
  chef_chantier_nom: string | null;
}

interface TacheChantier {
  id: string;
  user_id: string;
  chantier_id: string;
  titre: string;
  statut: "a_faire" | "en_cours" | "bloque" | "termine";
  priorite: string;
  date_fin_prevue: string | null;
  updated_at: string;
}

function daysDiff(dateA: Date, dateB: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((dateA.getTime() - dateB.getTime()) / msPerDay);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = user.id;
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Fetch active chantiers
    const { data: chantiers, error: chantiersError } = await supabase
      .from("chantiers")
      .select("id, user_id, nom, ville, statut, avancement, budget_prevu, budget_consomme, date_fin_prevue, chef_chantier_nom")
      .eq("user_id", userId)
      .in("statut", ["en_cours", "planifie"]);

    if (chantiersError) {
      throw new Error(`Failed to fetch chantiers: ${chantiersError.message}`);
    }

    // Fetch non-terminated tasks
    const { data: taches, error: tachesError } = await supabase
      .from("taches_chantier")
      .select("id, user_id, chantier_id, titre, statut, priorite, date_fin_prevue, updated_at")
      .eq("user_id", userId)
      .neq("statut", "termine");

    if (tachesError) {
      throw new Error(`Failed to fetch taches: ${tachesError.message}`);
    }

    // Fetch existing notifications in the last 24h to deduplicate
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existingNotifs, error: existingError } = await supabase
      .from("notifications")
      .select("titre")
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo);

    if (existingError) {
      throw new Error(`Failed to fetch existing notifications: ${existingError.message}`);
    }

    const existingTitles = new Set((existingNotifs ?? []).map((n: { titre: string }) => n.titre));

    // Build a map of chantier id -> nom for task messages
    const chantierMap = new Map<string, string>();
    for (const c of (chantiers ?? []) as Chantier[]) {
      chantierMap.set(c.id, c.nom);
    }

    const alertsToInsert: Notification[] = [];

    // Helper to add an alert with deduplication check
    function addAlert(alert: Notification) {
      if (!existingTitles.has(alert.titre)) {
        alertsToInsert.push(alert);
        // Also add to in-memory set to prevent duplicates within the same run
        existingTitles.add(alert.titre);
      }
    }

    // Analyze chantiers
    for (const chantier of (chantiers ?? []) as Chantier[]) {
      const { nom, ville, statut, avancement, budget_prevu, budget_consomme, date_fin_prevue } = chantier;

      // --- Retard ---
      if (statut === "en_cours" && date_fin_prevue) {
        const finDate = new Date(date_fin_prevue);
        if (finDate < now) {
          const daysLate = daysDiff(now, finDate);
          addAlert({
            user_id: userId,
            type: "error",
            priorite: "critique",
            titre: `Chantier en retard : ${nom}`,
            message: `${nom} (${ville}) devrait être terminé depuis ${daysLate} jour${daysLate > 1 ? "s" : ""}`,
            lu: false,
            lien_cible: null,
          });
        }
      }

      // --- Budget ---
      if (budget_prevu > 0) {
        const pct = (budget_consomme / budget_prevu) * 100;

        if (pct > 100) {
          addAlert({
            user_id: userId,
            type: "error",
            priorite: "critique",
            titre: `Dépassement budget : ${nom}`,
            message: `Budget dépassé à ${pct.toFixed(1)}% (${budget_consomme.toLocaleString("fr-FR")} € / ${budget_prevu.toLocaleString("fr-FR")} €)`,
            lu: false,
            lien_cible: null,
          });
        } else if (pct > 80) {
          addAlert({
            user_id: userId,
            type: "warning",
            priorite: "haute",
            titre: `Budget à risque : ${nom}`,
            message: `Budget consommé à ${pct.toFixed(1)}% (${budget_consomme.toLocaleString("fr-FR")} € / ${budget_prevu.toLocaleString("fr-FR")} €)`,
            lu: false,
            lien_cible: null,
          });
        }
      }

      // --- Avancement faible avec échéance proche ---
      if (statut === "en_cours" && date_fin_prevue) {
        const finDate = new Date(date_fin_prevue);
        const daysUntilEnd = daysDiff(finDate, now);
        if (daysUntilEnd >= 0 && daysUntilEnd < 7 && (avancement ?? 0) < 70) {
          addAlert({
            user_id: userId,
            type: "warning",
            priorite: "haute",
            titre: `Avancement insuffisant : ${nom}`,
            message: `Le chantier ${nom} (${ville}) se termine dans ${daysUntilEnd} jour${daysUntilEnd > 1 ? "s" : ""} mais n'est avancé qu'à ${avancement ?? 0}%`,
            lu: false,
            lien_cible: null,
          });
        }
      }
    }

    // Analyze tasks
    for (const tache of (taches ?? []) as TacheChantier[]) {
      const { titre, statut, date_fin_prevue, updated_at, chantier_id } = tache;
      const nomChantier = chantierMap.get(chantier_id) ?? "chantier inconnu";

      // --- Tâche bloquée > 2 jours ---
      if (statut === "bloque") {
        const updatedAtDate = new Date(updated_at);
        const blockedDays = daysDiff(now, updatedAtDate);
        if (blockedDays > 2) {
          addAlert({
            user_id: userId,
            type: "warning",
            priorite: "haute",
            titre: `Tâche bloquée : ${titre}`,
            message: `Bloquée depuis ${blockedDays} jour${blockedDays > 1 ? "s" : ""} sur le chantier ${nomChantier}`,
            lu: false,
            lien_cible: null,
          });
        }
      }

      // --- Tâche en retard ---
      if (date_fin_prevue && statut !== "termine") {
        const finDate = new Date(date_fin_prevue);
        if (finDate < now) {
          const daysLate = daysDiff(now, finDate);
          addAlert({
            user_id: userId,
            type: "warning",
            priorite: "normale",
            titre: `Tâche en retard : ${titre}`,
            message: `La tâche "${titre}" sur le chantier ${nomChantier} est en retard de ${daysLate} jour${daysLate > 1 ? "s" : ""}`,
            lu: false,
            lien_cible: null,
          });
        }
      }
    }

    // Insert new alerts
    let insertedAlerts: Notification[] = [];
    if (alertsToInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("notifications")
        .insert(alertsToInsert)
        .select();

      if (insertError) {
        throw new Error(`Failed to insert notifications: ${insertError.message}`);
      }

      insertedAlerts = insertedData ?? [];
    }

    return new Response(
      JSON.stringify({
        created: insertedAlerts.length,
        alerts: insertedAlerts,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
