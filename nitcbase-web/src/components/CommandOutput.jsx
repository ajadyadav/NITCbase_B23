import { useState } from 'react';

/**
 * Displays NITCbase command output with syntax-aware coloring.
 * Shows the executed command and its result.
 */
export default function CommandOutput({ entries = [] }) {
  const [copied, setCopied] = useState(null);

  function classifyLine(text) {
    const lower = text.toLowerCase();
    if (lower.includes('error')) return 'error';
    if (lower.includes('warning')) return 'warning';
    if (lower.includes('successfully') || lower.includes('success')) return 'success';
    if (lower.startsWith('#') || lower.startsWith('$')) return 'command';
    return 'info';
  }

  function copyCommand(cmd, idx) {
    navigator.clipboard.writeText(cmd);
    setCopied(idx);
    setTimeout(() => setCopied(null), 1500);
  }

  if (entries.length === 0) {
    return (
      <div className="command-output">
        <div className="command-output-header">
          <span className="command-output-title">
            📟 Output
          </span>
        </div>
        <div className="command-output-body">
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">No output yet</div>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
              Execute a command to see results here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="command-output">
      <div className="command-output-header">
        <span className="command-output-title">
          📟 Output
          <span className="badge badge-info" style={{ marginLeft: 8 }}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
          </span>
        </span>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => entries.length > 0 && copyCommand(
            entries.map(e => `# ${e.command}\n${e.output}`).join('\n\n'),
            'all'
          )}
          title="Copy all output"
        >
          {copied === 'all' ? '✓ Copied' : '📋 Copy All'}
        </button>
      </div>
      <div className="command-output-body">
        {entries.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: '0.75rem' }}>
            <div
              className="output-line command"
              style={{ cursor: 'pointer', opacity: 0.8 }}
              onClick={() => copyCommand(entry.command, idx)}
              title="Click to copy command"
            >
              {entry.command}
              {copied === idx && (
                <span style={{ marginLeft: 8, fontSize: 'var(--fs-xs)', color: 'var(--success)' }}>
                  ✓ Copied
                </span>
              )}
            </div>
            {entry.output.split('\n').map((line, lineIdx) => (
              <div key={lineIdx} className={`output-line ${classifyLine(line)}`}>
                {line}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
