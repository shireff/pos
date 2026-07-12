import { useT } from '../i18n';

export interface AISourceBadgeProps {
  source: string;
}

export function AISourceBadge({ source }: AISourceBadgeProps) {
  const t = useT();
  let label: string;
  let className: string;

  if (source === 'local') {
    label = t('ai.source.local');
    className = 'ai-source-badge--local';
  } else if (source.startsWith('nara_router:')) {
    const model = source.split(':')[1] ?? source;
    label = `${t('ai.source.cloud')}: ${model}`;
    className = 'ai-source-badge--cloud';
  } else {
    label = source;
    className = 'ai-source-badge--unknown';
  }

  return <span className={`ai-source-badge ${className}`}>{label}</span>;
}
