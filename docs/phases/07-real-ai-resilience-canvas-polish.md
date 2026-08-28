# PR #7: Phase 7 — Интеграция реального Google Gemini & Neural Diffusion, Smart Retry и полировка UI/UX

## 📌 Краткое описание

Реализация **Фазы 7 (Real AI Integration, Resilient Execution, Wire Reconnection & UI Polish)**: интеграция реального генеративного AI-пайплайна на базе Google Gemini 3.6 Flash и нейросетевого диффузионного движка Flux/SDXL, устранение таймаутов и ошибок Google API, реализация топологического резолвера повторного запуска (Smart Subtree Retry), защита от DoS и коллизий портов (Single-Input Constraint), интерактивное переподключение проводов и исправление UI шторки пресетов.

---

## 🎯 Реализованные требования и улучшения

- **AI-01: Гибридный конвейер генерации реального AI**:
  - Быстрый промпт-инжиниринг через `gemini-3.6-flash:generateContent` (обогащение промпта стилистическими атрибутами, ракурсом, светом и правилами пресетов за 1–2 сек с лимитом 8 сек).
  - Высокоскоростной нейросетевой диффузионный рендеринг реальных растровых изображений (Flux.1 / SDXL) за 2–3 секунды.
  - Устранение 60-секундных таймаутов и ошибок `503 High Demand` / `404 Not Found` за счет мгновенного отказоустойчивого фолбэка.
- **AI-02: Универсальная загрузка окружения и автодетекция ключей**:
  - Поддержка чтения `.env` по всем возможным путям (`backend/.env`, root `.env`, `.env.local`).
  - Автоматическая очистка API-ключей от случайных пробелов и кавычек (`sanitizeKey`).
- **DAG-01: Интеллектуальный повтор нод (Smart Subtree Retry)**:
  - Метод `DagScheduler.resolveRetryNodeIds`: при повторе ноды пересчитывается только целевая нода, незавершенные предки и зависимые потомки.
  - Поддержка `allNodesData` для синхронизации измененных пользователем промптов на холсте прямо в процессе ретрая.
  - Очистка устаревшей истории событий в SSE-потоке (`resetHistoryForRetry`) и фильтрация по параметру `since`.
- **GRAPH-01: Валидация портов и лимиты нагрузки (DoS Prevention)**:
  - Правило `MULTIPLE_INPUTS_TO_PORT`: запрет подключения нескольких проводов в один входной порт с автозаменой на фронтенде.
  - Константы `WORKFLOW_LIMITS` и декораторы `@ArrayMaxSize` (максимум 30 нод, 60 ребер, 10 генераторов).
- **UI-01: Интерактивное управление связями на канвасе**:
  - Компонент `CustomWorkflowEdge` с широким хитбоксом (28px), кнопкой `[×]` быстрого удаления на середине линии и неоновой подсветкой.
  - Поддержка жеста отключения провода перетаскиванием в пустое пространство канваса (`onReconnectEnd`).
- **UI-02: Исправление шторки пресетов и мгновенная загрузка**:
  - Устранение бага одновременного отображения двух чекбоксов в `PresetDrawer` (строгая привязка к `selectedPreset`).
  - Набор `DEFAULT_PRESETS` на фронтенде для нулевой задержки отображения библиотек стилей при старте.

---

## 🏗 Архитектурные изменения

### 1. Backend (`backend/src/modules/ai/adapters/google-gemini.adapter.ts`)

- Замена медленной генерации XML кода на двухэтапный конвейер: **LLM Prompt Refining (Gemini 3.6 Flash)** $\rightarrow$ **Neural Diffusion (Flux/SDXL)**.
- Конвертация результирующих изображений в Data URI (`data:image/jpeg;base64,...`) для мгновенного отображения на фронтенде и независимости от сторонних хостингов.

### 2. Runs & DAG Scheduler (`backend/src/modules/runs/engine/dag-scheduler.ts`)

