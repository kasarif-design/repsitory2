import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "Cle OpenAI non configuree. Ajoutez OPENAI_API_KEY dans vos secrets Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { chantierId } = await req.json();

    let chantiersQuery = supabase
      .from("chantiers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (chantierId) {
      chantiersQuery = chantiersQuery.eq("id", chantierId);
    } else {
      chantiersQuery = chantiersQuery.in("statut", ["planifie", "en_cours", "pause"]).limit(10);
    }

    const [{ data: chantiers }, { data: employes }, { data: taches }] = await Promise.all([
      chantiersQuery,
      supabase.from("employes").select("prenom,nom,corps_metier,statut,taux_horaire").eq("user_id", user.id).limit(50),
      supabase.from("taches_chantier").select("titre,statut,priorite,date_fin_prevue,chantier_id").eq("user_id", user.id).order("date_fin_prevue").limit(100),
    ]);

    const today = new Date();

    const chantiersData = (chantiers || []).map((c: Record<string, unknown>) => {
      const budgetPct = (c.budget_prevu as number) > 0
        ? Math.round(((c.budget_consomme as number) / (c.budget_prevu as number)) * 100)
        : 0;
      const fin = c.date_fin_prevue ? new Date(c.date_fin_prevue as string) : null;
      const joursRestants = fin ? Math.ceil((fin.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const tachesChantier = (taches || []).filter((t: Record<string, unknown>) => t.chantier_id === c.id);
      const tachesBloquees = tachesChantier.filter((t: Record<string, unknown>) => t.statut === "bloque");
      return {
        nom: c.nom,
        ville: c.ville,
        statut: c.statut,
        avancement: c.avancement,
        budgetPrevu: c.budget_prevu,
        budgetConsomme: c.budget_consomme,
        budgetPct,
        dateDebut: c.date_debut,
        dateFinPrevue: c.date_fin_prevue,
        joursRestants,
        chefChantier: c.chef_chantier_nom,
        clientNom: c.client_nom,
        description: c.description,
        nbTaches: tachesChantier.length,
        nbTachesBloquees: tachesBloquees.length,
      };
    });

    const employesActifs = (employes || []).filter((e: Record<string, unknown>) => e.statut === "actif");

    const prompt = `Tu es un expert en gestion de chantiers BTP avec 20 ans d'experience. Effectue une analyse predictive detaillee et professionnelle des chantiers suivants.

Date du jour: ${today.toLocaleDateString("fr-FR")}

CHANTIERS A ANALYSER:
${JSON.stringify(chantiersData, null, 2)}

EQUIPE DISPONIBLE:
- ${employesActifs.length} employes actifs sur ${(employes || []).length} total
- Corps de metiers: ${[...new Set((employesActifs as Record<string, unknown>[]).map((e: Record<string, unknown>) => e.corps_metier))].join(", ")}

INSTRUCTIONS D'ANALYSE:
Produis une analyse structuree en JSON avec exactement ce format:

{
  "resume_global": "synthese executive en 2-3 phrases",
  "score_risque_global": number (0-100, 100 = risque maximal),
  "chantiers": [
    {
      "nom": "nom du chantier",
      "score_risque": number (0-100),
      "niveau_risque": "faible" | "modere" | "eleve" | "critique",
      "probabilite_retard": number (0-100, pourcentage),
      "probabilite_depassement_budget": number (0-100, pourcentage),
      "alertes": ["alerte 1", "alerte 2"],
      "points_positifs": ["point 1", "point 2"],
      "actions_recommandees": ["action 1 urgente", "action 2"],
      "prediction_fin_reelle": "date estimee ou commentaire"
    }
  ],
  "recommandations_prioritaires": ["recommandation globale 1", "recommandation 2"],
  "ressources_critiques": "analyse des ressources humaines disponibles vs besoins"
}

Sois precis, base-toi sur les chiffres reels, et donne des conseils actionnables pour un conducteur de travaux BTP.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Erreur OpenAI: ${response.status} - ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0]?.message?.content || "{}");

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Erreur: ${error instanceof Error ? error.message : String(error)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
