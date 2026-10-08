import type { TimelineEvent } from '../data/mockData';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  return (
    <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {events.map((event, index) => (
        <div className="timeline-item" key={event.id} style={{ display: 'flex', gap: '12px', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '16px' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor:
                  event.variant === 'success'
                    ? 'var(--status-success)'
                    : event.variant === 'warning'
                      ? 'var(--status-warning)'
                      : 'var(--primary-blue)',
                marginTop: '5px',
                flexShrink: 0,
              }}
            />
            {index < events.length - 1 && (
              <div style={{ width: '1px', flex: 1, backgroundColor: 'var(--border-color)', marginTop: '6px' }} />
            )}
          </div>
          <div style={{ flex: 1, paddingBottom: index < events.length - 1 ? '10px' : '0' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {event.title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {event.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
