const button = {
  padding: '8px 16px',
  font: '600 13px Inter, sans-serif',
  borderRadius: 6,
  border: '1px solid #111827',
  cursor: 'pointer',
};

function ApplyBar({ dirty, status, onApply, onReset }) {
  const saving = status.state === 'saving';
  let message = status.message;
  let color = status.state === 'error' ? '#dc2626' : '#15803d';
  if (dirty && status.state !== 'error') {
    message = 'Unapplied changes';
    color = '#b45309';
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={onApply}
        style={{ ...button, color: '#fff', background: '#111827', opacity: !dirty || saving ? 0.4 : 1 }}
      >
        Apply
      </button>
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={onReset}
        style={{ ...button, color: '#111827', background: '#fff', opacity: !dirty || saving ? 0.4 : 1 }}
      >
        Discard
      </button>
      <span style={{ fontSize: 13, color }}>{message}</span>
    </div>
  );
}

export default ApplyBar;
