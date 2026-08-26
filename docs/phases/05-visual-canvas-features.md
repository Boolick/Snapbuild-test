# PR #5: Phase 5 — Интерактивный холст, шторка пресетов, инспектор и 1-Click сценарии

## 📌 Краткое описание
Реализация **Фазы 5 (Interactive Visual Canvas, Preset Drawer & 1-Click Scenarios)**: сборка полноценного интерактивного рабочего пространства редактора графов на базе React Flow. Включает плавающую палитру нод (`CanvasNodePalette`), верхний тулбар управления (`CanvasToolbar`), шторку выбора пресетов (`PresetDrawer`), инспектор свойств нод (`NodeInspector`), хук подписки на SSE-стрим выполнения (`useExecuteWorkflow`) и загрузчики готовых тестовых сценариев в 1 клик (**Scenario 1, Scenario 2, Scenario 3**).

---

## 🎯 Реализованные требования
- **CANVAS-01**: Интерактивный визуальный холст с масштабированием (zoom/pan), сеткой, миникартой и добавлением нод через drag-and-drop.
- **CANVAS-04**: Шторка выбора пресетов (`PresetDrawer`) для быстрого выбора стиля генерации и назначения на ноду `GenerateImage`.
- **CANVAS-05**: Инспектор свойств выбранной ноды (`NodeInspector`) с просмотром входных/выходных данных и параметров.
- **CANVAS-06**: Готовые шаблоны тестовых сценариев из ТЗ с загрузкой в один клик:
  - **Сценарий 1 (Text-to-Image):** `Prompt` $\rightarrow$ `Generate Image` $\rightarrow$ `Result`.
  - **Сценарий 2 (Image Edit):** `Image Input` + `Prompt` $\rightarrow$ `Edit Image` $\rightarrow$ `Result`.
  - **Сценарий 3 (Parallel Branching):** `Prompt` $\rightarrow$ `Generate A` & `Generate B` $\rightarrow$ `Result A` & `Result B`.

---

## 🏗 Ключевые архитектурные решения

### 1. Виджет `WorkflowCanvas`
- Интегрирует компоненты `@xyflow/react` (`Controls`, `MiniMap`, `Background`).
- Предоставляет плавающую панель палитры (`CanvasNodePalette`) для перетаскивания и добавления любых типов нод.
- Обрабатывает выделение нод для открытия бокового инспектора.

### 2. Управление выполнением и SSE-подписка (`useExecuteWorkflow`)
- Выполняет валидацию графа перед запуском (`POST /api/v1/workflows/validate`).
- Запускает выполнение графа (`POST /api/v1/runs`) и открывает Server-Sent Events соединение к `/api/v1/runs/:id/events`.
- При получении событий обновляет бейджи и полезную нагрузку нод прямо на карточках в реальном времени.
- Поддерживает вызов точечного перезапуска (`retryNode(nodeId)`) при сбое.

### 3. Инспектор ноды (`NodeInspector`) и шторка пресетов (`PresetDrawer`)
- `NodeInspector`: Отображает детальную информацию по активной ноде (ID, тип, статус, время выполнения, JSON входящих и исходящих данных, превью изображения).
- `PresetDrawer`: Загружает каталог пресетов через `presetApi` и позволяет в один клик применить выбранный стиль к выделенной ноде генерации.

### 4. 1-Click сценарии (`templates.ts` & `TemplateSelector`)
- Демонстрирует 100% покрытие сценариев из ТЗ.
- Очищает холст и загружает преднастроенный граф с валидными координатами, связями и параметрами.

---

## 📦 Включенные файлы

| Слой / Модуль | Путь к файлу | Описание |
|---|---|---|
| **Widgets / Canvas** | `Frontend/src/widgets/workflow-canvas/ui/workflow-canvas.tsx` | Основной компонент холста React Flow |
| | `Frontend/src/widgets/workflow-canvas/ui/canvas-toolbar.tsx` | Верхняя панель действий с кнопками запуска |
| | `Frontend/src/widgets/workflow-canvas/ui/canvas-node-palette.tsx` | Плавающая палитра добавления новых нод |
| | `Frontend/src/widgets/workflow-canvas/index.ts` | Публичный интерфейс виджета холста |
| **Widgets / Drawer & Inspector** | `Frontend/src/widgets/preset-drawer/ui/preset-drawer.tsx` | Выдвижная панель выбора стилей/пресетов |
| | `Frontend/src/widgets/preset-drawer/index.ts` | Публичный интерфейс шторки пресетов |
| | `Frontend/src/widgets/node-inspector/ui/node-inspector.tsx` | Панель инспектора свойств и вывода ноды |
| | `Frontend/src/widgets/node-inspector/index.ts` | Публичный интерфейс инспектора нод |
| **Features / Execution & Templates** | `Frontend/src/features/execute-workflow/model/use-execute-workflow.ts` | Хук запуска воркфлоу и подписки на SSE стрим |
| | `Frontend/src/features/execute-workflow/ui/run-button.tsx` | Кнопка запуска выполнения с индикатором статуса |
| | `Frontend/src/features/execute-workflow/index.ts` | Экспорт фичи выполнения |
| | `Frontend/src/features/workflow-templates/lib/templates.ts` | Конфигурация сценариев 1, 2, 3 из ТЗ |
| | `Frontend/src/features/workflow-templates/ui/template-selector.tsx` | Селектор 1-click шаблонов сценариев |
| | `Frontend/src/features/workflow-templates/index.ts` | Экспорт фичи шаблонов |
| **Pages** | `Frontend/src/pages/workflow-editor/ui/workflow-editor-page.tsx` | Главная страница редактора воркфлоу |
| | `Frontend/src/pages/workflow-editor/index.ts` | Экспорт страницы |
| **Документация** | `docs/phases/05-visual-canvas-features.md` | Данное описание фазы |

---

## 🔍 Как проверить
```bash
# Запуск фронтенда и проверка в браузере
cd Frontend && npm run dev
# 1. Загрузить "Сценарий 3 (Параллельные ветки)" через кнопку в тулбаре
# 2. Нажать "Запустить граф" -> наблюдать одновременную генерацию двух веток
# 3. Открыть инспектор ноды кликом на карточку
```
