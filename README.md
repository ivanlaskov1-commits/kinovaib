# Киновайб: как запустить сайт

Здесь лежит весь сайт. Ключ TMDB в файлах не хранится.

## Что в папке
- `index.html`, `app.js`, `data.js` — сам сайт
- `functions/api/` — серверная часть, которая обращается к TMDB (ключ скрыт)

## Шаг 1. Загрузить на GitHub
1. На github.com нажмите «+» → New repository, назовите `kinovaib`, выберите Public, нажмите Create.
2. Нажмите «uploading an existing file», перетащите ВСЁ из этой папки (включая папку `functions`) и нажмите Commit changes.

## Шаг 2. Подключить Cloudflare Pages
1. На dash.cloudflare.com откройте Workers & Pages → Create → Pages → Connect to Git.
2. Выберите репозиторий `kinovaib`. Build command и output directory оставьте пустыми. Нажмите Save and Deploy.

## Шаг 3. Добавить ключ TMDB
1. Откройте проект → Settings → Variables and Secrets → Add.
2. Имя: `TMDB_TOKEN`, значение: длинный «Ключ доступа к API» из TMDB. Тип Secret. Сохраните.
3. Откройте Deployments и нажмите Retry deployment (или загрузите любое изменение), чтобы ключ подхватился.

Сайт будет доступен по адресу вида `kinovaib.pages.dev`.
