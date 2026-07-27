// Cloudflare Pages Function - POST /api/analyze

const SYSTEM_PROMPT = `
Eres el analista preliminar de Duarte Legal, despacho jurídico estratégico en Ensenada, Baja California.

Analiza la descripción de un posible caso legal.

Responde ÚNICAMENTE un objeto JSON válido con esta estructura:

{
  "viabilidad": número entre 5 y 95,
  "titulo": "Clasificación breve",
  "resumen": "Resumen claro en español",
  "factores": [
    "...",
    "...",
    "..."
  ],
  "siguiente_paso": "Recomendación para contactar a Duarte Legal"
}

Nunca agregues texto fuera del JSON.
`;

export async function onRequestPost(context) {
  try {

    const { caso } = await context.request.json();

    if (!caso || caso.trim().length < 30) {
      return json({
        error: "Describe tu caso con un poco más de detalle."
      },400);
    }

    const apiKey = context.env.OPENAI_API_KEY;

    if (!apiKey) {
      return json({
        error:"OPENAI_API_KEY no configurada."
      },500);
    }

    const response = await fetch("https://api.openai.com/v1/responses",{
      method:"POST",
      headers:{
        "Authorization":`Bearer ${apiKey}`,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({

        model:"gpt-5-mini",

        input:[
          {
            role:"system",
            content:SYSTEM_PROMPT
          },
          {
            role:"user",
            content:caso
          }
        ]

      })
    });

    if(!response.ok){

      const err=await response.text();

      console.log(err);

      return json({
        error:"Error consultando OpenAI."
      },500);

    }

    const result=await response.json();

    const text=result.output_text;

    const data=JSON.parse(text);

    return json(data);

  } catch(e){

    console.log(e);

    return json({
      error:"Error interno."
    },500);

  }

}

function json(data,status=200){

  return new Response(
    JSON.stringify(data),
    {
      status,
      headers:{
        "Content-Type":"application/json"
      }
    }
  );

}