import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  userContext?: Record<string, unknown>;
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your Supabase secrets." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const [{ data: chantiers }, { data: employes }, { data: taches }] = await Promise.all([
      supabase.from("chantiers").select("nom,ville,statut,avancement,date_debut,date_fin_prevue,budget_prevu,budget_consomme,chef_chantier_nom,client_nom").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("employes").select("prenom,nom,corps_metier,statut,taux_horaire").eq("user_id", user.id).limit(50),
      supabase.from("taches_chantier").select("titre,statut,priorite,date_fin_prevue").eq("user_id", user.id).in("statut", ["a_faire","en_cours","bloque"]).order("date_fin_prevue").limit(20),
    ]);

    const today = new Date().toLocaleDateString("fr-FR");
    const chantiersEnCours = (chantiers || []).filter((c: Record<string, unknown>) => c.statut === "en_cours");
    const chantiersEnRetard = chantiersEnCours.filter((c: Record<string, unknown>) => c.date_fin_prevue && new Date(c.date_fin_prevue as string) < new Date());

    const contextInfo = [
      `Date du jour: ${today}`,
      `Utilisateur: ${profile?.full_name || user.email}`,
      `\nCHANTIERS (${(chantiers || []).length} total, ${chantiersEnCours.length} en cours, ${chantiersEnRetard.length} en retard):`,
      ...(chantiers || []).map((c: Record<string, unknown>) => {
        const budgetPct = (c.budget_prevu as number) > 0 ? Math.round(((c.budget_consomme as number) / (c.budget_prevu as number)) * 100) : 0;
        return `  - "${c.nom}" | ${c.statut} | ${c.avancement}% | ${c.ville} | Budget: ${budgetPct}% consomme | Fin prevue: ${c.date_fin_prevue || "non definie"} | Chef: ${c.chef_chantier_nom || "—"} | Client: ${c.client_nom || "—"}`;
      }),
      `\nEMPLOYES (${(employes || []).length} total):`,
      ...(employes || []).map((e: Record<string, unknown>) => `  - ${e.prenom} ${e.nom} | ${e.corps_metier} | ${e.statut} | ${e.taux_horaire}€/h`),
      `\nTACHES EN COURS/A FAIRE (${(taches || []).length}):`,
      ...(taches || []).map((t: Record<string, unknown>) => `  - "${t.titre}" | ${t.statut} | priorite: ${t.priorite} | echeance: ${t.date_fin_prevue || "—"}`),
    ].join("\n");

    const { messages }: RequestBody = await req.json();

    const systemPrompt = `Tu es BATIUM AI, l'assistant intelligent specialise dans la gestion d'entreprise BTP. Tu aides les chefs d'entreprise, conducteurs de travaux et gerants de PME du batiment a piloter leurs chantiers, equipes et plannings.

Voici les donnees actuelles de l'entreprise :
${contextInfo}

Tes capacites:
- Analyser l'etat des chantiers (retards, budgets, avancements)
- Identifier les ressources disponibles et proposer des affectations
- Alerter sur les risques (depassements de budget, retards, surcharge d'equipe)
- Suggerer des priorites et actions correctives
- Repondre a des questions comme "quels chantiers sont en retard ?", "qui est disponible cette semaine ?", "quel est l'etat de mon budget global ?"
- Aider a planifier et organiser le travail

Instructions:
- Reponds toujours en francais
- Sois concis, direct et pratique - tu t'adresses a des professionnels du terrain
- Base tes reponses sur les donnees reelles de l'entreprise ci-dessus
- Propose des actions concretes et des conseils adaptes au BTP
- Si les donnees sont insuffisantes, dis-le et suggere ce qu'il faudrait renseigner
- Utilise des chiffres precis quand disponibles
- Adopte le ton d'un expert BTP qui connait bien les contraintes du secteur`;

    const openaiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return new Response(
        JSON.stringify({ error: `Erreur OpenAI: ${openaiResponse.status} - ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0]?.message?.content || "Je n'ai pas pu générer une réponse.";

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === "user") {
      await supabase.from("chat_messages").insert([
        { user_id: user.id, role: "user", content: lastUserMessage.content },
        { user_id: user.id, role: "assistant", content: assistantMessage },
      ]);
    }

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Erreur interne: ${error instanceof Error ? error.message : String(error)}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