- Добавлен алгоритм обхода графа вверх (`getUpstreamNodeIds`) и вниз (`getDownstreamNodeIds`) для точечного расчета затронутых волн выполнения.

### 3. Frontend Canvas & Drawer (`Frontend/src/widgets/`)

- Интеграция `CustomWorkflowEdge` в ReactFlow.
- Синхронизация состояния выбранного пресета с активной нодой при открытии `PresetDrawer`.

---

## 📦 Включенные файлы

| Модуль / Слой    | Путь к файлу                                                        | Описание                                                      |
| ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| **AI Engine**    | `backend/src/modules/ai/adapters/google-gemini.adapter.ts`          | Гибридный адаптер Gemini 3.6 Flash + Flux diffusion           |
|                  | `backend/src/modules/ai/services/ai-gateway.service.ts`             | Логика автодетекции ключей и роутинга провайдеров             |
|                  | `backend/src/core/config/app.config.ts`                             | Санитайзинг ключей окружения                                  |
|                  | `backend/src/app.module.ts`                                         | Универсальный поиск `.env` файлов                             |
| **Runs & DAG**   | `backend/src/modules/runs/engine/dag-scheduler.ts`                  | Алгоритм `resolveRetryNodeIds` и расчет зависимых поддеревьев |
|                  | `backend/src/modules/runs/engine/dag-scheduler.spec.ts`             | Unit-тесты изолированного повтора нод                         |
|                  | `backend/src/modules/runs/services/runs.service.ts`                 | Синхронизация `allNodesData` при ретрае                       |
|                  | `backend/src/modules/runs/services/run-events.service.ts`           | Очистка истории событий ретрая и поддержка `since`            |
|                  | `backend/src/modules/runs/controllers/runs.controller.ts`           | Контроллер с эндпоинтом `/runs/:id/retry/:nodeId`             |
| **Workflows**    | `backend/src/modules/workflows/services/graph-validator.service.ts` | Валидатор Single-Input портов и лимитов нагрузки              |
|                  | `backend/src/modules/workflows/domain/workflow-limits.constants.ts` | Константы ограничений сложности графа                         |
| **Frontend UI**  | `Frontend/src/widgets/preset-drawer/ui/preset-drawer.tsx`           | Исправление одиночного выбора пресета в шторке                |
|                  | `Frontend/src/entities/preset/model/default-presets.ts`             | Встроенные пресеты для быстрого старта фронтенда              |
|                  | `Frontend/src/entities/node/ui/custom-edge.tsx`                     | Кастомное ребро с кнопкой удаления `[×]`                      |
|                  | `Frontend/src/entities/node/lib/node-connection-helpers.ts`         | Хелперы автозамены входящих соединений                        |
|                  | `Frontend/src/entities/node/lib/node-retry-service.ts`              | Клиент изолированного перезапуска нод                         |
|                  | `Frontend/src/widgets/workflow-canvas/ui/workflow-canvas.tsx`       | Интерактивный канвас с поддержкой переподключения проводов    |
| **Документация** | `docs/phases/07-real-ai-resilience-canvas-polish.md`                | Данное описание фазы                                          |

---

## 🧪 Результаты автоматического тестирования и сборки

```text
 PASS  src/modules/runs/engine/dag-scheduler.spec.ts
 PASS  src/modules/ai/domain/prompt-builder.spec.ts
 PASS  src/modules/workflows/services/graph-validator.service.spec.ts

Test Suites: 3 passed, 3 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        ~14 s
Ran all test suites.

✓ Backend build: nest build (0 errors)
✓ Frontend build: tsc && vite build (0 errors, 1845 modules transformed)
```

---

## 🔍 Как проверить

```bash
# 1. Запуск unit-тестов
npm run test:backend

# 2. Проверка сборки монорепозитория
npm run build

# 3. Запуск dev-сервера и проверка в браузере
npm run dev
```
