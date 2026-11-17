// Налаштування розгортання. Тут — типові значення (GitHub Pages: усі розділи, календар семестру з core.js).
// Сайт, що вбудовує застосунок, віддає свій config.js, наприклад:
// window.APP_CONFIG = {tabs: ['schedule'], calendar: {start: '2026-09-01', ...}, home: {url: 'https://…/', label: 'Сайт інституту'}};
window.APP_CONFIG = {
  tabs: ['schedule', 'plan', 'journal'], // які розділи показувати; решта лишається в коді, але прихована
  calendar: null,                        // дати семестру замість Core.defaults (ті самі ключі)
  home: null,                            // {url, label} — посилання назад на сайт, що вбудовує застосунок
  settings: true                         // false — кнопку «Налаштування» сховано, дати лише з calendar (збережені користувачем ігноруються)
};
