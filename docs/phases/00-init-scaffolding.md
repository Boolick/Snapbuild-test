# PR #0: Инициализация монорепозитория и базовые конфигурации

## 📌 Краткое описание
Первичная инициализация структуры монорепозитория для системы **AI Image Workflow Mini**. Настройка базовых конфигурационных файлов, инструментов сборки, линтинга, типизации TypeScript и пакетных менеджеров для бэкенда (**Nest.js**) и фронтенда (**React 18 + Vite + TailwindCSS**), а также сохранение исходных требований тестового задания.

---

## 🎯 Цели и задачи
- [x] Организовать структуру монорепозитория с разделением на `backend/` и `Frontend/`.
- [x] Настроить корневой `package.json` с едиными командами запуска (`dev`, `build`, `install:all`).
- [x] Инициализировать конфигурацию TypeScript, Nest CLI для бэкенда.
- [x] Инициализировать Vite, TailwindCSS, PostCSS и TypeScript для фронтенда.
- [x] Сформировать полный `.gitignore` для исключения системных файлов, артефактов сборки и кэша.
- [x] Зафиксировать исходные файлы ТЗ в каталоге `TT/`.

---

## 🏗 Архитектурные решения и структура
- **Стек бэкенда:** Node.js, Nest.js 10, TypeScript 5.5, RxJS.
- **Стек фронтенда:** React 18, Vite 5, TailwindCSS 3, TypeScript 5.5.
- **Оркестрация разработки:** Пакет `concurrently` на корневом уровне для одновременного запуска dev-серверов бэкенда и фронтенда одной командой `npm run dev`.

---

## 📦 Включенные файлы
| Путь к файлу | Описание |
|---|---|
| `.gitignore` | Правила игнорирования `node_modules`, `.planning`, `dist`, `.env` и кэша |
| `package.json` | Корневой манифест со скриптами монорепозитория |
| `docs/phases/00-init-scaffolding.md` | Данное описание фазы инициализации |
| `TT/ai_image_workflow_mini_test_task_6-13.html` | Исходное ТЗ тестового задания |
| `TT/implementation_plan.md` | Первичный план реализации требований |
| `TT/vacancy.txt` | Описание вакансии и контекст проекта |
| `TT/photo_2026-08-26_10-18-57.jpg` | Референс UI из ТЗ |
| `backend/package.json` | Манифест зависимостей Nest.js бэкенда |
| `backend/package-lock.json` | Lock-файл зависимостей бэкенда |
| `backend/tsconfig.json` | Конфигурация компилятора TypeScript (NestJS) |
| `backend/tsconfig.build.json` | Конфигурация сборки TypeScript |
| `backend/nest-cli.json` | Конфигурация Nest CLI |
| `backend/.env.example` | Пример переменных окружения бэкенда |
| `Frontend/package.json` | Манифест зависимостей React фронтенда |
| `Frontend/package-lock.json` | Lock-файл зависимостей фронтенда |
| `Frontend/.env.example` | Пример переменных окружения фронтенда |
| `Frontend/tsconfig.json` | Конфигурация компилятора TypeScript для React |
| `Frontend/tsconfig.node.json` | Конфигурация TypeScript для Vite конфигов |
| `Frontend/vite.config.ts` | Конфигурация сборщика Vite |
| `Frontend/postcss.config.js` | Конфигурация PostCSS для TailwindCSS |
| `Frontend/tailwind.config.js` | Конфигурация TailwindCSS темы и утилит |
| `Frontend/index.html` | Точка входа SPA HTML |
| `Frontend/src/vite-env.d.ts` | Декларации типов окружения Vite |

---

## 🔍 Как проверить
```bash
# 1. Установка всех зависимостей в бэкенде и фронтенде
npm run install:all

# 2. Проверка доступности корневых скриптов
npm run
```
