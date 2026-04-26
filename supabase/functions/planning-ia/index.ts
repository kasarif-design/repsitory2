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

    const { semaine, meteo } = await req.json();

    const today = new Date();
    const debutSemaine = semaine
      ? new Date(semaine)
      : (() => {
          const d = new Date(today);
          const day = d.getDay();
          const diff = day === 0 ? -6 : 1 - day;
          d.setDate(d.getDate() + diff);
          return d;
        })();
    const finSemaine = new Date(debutSemaine);
    finSemaine.setDate(debutSemaine.getDate() + 6);

    const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

    const [{ data: chantiers }, { data: employes }, { data: taches }] = await Promise.all([
      supabase
        .from("chantiers")
        .select("id,nom,adresse,ville,code_postal,statut,avancement,date_debut,date_fin_prevue,chef_chantier_nom,description,budget_prevu,budget_consomme")
        .eq("user_id", user.id)
        .in("statut", ["planifie", "en_cours", "pause"])
        .order("date_fin_prevue"),
      supabase
        .from("employes")
        .select("id,prenom,nom,corps_metier,statut,taux_horaire")
        .eq("user_id", user.id)
        .eq("statut", "actif"),
      supabase
        .from("taches_chantier")
        .select("titre,statut,priorite,date_fin_prevue,chantier_id")
        .eq("user_id", user.id)
        .in("statut", ["a_faire", "en_cours", "bloque"])
        .order("priorite")
        .limit(50),
    ]);

    const meteoInfo = meteo
      ? `Meteo prevue cette semaine: ${meteo}`
      : "Meteo: non renseignee (hypothese: conditions normales)";

    const chantiersActifs = (chantiers || []).filter((c: Record<string, unknown>) => {
      const debut = c.date_debut ? new Date(c.date_debut as string) : null;
      const fin = c.date_fin_prevue ? new Date(c.date_fin_prevue as string) : null;
      if (!debut) return true;
      return (!fin || fin >= debutSemaine) && debut <= finSemaine;
    });

    const prompt = `Tu es un expert en planification de chantiers BTP. Genere un planning optimise pour la semaine du ${debutSemaine.toLocaleDateString("fr-FR")} au ${finSemaine.toLocaleDateString("fr-FR")}.

${meteoInfo}

CHANTIERS ACTIFS OU A PLANIFIER:
${JSON.stringify(chantiersActifs, null, 2)}

TOUTES LES TACHES EN COURS / A FAIRE:
${JSON.stringify(taches || [], null, 2)}

EQUIPE DISPONIBLE (${(employes || []).length} employes actifs):
${JSON.stringify(employes || [], null, 2)}

INSTRUCTIONS:
Genere un planning hebdomadaire optimise en tenant compte de:
1. La proximite geographique des chantiers (regroupe les equipes par zone)
2. Les conditions meteo (evite travaux exterieurs sensibles si mauvais temps)
3. Les urgences (taches bloquees, chantiers en retard)
4. Les corps de metier necessaires sur chaque chantier
5. La charge de travail equitable entre les employes
6. Les priorites et dates de fin prevues

Reponds UNIQUEMENT en JSON avec ce format exact:

{
  "semaine": "du JJ/MM au JJ/MM/AAAA",
  "resume": "synthese du planning en 2-3 phrases",
  "jours": [
    {
      "jour": "Lundi JJ/MM",
      "date": "AAAA-MM-JJ",
      "affectations": [
        {
          "chantier": "nom du chantier",
          "ville": "ville",
          "equipe": ["Prenom Nom (metier)", "..."],
          "taches_du_jour": ["tache 1", "tache 2"],
          "notes": "note specifique si besoin"
        }
      ],
      "alertes_jour": ["alerte meteo ou autre si applicable"]
    }
  ],
  "employes_non_affectes": ["employe sans affectation cette semaine si applicable"],
  "chantiers_sans_equipe": ["chantier sans ressource si applicable"],
  "conseils_optimisation": ["conseil 1", "conseil 2"],
  "risques_semaine": ["risque identifie 1", "risque 2"]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.4,
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
    const planning = JSON.parse(data.choices[0]?.message?.content || "{}");

    return new Response(
      JSON.stringify({ planning }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Erreur: ${error instanceof Error ? error.message : String(error)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
