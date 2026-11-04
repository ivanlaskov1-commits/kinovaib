// /api/search?title=Амели&year=2001 -> { id, poster, title, year }
import { tmdb, json } from "./_tmdb.js";

export async function onRequestGet({ request, env }) {
  if (!env.TMDB_TOKEN) return json({ error: "no token" }, 500);
  const u = new URL(request.url);
  const title = (u.searchParams.get("title") || "").slice(0, 120);
  const year = parseInt(u.searchParams.get("year"), 10) || 0;
  if (!title) return json({ error: "no title" }, 400);
  try {
    const data = await tmdb(env, "/search/movie", { query: title, language: "ru-RU", include_adult: "false" });
    const list = data.results || [];
    const yr = (m) => parseInt((m.release_date || "").slice(0, 4), 10) || 0;
    const best =
      list.find((m) => year && Math.abs(yr(m) - year) <= 1 && m.poster_path) ||
      list.find((m) => year && Math.abs(yr(m) - year) <= 1) ||
      null;
    if (!best) return json({ none: true });
    return json({ id: best.id, poster: best.poster_path || null, title: best.title, year: yr(best) });
  } catch (e) {
    return json({ error: "upstream" }, 502);
  }
}
