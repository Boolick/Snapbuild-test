# PR #1: Phase 1 — Базовая архитектура, Core NestJS, FSD UI-Kit и Docker Compose

## 📌 Краткое описание

Реализация **Фазы 1 (Project Foundation & Architecture Scaffolding)**: закладывается производственный фундамент монорепозитория, контейнеризация через Docker Compose, ядро бэкенда на NestJS со строгой валидацией и Swagger-документацией, а также базовые слои фронтенда по методологии Feature-Sliced Design (FSD v2.1) с готовым UI-Kit.

---

## 🎯 Реализованные требования

- **CORE-01**: Монорепозиторий и скрипты сборки/запуска.
- **CORE-02**: Контейнеризация с `docker-compose.yml` и multi-stage Dockerfile для backend и frontend.
- **CORE-03**: Ядро NestJS с глобальной обработкой ошибок, логированием, валидацией DTO и Swagger UI (`/api/docs`).
- **CORE-04**: Фронтенд на React 18 + Vite + TailwindCSS с архитектурой FSD и дизайн-системой в `shared/ui`.

---

## 🏗 Ключевые архитектурные решения

### 1. Бэкенд (NestJS Core)

- **Стандартизация API:** Единый формат ответа `ApiResponse<T>` (`success`, `data`, `error`, `timestamp`, `path`).
- **Безопасность и валидация:** `StrictValidationPipe` с автоматическим отклонением недопустимых полей (`forbidNonWhitelisted: true`).
- **Глобальная фильтрация:** `HttpExceptionFilter` и `AllExceptionsFilter` перехватывают любые непредвиденные сбои и формируют безопасные JSON-ошибки без утечки внутренних стектрейсов.
- **Интерактивная документация:** Swagger OpenAPI 3.0 доступен на эндпоинте `/api/docs`.
- **Health Check:** `GET /api/v1/health` для мониторинга жизнеспособности сервиса.

### 2. Фронтенд (Feature-Sliced Design)

- **Иерархия слоев:** `app` $\rightarrow$ `pages` $\rightarrow$ `widgets` $\rightarrow$ `features` $\rightarrow$ `entities` $\rightarrow$ `shared` (строгое правило импорта только сверху вниз).
- **Слой `shared`:**
  - `shared/api`: Типизированные клиенты `apiClient` (Axios) и `subscribeToEventStream` (SSE).
  - `shared/types`: Базовые типы API-ответов и схемы графов/портов.
  - `shared/ui`: Независимый UI-Kit примитивов (`Button`, `Badge`, `Card`, `Modal`, `Input`, `Textarea`, `Select`, `Spinner`), стилизованный TailwindCSS с поддержкой темной темы.

### 3. Инфраструктура (Docker)

- `docker-compose.yml` объединяет бэкенд (порт 4000) и фронтенд на базе Nginx (порт 3000) с единой сетью и автоматическим перезапуском контейнеров.

---

## 📦 Включенные файлы

| Модуль / Слой      | Путь к файлу                            | Описание                                                        |
| ------------------ | --------------------------------------- | --------------------------------------------------------------- |
| **Инфраструктура** | `docker-compose.yml`                    | Оркестрация backend и frontend контейнеров                      |
| **Backend Core**   | `backend/Dockerfile`                    | Multi-stage сборка NestJS приложения                            |
|                    | `backend/src/main.ts`                   | Точка входа, подключение пайпов, фильтров и Swagger             |
|                    | `backend/src/app.module.ts`             | Корневой модуль бэкенда                                         |
|                    | `backend/src/core/config/app.config.ts` | Типизированная конфигурация окружения                           |
|                    | `backend/src/core/filters/*`            | Глобальные фильтры исключений                                   |
|                    | `backend/src/core/interceptors/*`       | Интерцепторы логирования и трансформации ответов                |
|                    | `backend/src/core/pipes/*`              | Пайп строгой валидации входящих DTO                             |
|                    | `backend/src/core/swagger/*`            | Конфигурация OpenAPI / Swagger                                  |
|                    | `backend/src/common/interfaces/*`       | Интерфейс стандартизированного API-ответа                       |
|                    | `backend/src/common/utils/*`            | Утилита генерации ID                                            |
|                    | `backend/src/modules/health/*`          | Контроллер и модуль `/api/v1/health`                            |
| **Frontend Base**  | `Frontend/Dockerfile`                   | Multi-stage Dockerfile со сборкой и Nginx                       |
|                    | `Frontend/nginx.conf`                   | Конфигурация Nginx для SPA-роутинга и проксирования             |
|                    | `Frontend/src/main.tsx`                 | Точка входа React SPA                                           |
|                    | `Frontend/src/index.css`                | Глобальные стили TailwindCSS и анимации                         |
|                    | `Frontend/src/app/App.tsx`              | Корневой компонент приложения                                   |
|                    | `Frontend/src/app/providers/*`          | Провайдеры контекста приложения                                 |
|                    | `Frontend/src/shared/config/*`          | Константы и переменные окружения                                |
|                    | `Frontend/src/shared/lib/utils/*`       | Утилита объединения классов `cn()` (clsx + tailwind-merge)      |
|                    | `Frontend/src/shared/types/*`           | TypeScript интерфейсы API и моделей данных                      |
|                    | `Frontend/src/shared/api/*`             | Базовые клиенты HTTP (Axios) и SSE потоков                      |
|                    | `Frontend/src/shared/ui/*`              | Полный набор базовых UI-компонентов (Button, Card, Modal и др.) |
| **Документация**   | `docs/phases/01-foundation.md`          | Данное описание фазы                                            |

---

## 🔍 Как проверить

```bash
# 1. Запуск бэкенда и проверка Swagger
cd backend && npm run start:dev
# Открыть: http://localhost:4000/api/docs и http://localhost:4000/api/v1/health

# 2. Запуск фронтенда
cd ../Frontend && npm run dev
# Открыть: http://localhost:3000 (или порт Vite)

# 3. Запуск через Docker Compose
docker compose up --build
```
