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

    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: teamMembers } = await supabase
      .from("team_members")
      .select("*")
      .eq("owner_id", user.id)
      .limit(20);

    const { data: subscription } = await supabase
      .from("stripe_user_subscriptions")
      .select("*")
      .maybeSingle();

    const contextInfo = [
      `Utilisateur: ${profile?.full_name || user.email}`,
      `Email: ${user.email}`,
      `Compte créé le: ${new Date(user.created_at).toLocaleDateString("fr-FR")}`,
      projects && projects.length > 0
        ? `Projets (${projects.length}): ${projects.map((p: Record<string, unknown>) => `"${p.name}" (${p.status || "actif"})`).join(", ")}`
        : "Aucun projet créé pour l'instant.",
      teamMembers && teamMembers.length > 0
        ? `Membres de l'équipe (${teamMembers.length}): ${teamMembers.map((m: Record<string, unknown>) => m.name || m.email).join(", ")}`
        : "Aucun membre d'équipe ajouté.",
      subscription
        ? `Abonnement: ${subscription.subscription_status || "actif"} - Plan: ${subscription.price_id || "standard"}`
        : "Aucune information d'abonnement disponible.",
    ].join("\n");

    const { messages }: RequestBody = await req.json();

    const systemPrompt = `Tu es un assistant intelligent intégré à l'application de gestion d'entreprise. Tu aides les utilisateurs à gérer leurs projets, leur équipe et leur activité.

Voici les données actuelles du compte de l'utilisateur :
${contextInfo}

Instructions:
- Réponds toujours en français sauf si l'utilisateur te parle dans une autre langue
- Tu as accès aux données du compte de l'utilisateur listées ci-dessus
- Aide l'utilisateur à comprendre ses données, à gérer ses projets, son équipe et son activité
- Sois concis, professionnel et utile
- Si on te demande des informations non disponibles dans le contexte, dis-le clairement
- Propose des actions concrètes et des conseils adaptés à la situation de l'utilisateur`;

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
