import { useState } from 'react';
import { executeCommand, buildSelectCmd } from '../api/nitcbase';
import CommandOutput from '../components/CommandOutput';

const OPERATORS = ['=', '<', '<=', '>', '>=', '!='];

export default function QueryPage() {
  const [outputs, setOutputs] = useState([]);

  // Select form state
  const [selectMode, setSelectMode] = useState('all'); // 'all' | 'attrs'
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [attrs, setAttrs] = useState('');
  const [useWhere, setUseWhere] = useState(false);
  const [whereAttr, setWhereAttr] = useState('');
  const [whereOp, setWhereOp] = useState('=');
  const [whereVal, setWhereVal] = useState('');

  async function runCommand(cmd) {
    if (!cmd) return;
    const result = await executeCommand(cmd);
    setOutputs(prev => [{ command: cmd, output: result.output, type: result.type }, ...prev]);
  }

  const attrPart = selectMode === 'all' ? '*' : attrs;
  const cmd = buildSelectCmd({
    attrs: attrPart,
    source,
    target,
    whereAttr: useWhere ? whereAttr : null,
    whereOp: useWhere ? whereOp : null,
    whereVal: useWhere ? whereVal : null,
  });

  return (
    <div>
      <div className="page-header">
        <h1>🔍 Query</h1>
        <p>Build SELECT queries with optional attribute selection and WHERE conditions.</p>
      </div>

      <div className="grid-2">
        <div className="card" id="query-builder-card">
          <div className="card-header">
            <div className="card-icon blue">📊</div>
            <div>
              <div className="card-title">Select Query Builder</div>
              <div className="card-subtitle">Build and execute SELECT statements</div>
            </div>
          </div>

          {/* Select Mode */}
          <div className="form-group">
            <label className="form-label">Select Mode</label>
            <div className="tabs" style={{ marginBottom: 0 }}>
              <button
                className={`tab${selectMode === 'all' ? ' active' : ''}`}
                onClick={() => setSelectMode('all')}
              >
                All Attributes (*)
              </button>
              <button
                className={`tab${selectMode === 'attrs' ? ' active' : ''}`}
                onClick={() => setSelectMode('attrs')}
              >
                Specific Attributes
              </button>
            </div>
          </div>

          {/* Specific attributes */}
          {selectMode === 'attrs' && (
            <div className="form-group">
              <label className="form-label">Attributes</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. name, age, grade"
                value={attrs}
                onChange={e => setAttrs(e.target.value)}
                id="query-attrs"
              />
              <div className="form-hint">Comma-separated list of attribute names</div>
            </div>
          )}

          {/* Source & Target */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source Relation</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Students"
                value={source}
                onChange={e => setSource(e.target.value)}
                id="query-source"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Target Relation</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Result"
                value={target}
                onChange={e => setTarget(e.target.value)}
                id="query-target"
              />
            </div>
          </div>

          {/* WHERE Toggle */}
          <div className="form-group">
            <label
              className="form-label"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}
              onClick={() => setUseWhere(!useWhere)}
            >
              <span style={{
                width: 18,
                height: 18,
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${useWhere ? 'var(--accent-blue)' : 'var(--border-primary)'}`,
                background: useWhere ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                transition: 'all 0.15s',
                flexShrink: 0,
              }}>
                {useWhere ? '✓' : ''}
              </span>
              Add WHERE Condition
            </label>
          </div>

          {/* WHERE fields */}
          {useWhere && (
            <div className="form-row-3" style={{ animation: 'slideIn 0.2s ease-out' }}>
              <div className="form-group">
                <label className="form-label">Attribute</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. age"
                  value={whereAttr}
                  onChange={e => setWhereAttr(e.target.value)}
                  id="query-where-attr"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Operator</label>
                <select
                  className="form-select"
                  value={whereOp}
                  onChange={e => setWhereOp(e.target.value)}
                  id="query-where-op"
                >
                  {OPERATORS.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Value</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. 18"
                  value={whereVal}
                  onChange={e => setWhereVal(e.target.value)}
                  id="query-where-val"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {cmd && (
            <div>
              <div className="command-preview-label">Generated Command</div>
              <div className="command-preview">
                <span className="command-preview-text">{cmd}</span>
              </div>
            </div>
          )}

          <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => runCommand(cmd)}
              disabled={!cmd}
              id="run-query-btn"
            >
              🚀 Execute Query
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSource(''); setTarget(''); setAttrs('');
                setUseWhere(false); setWhereAttr(''); setWhereOp('='); setWhereVal('');
                setSelectMode('all');
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        <div>
          <CommandOutput entries={outputs} />
        </div>
      </div>
    </div>
  );
}
