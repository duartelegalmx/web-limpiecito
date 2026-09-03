function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8"
    }
  });
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function generateLeadId() {
  return `DL-${crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();

    const name = cleanText(body.name, 120);
    const whatsapp = cleanText(body.whatsapp, 40);
    const email = cleanText(body.email, 160);
    const userType = cleanText(body.user_type, 60);
    const originalCase = cleanText(body.original_case, 10000);
    const diagnosis = cleanText(body.diagnosis, 15000);
    const priority = cleanText(body.priority, 30);
    const origin = cleanText(body.origin, 60);

    if (!name || !whatsapp || !userType || !originalCase || !diagnosis) {
      return json(
        {
          ok: false,
          error: "Faltan datos obligatorios."
        },
        400
      );
    }

    if (originalCase.length < 10) {
      return json(
        {
          ok: false,
          error: "El caso proporcionado es demasiado corto."
        },
        400
      );
    }

    const leadId = generateLeadId();
    const createdAt = new Date().toISOString();

    await context.env.DB.prepare(`
      INSERT INTO leads (
        id,
        created_at,
        name,
        whatsapp,
        email,
        user_type,
        original_case,
        diagnosis,
        priority,
        origin
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        leadId,
        createdAt,
        name,
        whatsapp,
        email || null,
        userType,
        originalCase,
        diagnosis,
        priority || null,
        origin || "ai_diagnosis"
      )
      .run();

    return json({
      ok: true,
      lead_id: leadId
    });
  } catch (error) {
    console.error("Lead storage error:", error?.message || "unknown error");

    return json(
      {
        ok: false,
        error: "No fue posible guardar la solicitud."
      },
      500
    );
  }
}
