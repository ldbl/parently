# Parently Web Frontend

Модерна уеб версия на Parently - AI асистент за родители и семейни финанси, изградена с Hugo и Bootstrap 5.

## 🚀 Функционалности

### За Родители
- **Check-in система** - Следване на емоционално състояние и финансов стрес
- **AI чат** - Интелигентни съвети и поддръжка
- **Дневни планове** - Персонализирани препоръки за всеки ден
- **Финансови графики** - Визуализация на семейните финанси
- **Детски инсайти** - Анализ на комуникацията с децата

### За Деца
- **Опростен чат** - Лесна комуникация с AI
- **Задачи и награди** - Гамифицирани активности
- **Финансово образование** - Игри за обучение за пари

## 🛠️ Технологии

- **Hugo** - Статичен сайт генератор
- **Bootstrap 5** - CSS framework за responsive дизайн
- **Chart.js** - Графики и визуализации
- **Vanilla JavaScript** - Интерактивност и API интеграция
- **Cloudflare Pages** - Хостинг и CDN

## 📦 Инсталация

### Предварителни изисквания
- Hugo Extended (версия 0.120.0 или по-нова)
- Node.js (за development)
- Git

### Локална разработка

1. **Стартирайте development сървъра**
```bash
hugo server --buildDrafts --buildFuture
```

2. **Отворете браузъра**
```
http://localhost:1313
```

### Production build

```bash
hugo --minify
```

Генерираните файлове ще бъдат в `public/` директорията.

## ⚙️ Конфигурация

### API URL настройка

В `hugo.toml` файла можете да промените API URL-а:

```toml
[params]
  apiBaseUrl = "https://your-api-domain.com"
```

### Environment Variables

За различни среди, използвайте environment variables:

```bash
# Development
export HUGO_ENV=development
export API_BASE_URL=http://localhost:8787

# Production
export HUGO_ENV=production
export API_BASE_URL=https://api.parently.live
```

## 🚀 Деплой

### Cloudflare Pages (Препоръчан)

1. **Свържете GitHub репозиторията** с Cloudflare Pages
2. **Настройте build командите**:
   - Build command: `hugo --minify`
   - Build output directory: `public`
   - Node.js version: `18`

3. **Добавете environment variables**:
   - `HUGO_VERSION`: `0.120.0`
   - `API_BASE_URL`: `https://api.parently.live`

### Ръчен деплой

```bash
# Build
hugo --minify

# Upload public/ директорията към вашия web server
```

## 📁 Структура на проекта

```
parently-web/
├── content/           # Markdown съдържание
│   ├── _index.md     # Начална страница
│   ├── checkin/      # Check-in страница
│   ├── plan/         # Планове страница
│   ├── chat/         # Чат страница
│   ├── finance/      # Финанси страница
│   └── kids/         # Детски акаунт
├── themes/
│   └── parently-theme/
│       ├── layouts/  # HTML шаблони
│       ├── static/   # CSS, JS, изображения
│       └── archetypes/
├── hugo.toml         # Hugo конфигурация
├── wrangler.toml     # Cloudflare конфигурация
└── README.md         # Тази документация
```

## 🎨 Персонализация

### Цветове и теми

Основните цветове се дефинират в `themes/parently-theme/static/css/style.css`:

```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #10b981;
    --accent-color: #f59e0b;
    /* ... */
}
```

### Добавяне на нови страници

1. **Създайте нов markdown файл** в `content/`:
```bash
hugo new content/my-page.md
```

2. **Добавете навигация** в `hugo.toml`:
```toml
[[menu.main]]
  identifier = "mypage"
  name = "Моята страница"
  url = "/my-page/"
  weight = 7
```

## 🔧 Development

### Добавяне на нови JavaScript функции

1. **Създайте нов JS файл** в `themes/parently-theme/static/js/`
2. **Добавете го** в `baseof.html`:
```html
<script src="{{ "js/my-script.js" | relURL }}"></script>
```

### API интеграция

Всички API заявки се правят чрез `window.parentlyAPI`:

```javascript
// Пример за check-in
const response = await window.parentlyAPI.createCheckin({
    checkinType: 'morning',
    emotionalState: 8,
    financialStress: 3,
    notes: 'Добро утро!'
});
```

## 🧪 Тестване

### Локално тестване

```bash
# Development сървър с hot reload
hugo server --buildDrafts --buildFuture

# Production build тест
hugo --minify
hugo server --environment production
```

### Cross-browser тестване

- Chrome/Edge (Blink)
- Firefox (Gecko)
- Safari (WebKit)

## 📊 Performance

### Оптимизации

- **Minified CSS/JS** в production
- **Image optimization** с Hugo Pipes
- **Lazy loading** за изображения
- **CDN** за статични ресурси

## 🔒 Сигурност

### API Security

- JWT токени за автентикация
- HTTPS за всички API заявки
- Rate limiting на сървъра

## 🤝 Contributing

1. **Fork** репозиторията
2. **Създайте feature branch**:
```bash
git checkout -b feature/amazing-feature
```
3. **Commit** промените:
```bash
git commit -m 'Add amazing feature'
```
4. **Push** към branch-а:
```bash
git push origin feature/amazing-feature
```
5. **Отворете Pull Request**

## 📝 License

Този проект е лицензиран под MIT License.

## 🆘 Поддръжка

- **Issues**: [GitHub Issues](https://github.com/your-org/parently/issues)
- **Email**: support@parently.live

## 🔄 Changelog

### v1.0.0 (2024-01-01)
- Първоначална версия
- Check-in система
- AI чат интеграция
- Responsive дизайн
- Cloudflare Pages деплой 