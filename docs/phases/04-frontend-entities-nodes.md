# PR #4: Phase 4 — Кастомные ноды React Flow, типизированные порты и Zustand Store

## 📌 Краткое описание
Реализация **Фазы 4 (Frontend Entities, Custom Nodes & State Management)**: разработка слоя сущностей (entities) по методологии FSD, полного набора визуальных кастомных нод React Flow с цветовой кодировкой типизированных портов (`text` vs `image`), валидатора связей на клиенте в реальном времени (`port-validator.ts`), а также глобального хранилища графа и состояния выполнения на **Zustand** (`useWorkflowStore`).

---

## 🎯 Реализованные требования
- **CANVAS-02**: Кастомные визуальные карточки нод (`Prompt`, `ImageInput`, `GenerateImage`, `EditImage`, `Result`) с индикацией статуса, времени исполнения и портами.
- **CANVAS-03**: Строгая клиентская валидация соединений портов — предотвращение недопустимых связей (например, `image` $\leftrightarrow$ `text`) непосредственно во время перетаскивания связей на холсте.

---

## 🏗 Ключевые архитектурные решения

### 1. Составной компонент `BaseNode` и карточки нод
- Единый контейнер `BaseNode` обеспечивает консистентный UI: заголовок с иконкой, кнопку удаления ноды, бейдж текущего статуса (`NodeStatusBadge`) и время выполнения в миллисекундах.
- **Типизированные порты:**
  - Синий цвет (`#3B82F6` / `text`): Порты текстовых промптов и инструкций.
  - Фиолетовый цвет (`#A855F7` / `image`): Порты входящих/исходящих изображений.
- Узкоспециализированные ноды:
  - `PromptNode`: Многострочный ввод текстового промпта.
  - `ImageInputNode`: Загрузка / ввод URL исходного изображения с превью.
  - `GenerateImageNode`: Прием текстового промпта, опционального референса, выбор AI-провайдера и привязка пресета.
  - `EditImageNode`: Слияние исходного изображения и текстовой инструкции редактирования.
  - `ResultNode`: Отображение финального сгенерированного изображения с возможностью скачивания и полноэкранного просмотра.

### 2. Клиентский валидатор портов (`port-validator.ts`)
- Проверяет типы хэндлов при событии `isValidConnection` в React Flow.
- Блокирует соединение несовместимых типов данных еще до отправки графа на бэкенд.

### 3. Хранилище графа на Zustand (`useWorkflowStore`)
- Управляет состоянием вершин (`nodes`) и ребер (`edges`).
- Реактивно обновляет статусы нод (`idle` $\rightarrow$ `queued` $\rightarrow$ `running` $\rightarrow$ `success` | `error`) и полезную нагрузку (`outputPayload`) при получении событий SSE.
- Предоставляет методы для добавления, перемещения, удаления нод и применения пресетов.

### 4. Сущности `preset` и `run`
- `preset`: `PresetCard` для визуализации доступных стилей и клиент `presetApi`.
- `run`: `NodeStatusBadge` и `RunStatusBadge` с пульсирующими анимациями и клиент `runApi`.

---

## 📦 Включенные файлы

| Слой / Модуль | Путь к файлу | Описание |
|---|---|---|
| **Graph Validation** | `Frontend/src/shared/lib/graph/port-validator.ts` | Клиентская валидация соединений портов React Flow |
| **Entities / Node** | `Frontend/src/entities/node/model/types.ts` | Типы данных нод, портов и состояний |
| | `Frontend/src/entities/node/model/use-workflow-store.ts` | Zustand хранилище графа воркфлоу |
| | `Frontend/src/entities/node/ui/base-node.tsx` | Базовый UI-контейнер ноды с портами и статусом |
| | `Frontend/src/entities/node/ui/prompt-node.tsx` | Нода текстового ввода промпта |
| | `Frontend/src/entities/node/ui/image-input-node.tsx` | Нода ввода/загрузки изображения |
| | `Frontend/src/entities/node/ui/generate-image-node.tsx` | Нода генерации Text-to-Image с пресетами |
| | `Frontend/src/entities/node/ui/edit-image-node.tsx` | Нода редактирования Image-to-Image |
| | `Frontend/src/entities/node/ui/result-node.tsx` | Нода вывода результата с превью |
| | `Frontend/src/entities/node/index.ts` | Публичный интерфейс сущности нод |
| **Entities / Preset** | `Frontend/src/entities/preset/api/preset-api.ts` | API-клиент работы с пресетами |
| | `Frontend/src/entities/preset/ui/preset-card.tsx` | Карточка пресета с превью и бейджами |
| | `Frontend/src/entities/preset/index.ts` | Публичный интерфейс сущности пресетов |
| **Entities / Run** | `Frontend/src/entities/run/api/run-api.ts` | API-клиент запуска и ретрая графа |
| | `Frontend/src/entities/run/ui/node-status-badge.tsx` | Бейдж статуса ноды (idle, running, etc.) |
| | `Frontend/src/entities/run/ui/run-status-badge.tsx` | Бейдж общего статуса выполнения |
| | `Frontend/src/entities/run/index.ts` | Публичный интерфейс сущности выполнения |
| **Документация** | `docs/phases/04-frontend-entities-nodes.md` | Данное описание фазы |

---

## 🔍 Как проверить
```bash
# 1. Проверка компиляции TypeScript типов
cd Frontend && npm run build
```
