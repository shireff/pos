import React, { useEffect, useState } from 'react';
import { useT, InsightCard, type InsightCardProps } from '@packages/ui-components';
import { aiInsightsApi } from '../../lib/api/ai';

export function AIInsightsPage(): React.ReactElement {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<InsightCardProps[]>([]);
  const [group, setGroup] = useState('all');

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

  const filtered = group === 'all' ? insights : insights.filter((i) => i.type === group);
  const types = Array.from(new Set(insights.map((i) => i.type)));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('ai.insights.title')}</h1>
          <p className="page-subtitle">{t('ai.insights.subtitle')}</p>
        </div>
      </div>
      <div className="ai-insights__filters">
        <button type="button" className={`btn btn-sm ${group === 'all' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGroup('all')}>
          {t('ai.insights.filterAll')}
        </button>
        {types.map((type) => (
          <button
            key={type}
            type="button"
            className={`btn btn-sm ${group === type ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setGroup(type)}
          >
            {type}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="spinner-wrap">
          <span className="spinner" />
        </div>
      ) : (
        <div className="ai-insights__grid">
          {filtered.map((insight) => (
            <InsightCard key={insight.id} {...insight} />
          ))}
        </div>
      )}
    </div>
  );
}
