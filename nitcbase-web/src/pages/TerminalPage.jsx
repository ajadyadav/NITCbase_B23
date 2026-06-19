import { useState, useRef, useEffect } from 'react';
import { executeCommand } from '../api/nitcbase';

export default function TerminalPage() {
  const [history, setHistory] = useState([
    { type: 'info', text: 'Welcome to NITCbase Interactive Console' },
    { type: 'info', text: 'Type HELP for a list of commands, or EXIT to quit.' },
    { type: 'info', text: '─'.repeat(50) },
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    setIsExecuting(true);
    setCmdHistory(prev => [cmd, ...prev]);
    setHistoryIdx(-1);
    setInput('');

    // Add the command line to history
    setHistory(prev => [...prev, { type: 'command', text: cmd }]);

    // Execute
    const result = await executeCommand(cmd);

    // Add output lines
    const lines = result.output.split('\n').filter(Boolean);
    setHistory(prev => [
      ...prev,
      ...lines.map(line => ({
        type: result.type === 'error' ? 'error' : classifyOutputLine(line),
        text: line,
      })),
    ]);

    setIsExecuting(false);
  }

  function classifyOutputLine(text) {
    const lower = text.toLowerCase();
    if (lower.includes('error')) return 'error';
    if (lower.includes('warning')) return 'warning';
    if (lower.includes('successfully') || lower.includes('success')) return 'success';
    return 'info';
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(cmdHistory[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  }

  function clearTerminal() {
    setHistory([
      { type: 'info', text: 'Terminal cleared.' },
      { type: 'info', text: '─'.repeat(50) },
    ]);
  }

  return (
    <div>
      <div className="page-header">
        <h1>⌨️ Terminal</h1>
        <p>
          Interactive command-line interface for NITCbase. Type commands directly
          and see results in real-time.
        </p>
      </div>

      <div className="terminal" id="terminal">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="terminal-dot red"></span>
            <span className="terminal-dot yellow"></span>
            <span className="terminal-dot green"></span>
          </div>
          <span className="terminal-title">nitcbase — interactive console</span>
          <div style={{ marginLeft: 'auto' }}>
            <button className="btn btn-sm btn-secondary" onClick={clearTerminal}>
              🗑️ Clear
            </button>
          </div>
        </div>

        <div className="terminal-body" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
          {history.map((entry, idx) => (
            <div key={idx} className={`output-line ${entry.type}`}>
              {entry.type === 'command' ? (
                <>
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{'# '}</span>
                  <span style={{ color: 'var(--accent-purple)' }}>{entry.text}</span>
                </>
              ) : (
                entry.text
              )}
            </div>
          ))}
          {isExecuting && (
            <div className="output-line info" style={{ opacity: 0.6 }}>
              ⏳ Executing...
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="terminal-input-row">
          <span className="terminal-prompt">#</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a NITCbase command..."
            disabled={isExecuting}
            autoFocus
            id="terminal-input"
          />
          <button type="submit" className="btn btn-sm btn-primary" disabled={isExecuting}>
            Run ⏎
          </button>
        </form>
      </div>

      <div style={{ marginTop: 'var(--sp-6)' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-icon blue">💡</div>
            <div>
              <div className="card-title">Quick Reference</div>
              <div className="card-subtitle">Common NITCbase commands</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--sp-3)' }}>
            {[
              { cmd: 'CREATE TABLE Students(name STR, age NUM)', desc: 'Create a table' },
              { cmd: 'OPEN TABLE Students', desc: 'Open a table' },
              { cmd: 'INSERT INTO Students VALUES (John, 20)', desc: 'Insert a record' },
              { cmd: 'SELECT * FROM Students INTO Result', desc: 'Select all records' },
              { cmd: 'CREATE INDEX ON Students.name', desc: 'Create an index' },
              { cmd: 'HELP', desc: 'Show all commands' },
            ].map((item, i) => (
              <div
                key={i}
                className="command-preview"
                style={{ cursor: 'pointer', margin: 0 }}
                onClick={() => setInput(item.cmd)}
                title={`Click to load: ${item.cmd}`}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: 2, fontFamily: 'var(--font-sans)' }}>
                    {item.desc}
                  </div>
                  <div className="command-preview-text" style={{ fontSize: 'var(--fs-xs)' }}>
                    {item.cmd}
                  </div>
                </div>
                <span style={{ fontSize: 'var(--fs-xs)', opacity: 0.5 }}>▶</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
