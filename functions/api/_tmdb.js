// Общие помощники для обращения к TMDB. Ключ берётся из защищённой переменной TMDB_TOKEN.
export async function tmdb(env, path, params) {
  const url = new URL("https://api.themoviedb.org/3" + path);
  Object.keys(params || {}).forEach((k) => url.searchParams.set(k, params[k]));
  const r = await fetch(url.toString(), {
    headers: { Authorization: "Bearer " + env.TMDB_TOKEN, Accept: "application/json" },
    cf: { cacheTtl: 86400, cacheEverything: true },
  });
  if (!r.ok) throw new Error("tmdb " + r.status);
  return r.json();
}

export function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status && status >= 400 ? "no-store" : "public, max-age=86400",
    },
  });
}
