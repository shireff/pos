# Phase 15 — AI Services Files

## Domain

```
packages/domain/ai-insights/src/entities/prediction.entity.ts
packages/domain/ai-insights/src/entities/anomaly.entity.ts
packages/domain/ai-insights/src/entities/health-score-snapshot.entity.ts
packages/domain/ai-insights/src/entities/recommendation.entity.ts
packages/domain/ai-insights/src/value-objects/insight-feedback.vo.ts
packages/domain/ai-insights/src/domain-events/ai-prediction-generated.event.ts
packages/domain/ai-insights/src/domain-events/ai-anomaly-detected.event.ts
packages/domain/ai-insights/src/domain-events/ai-recommendation-generated.event.ts
packages/domain/ai-insights/src/domain-events/ai-insight-feedback-submitted.event.ts
packages/domain/ai-insights/README.md
```

## Application

```
packages/application/ai-insights/src/query-assistant/query-assistant.command.ts
packages/application/ai-insights/src/query-assistant/query-assistant.handler.ts
packages/application/ai-insights/src/query-assistant/query-assistant.handler.test.ts
packages/application/ai-insights/src/accept-recommendation/accept-recommendation.command.ts
packages/application/ai-insights/src/accept-recommendation/accept-recommendation.handler.ts
packages/application/ai-insights/src/accept-recommendation/accept-recommendation.handler.test.ts
packages/application/ai-insights/src/submit-feedback/submit-feedback.command.ts
packages/application/ai-insights/src/submit-feedback/submit-feedback.handler.ts
```

## Infrastructure — AI Gateway

```
packages/infrastructure/ai-clients/src/ai-gateway.ts
packages/infrastructure/ai-clients/src/ai-provider.interface.ts
packages/infrastructure/ai-clients/src/providers/local-model.provider.ts
packages/infrastructure/ai-clients/src/providers/nara-router.provider.ts
packages/infrastructure/ai-clients/src/query-classifier.ts
packages/infrastructure/ai-clients/src/context-assembler.ts
packages/infrastructure/ai-clients/src/response-validator.ts
packages/infrastructure/ai-clients/src/ai-gateway.test.ts
```

## Backend Workers

```
apps/backend/src/workers/ai-batch/sales-prediction.job.ts
apps/backend/src/workers/ai-batch/inventory-prediction.job.ts
apps/backend/src/workers/ai-batch/fraud-detection.job.ts
apps/backend/src/workers/ai-batch/health-score.job.ts
apps/backend/src/workers/ai-batch/dead-product-detection.job.ts
apps/backend/src/workers/ai-batch/customer-segmentation.job.ts
apps/backend/src/workers/ai-batch/anomaly-detection.job.ts
apps/backend/src/workers/ai-batch/cash-flow-prediction.job.ts
apps/backend/src/workers/ai-batch/branch-comparison.job.ts
apps/backend/src/workers/ai-batch/supplier-invoice-ocr.job.ts
```

## API

```
apps/backend/src/http/ai/ai.controller.ts
apps/backend/src/http/ai/ai.schemas.ts
apps/backend/src/http/ai/ai.controller.test.ts
```

## Database Collections

```
packages/infrastructure/mongodb/schemas/ai_predictions.schema.json
packages/infrastructure/mongodb/schemas/ai_anomalies.schema.json
packages/infrastructure/mongodb/schemas/ai_health_score_snapshots.schema.json
packages/infrastructure/mongodb/schemas/ai_insight_feedback.schema.json
packages/infrastructure/mongodb/migrations/015_ai_schema.ts
```

## UI Components

```
packages/ui-components/src/ai/AIAssistantChat.tsx
packages/ui-components/src/ai/AIAssistantChat.test.tsx
packages/ui-components/src/ai/StoreHealthDashboard.tsx
packages/ui-components/src/ai/StoreHealthDashboard.test.tsx
packages/ui-components/src/ai/HealthSubScoreCard.tsx
packages/ui-components/src/ai/PredictionCard.tsx
packages/ui-components/src/ai/FraudAlertBanner.tsx
packages/ui-components/src/ai/RecommendationCard.tsx
packages/ui-components/src/ai/AISourceBadge.tsx
```

## Desktop Features

```
apps/desktop/src/features/ai-insights/AIInsightsPage.tsx
apps/desktop/src/features/ai-insights/AssistantPage.tsx
```
