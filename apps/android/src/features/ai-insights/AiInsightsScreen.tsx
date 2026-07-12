import React, { useEffect, useState } from 'react';
import { useT, InsightCard, type InsightCardProps } from '@packages/ui-components';
import { aiInsightsApi } from '../../lib/api/ai';

export function AiInsightsScreen(): React.ReactElement {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightCardProps[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await aiInsightsApi.list();
        setInsights(
          data.map((item) => ({
            id: item.id,
            type: item.type,
            headline: item.headline,
            narrative: item.narrative,
            source: item.source,
            generatedAt: item.generatedAt,
          })),
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{t('ai.insights.title')}</h1>
      </div>
      {loading ? (
        <div className="spinner-wrap">
          <span className="spinner" />
        </div>
      ) : (
        <div className="ai-insights__list">
          {insights.map((insight) => (
            <InsightCard key={insight.id} {...insight} />
          ))}
        </div>
      )}
    </div>
  );
}
