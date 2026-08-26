# PR #2: Phase 2 — Домен пресетов, PromptBuilder и гексагональный AI Gateway

## 📌 Краткое описание

Реализация **Фазы 2 (Preset Domain & AI Provider Integration Engine)**: внедрение первой сущности предметной области `Preset` со встроенной коллекцией стилей, разработка пайплайна слияния промптов `PromptBuilder` (с unit-тестами), а также создание многопровайдерного гексагонального шлюза `AiGatewayService` с поддержкой Mock AI, OpenAI (DALL-E 3), Stability AI и Replicate.

---

## 🎯 Реализованные требования

- **PRESET-01**: Моделирование `Preset` как первоклассной сущности бэкенда со всеми параметрами генерации (префиксы, суффиксы, негативные промпты, шаги диффузии, референсные изображения).
- **PRESET-02**: REST эндпоинты `GET /api/v1/presets` и `GET /api/v1/presets/:id`.
- **AI-01**: Архитектура портов и адаптеров (`AiProvider`) для бесшовного добавления генеративных нейросетей.
- **AI-02**: Безопасный `AiGatewayService` — API-ключи провайдеров хранятся исключительно на сервере и не утекают клиенту.
- **AI-03**: Офлайн-адаптер `MockAiAdapter` с реалистичной задержкой и триггером ошибок `#fail` для тестирования сценариев повтора (retry).
- **AI-04**: Продакшен-адаптеры для OpenAI DALL-E 3, Stability AI и Replicate.

---

## 🏗 Ключевые архитектурные решения

### 1. Доменная модель `Preset`

- Сущность инкапсулирует визуальные стили: _Premium 3D_, _Cyberpunk Neon_, _Anime Fantasy_, _Cinematic Photo_.
- Поддерживает композитные правила: автоматическое дополнение `promptPrefix` / `promptSuffix`, подмешивание `negativePrompt`, переопределение `guidanceScale` и `numInferenceSteps`.

### 2. Пайплайн `PromptBuilder`

- Детерминированно объединяет пользовательский текст, параметры выбранного пресета и входящие референсные изображения от родительских нод.
- Покрыт изолированными Jest unit-тестами ([`prompt-builder.spec.ts`](file:///G:/projects/Snapbuild-test/backend/src/modules/ai/domain/prompt-builder.spec.ts)).

### 3. Гексагональный AI Gateway (Ports & Adapters)

- **Port:** Интерфейс [`AiProvider`](file:///G:/projects/Snapbuild-test/backend/src/modules/ai/ports/ai-provider.interface.ts) с методами `generateImage(request)` и `editImage(request)`.
- **Adapters:**
  - `MockAiAdapter`: Генерация тематических изображений без расхода API-кредитов, симуляция задержки 1–2 сек, поддержка ключевого слова `#fail` для тестирования сбоев.
  - `OpenAiDalleAdapter`: Интеграция с OpenAI Images API (DALL-E 3 для генерации, DALL-E 2 для редактирования).
  - `StabilityAiAdapter`: Интеграция с REST API Stability AI (Stable Diffusion XL / 3).
  - `ReplicateAdapter`: Интеграция с моделями Replicate (Flux.1 / SDXL).
- **Gateway:** `AiGatewayService` определяет активный провайдер на основе конфигурации и делегирует запросы.

---

## 📦 Включенные файлы

| Модуль           | Путь к файлу                                                    | Описание                                            |
| ---------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| **Presets**      | `backend/src/modules/presets/domain/preset.entity.ts`           | Доменная сущность пресета                           |
|                  | `backend/src/modules/presets/dto/preset.dto.ts`                 | DTO для сериализации и валидации пресетов           |
|                  | `backend/src/modules/presets/services/presets.service.ts`       | Сервис выборки и сидинга предустановленных пресетов |
|                  | `backend/src/modules/presets/controllers/presets.controller.ts` | REST контроллер `/api/v1/presets`                   |
|                  | `backend/src/modules/presets/presets.module.ts`                 | Модуль пресетов NestJS                              |
| **AI Domain**    | `backend/src/modules/ai/domain/ai-request.interface.ts`         | Интерфейс запроса к ИИ-провайдеру                   |
|                  | `backend/src/modules/ai/domain/ai-response.interface.ts`        | Интерфейс ответа ИИ-провайдера                      |
|                  | `backend/src/modules/ai/domain/prompt-builder.ts`               | Логика слияния промптов и параметров пресета        |
|                  | `backend/src/modules/ai/domain/prompt-builder.spec.ts`          | Unit-тесты для PromptBuilder (Jest)                 |
| **AI Gateway**   | `backend/src/modules/ai/ports/ai-provider.interface.ts`         | Hexagonal Port интерфейс провайдера                 |
|                  | `backend/src/modules/ai/adapters/mock-ai.adapter.ts`            | Офлайн Mock адаптер с триггером `#fail`             |
|                  | `backend/src/modules/ai/adapters/openai-dalle.adapter.ts`       | Адаптер OpenAI DALL-E 3                             |
|                  | `backend/src/modules/ai/adapters/stability-ai.adapter.ts`       | Адаптер Stability AI                                |
|                  | `backend/src/modules/ai/adapters/replicate.adapter.ts`          | Адаптер Replicate                                   |
|                  | `backend/src/modules/ai/services/ai-gateway.service.ts`         | Сервис-маршрутизатор запросов генерации             |
|                  | `backend/src/modules/ai/ai.module.ts`                           | Модуль интеграции ИИ NestJS                         |
| **Документация** | `docs/phases/02-preset-ai-engine.md`                            | Данное описание фазы                                |

---

## 🔍 Как проверить

```bash
# 1. Запуск unit-тестов PromptBuilder
cd backend && npm test -- src/modules/ai/domain/prompt-builder.spec.ts

# 2. Проверка эндпоинта пресетов
curl http://localhost:4000/api/v1/presets
```
