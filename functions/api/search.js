// /api/search?title=Амели&year=2001 -> { id, poster, title, year }
import { tmdb, json } from "./_tmdb.js";

// Если какой-то фильм не находится, добавьте сюда пару: "название на сайте": "Original Title"
const ALIASES = {
  "Паддингтон 2": "Paddington 2",
  "Паддингтон": "Paddington",
  "До восхода солнца": "Before Sunrise",
  "Влюблённый Шекспир": "Shakespeare in Love",
  "Супербэд": "Superbad",
  "Мулхолланд Драйв": "Mulholland Drive",
};

const yr = (m) => parseInt((m.release_date || "").slice(0, 4), 10) || 0;

function variants(title) {
  const out = [title];
  if (ALIASES[title]) out.push(ALIASES[title]);
  const clean = title.replace(/[«»"“”:;,.!?]/g, " ").replace(/\s+/g, " ").trim();
  if (clean && clean !== title) out.push(clean);
  const noNum = clean.replace(/\s+\d+$/, "").trim();
  if (noNum && noNum !== clean) out.push(noNum);
  return out;
}

async function lookup(env, query, language, year) {
  const p = { query, language, include_adult: "false" };
  if (year) p.year = String(year);
  const data = await tmdb(env, "/search/movie", p);
  return data.results || [];
}

export async function onRequestGet({ request, env }) {
  if (!env.TMDB_TOKEN) return json({ error: "no token" }, 500);
  const u = new URL(request.url);
  const title = (u.searchParams.get("title") || "").slice(0, 120);
  const year = parseInt(u.searchParams.get("year"), 10) || 0;
  if (!title) return json({ error: "no title" }, 400);
  try {
    for (const q of variants(title)) {
      for (const language of ["ru-RU", "en-US"]) {
        for (const y of [year, 0]) {
          const list = await lookup(env, q, language, y);
          const near = list.filter((m) => !year || Math.abs(yr(m) - year) <= 1);
          const best = near.find((m) => m.poster_path) || near[0];
          if (best) return json({ id: best.id, poster: best.poster_path || null, title: best.title, year: yr(best) });
        }
      }
    }
    return json({ none: true }, 404);
  } catch (e) {
    return json({ error: "upstream" }, 502);
  }
}
