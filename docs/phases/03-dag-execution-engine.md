# PR #3: Phase 3 — DAG Движок исполнения, волновой планировщик Кана и Real-Time SSE

## 📌 Краткое описание

Реализация **Фазы 3 (DAG Workflow Engine, Topological Scheduling & Real-Time SSE)**: ядро системы оркестрации графов. Включает валидацию DAG на отсутствие циклов и совместимость портов (`GraphValidatorService`), волновой планировщик на основе **алгоритма Кана** (`DagScheduler`), параллельное исполнение независимых веток через `Promise.allSettled()`, транзитивный перезапуск поддерева сбоя (**Subtree Retry**) и потоковую передачу статусов нод в реальном времени через **Server-Sent Events (SSE)**.

---

## 🎯 Реализованные требования

- **DAG-01**: Валидация направленного ациклического графа (DAG) с отклонением циклических связей (`POST /api/v1/workflows/validate`).
- **DAG-02**: Строгая проверка совместимости типизированных портов (`text` $\rightarrow$ `text`, `image` $\rightarrow$ `image`).
- **DAG-03**: Алгоритм Кана для топологической сортировки и разбиения нод на независимые волны исполнения.
- **DAG-04**: Параллельное выполнение нод в рамках одной волны (`Generate A` и `Generate B` выполняются одновременно).
- **DAG-05**: Пайпинг данных между исходящими портами родительских нод и входящими портами дочерних.
- **DAG-06 / JOB-01 / JOB-02**: Полный жизненный цикл статусов ноды: `idle` $\rightarrow$ `queued` $\rightarrow$ `running` $\rightarrow$ `success` | `error`.
- **STREAM-01**: Потоковый эндпоинт Server-Sent Events (`GET /api/v1/runs/:id/events`) на базе RxJS Subject.
- **JOB-03**: Таргетированный перезапуск сбойной ноды и её зависимого поддерева (`POST /api/v1/runs/:id/retry/:nodeId`) без повторного запуска успешных родительских веток.

---

## 🏗 Ключевые архитектурные решения

### 1. Планировщик волн на алгоритме Кана (`DagScheduler`)

- Вычисляет входящие степени вершин (`in-degree`).
- Формирует список волн исполнения `NodeExecutionWave[]`: все ноды с `in-degree == 0` объединяются в текущую волну, а после их завершения счетчики зависимостей уменьшаются для формирования следующей волны.
- Гарантирует максимальный параллелизм (братские ветки исполняются одновременно).

### 2. Движок параллельного исполнения (`GraphExecutionEngine`)

- Исполняет ноды внутри каждой волны параллельно с помощью `Promise.allSettled()`.
- Автоматически пробрасывает выходные данные (`outputPayload`) родительских нод во входные слоты (`inputPayload`) дочерних согласно карте связей (`edges`).

### 3. Механизм точечного перезапуска поддерева (`Subtree Retry`)

- Вычисляет транзитивное замыкание (ориентированное поддерево потомков) от выбранной упавшей ноды.
- Сбрасывает статусы только затронутых нод в `idle` / `queued` и повторно запускает их с сохранением результатов ранее выполненных родительских нод.

### 4. Потоковая передача событий (`RunEventsService` & SSE)

- Использует RxJS `Subject` для непрерывной трансляции событий: `run:started`, `node:queued`, `node:running`, `node:completed`, `node:failed`, `run:completed`.

---

## 📦 Включенные файлы

| Модуль            | Путь к файлу                                                             | Описание                                           |
| ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------- |
| **Workflows**     | `backend/src/modules/workflows/domain/port-type.enum.ts`                 | Enum типов портов (`text`, `image`)                |
|                   | `backend/src/modules/workflows/domain/node.entity.ts`                    | Сущность ноды графа и схемы портов                 |
|                   | `backend/src/modules/workflows/domain/edge.entity.ts`                    | Сущность ребра (связи) графа                       |
|                   | `backend/src/modules/workflows/domain/workflow.entity.ts`                | Сущность графа воркфлоу                            |
|                   | `backend/src/modules/workflows/dto/*`                                    | DTO валидации и создания воркфлоу                  |
|                   | `backend/src/modules/workflows/services/graph-validator.service.ts`      | Валидатор циклов и портов графа                    |
|                   | `backend/src/modules/workflows/services/graph-validator.service.spec.ts` | Jest unit-тесты валидатора графов                  |
|                   | `backend/src/modules/workflows/services/workflows.service.ts`            | Сервис управления воркфлоу                         |
|                   | `backend/src/modules/workflows/controllers/workflows.controller.ts`      | REST контроллер `/api/v1/workflows`                |
|                   | `backend/src/modules/workflows/workflows.module.ts`                      | Модуль воркфлоу NestJS                             |
| **Runs & Engine** | `backend/src/modules/runs/domain/run-status.enum.ts`                     | Enum статусов выполнения (`idle`, `running`, etc.) |
|                   | `backend/src/modules/runs/domain/node-job.entity.ts`                     | Сущность состояния задачи ноды                     |
|                   | `backend/src/modules/runs/domain/run.entity.ts`                          | Сущность выполнения графа                          |
|                   | `backend/src/modules/runs/dto/*`                                         | DTO запуска, ответа и ретрая                       |
|                   | `backend/src/modules/runs/engine/dag-scheduler.ts`                       | Алгоритм Кана и волновой планировщик               |
|                   | `backend/src/modules/runs/engine/dag-scheduler.spec.ts`                  | Jest unit-тесты топологического планировщика       |
|                   | `backend/src/modules/runs/engine/node-executor.ts`                       | Обработчик логики исполнения каждого типа ноды     |
|                   | `backend/src/modules/runs/services/graph-execution.engine.ts`            | Асинхронный волновой движок исполнения             |
|                   | `backend/src/modules/runs/services/run-events.service.ts`                | SSE сервис потоковой рассылки событий              |
|                   | `backend/src/modules/runs/services/runs.service.ts`                      | Оркестратор запусков и логики Subtree Retry        |
|                   | `backend/src/modules/runs/controllers/runs.controller.ts`                | REST и SSE контроллер `/api/v1/runs`               |
|                   | `backend/src/modules/runs/runs.module.ts`                                | Модуль запусков NestJS                             |
| **Документация**  | `docs/phases/03-dag-execution-engine.md`                                 | Данное описание фазы                               |

---

## 🔍 Как проверить

```bash
# 1. Запуск unit-тестов DAG планировщика и валидатора
cd backend && npm test -- src/modules/runs/engine/dag-scheduler.spec.ts src/modules/workflows/services/graph-validator.service.spec.ts

# 2. Проверка валидации циклического графа через API (вернет ошибку валидации с циклом)
curl -X POST http://localhost:4000/api/v1/workflows/validate -H "Content-Type: application/json" -d "{\"nodes\":[],\"edges\":[]}"
```
