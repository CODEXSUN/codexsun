export async function communityShowcase(request, url, env) {
  if (request.method !== "GET") {
    return Response.json({ success: false, error: { message: "Method not allowed." } }, { status: 405 });
  }

  const audience = url.searchParams.get("audience");
  if (audience !== "students" && audience !== "alumni") {
    return Response.json({ success: false, error: { message: "Choose students or alumni." } }, { status: 400 });
  }

  try {
    const { results } = await env.CODEXSUN_TENKASISPORTS_CONTENT.prepare(
      `SELECT profile_id, display_name_en, display_name_ta, focus_en, focus_ta, image_panel
       FROM sites_community_showcase
       WHERE audience = ? AND published = 1
       ORDER BY sort_order, profile_id LIMIT 12`
    ).bind(audience).all();

    return Response.json({ success: true, data: results }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" }
    });
  } catch {
    return Response.json({ success: false, error: { message: "Showcase temporarily unavailable." } }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }
}
