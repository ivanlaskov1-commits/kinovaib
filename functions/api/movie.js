// /api/movie?id=550 -> описание, трейлер и где смотреть (по стране посетителя)
import { tmdb, json } from "./_tmdb.js";

export async function onRequestGet({ request, env }) {
  if (!env.TMDB_TOKEN) return json({ error: "no token" }, 500);
  const u = new URL(request.url);
  const id = u.searchParams.get("id") || "";
  if (!/^\d{1,9}$/.test(id)) return json({ error: "bad id" }, 400);
  const region = ((request.cf && request.cf.country) || "US").toUpperCase();
  try {
    const d = await tmdb(env, "/movie/" + id, {
      language: "ru-RU",
      append_to_response: "videos,watch/providers",
      include_video_language: "ru,en,null",
    });
    let overview = d.overview || "";
    if (!overview) {
      try {
        const en = await tmdb(env, "/movie/" + id, { language: "en-US" });
        overview = en.overview || "";
      } catch (e) { /* без описания */ }
    }
    const vids = ((d.videos && d.videos.results) || []).filter((v) => v.site === "YouTube");
    const pick =
      vids.find((v) => v.type === "Trailer" && v.iso_639_1 === "ru") ||
      vids.find((v) => v.type === "Trailer") ||
      vids.find((v) => v.type === "Teaser") ||
      null;
    const all = (d["watch/providers"] && d["watch/providers"].results) || {};
    const reg = all[region] || {};
    const names = (arr) => (arr || []).map((p) => p.provider_name);
    return json({
      overview,
      rating: d.vote_average || null,
      trailer: pick ? pick.key : null,
      region,
      link: reg.link || null,
      providers: { flatrate: names(reg.flatrate), free: names(reg.free), rent: names(reg.rent), buy: names(reg.buy) },
    });
  } catch (e) {
    return json({ error: "upstream" }, 502);
  }
}
