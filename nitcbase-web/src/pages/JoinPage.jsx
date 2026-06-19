import { useState } from 'react';
import { executeCommand, buildJoinCmd } from '../api/nitcbase';
import CommandOutput from '../components/CommandOutput';

export default function JoinPage() {
  const [outputs, setOutputs] = useState([]);

  // Join form state
  const [selectMode, setSelectMode] = useState('all');
  const [source1, setSource1] = useState('');
  const [source2, setSource2] = useState('');
  const [target, setTarget] = useState('');
  const [attr1, setAttr1] = useState('');
  const [attr2, setAttr2] = useState('');
  const [attrs, setAttrs] = useState('');

  async function runCommand(cmd) {
    if (!cmd) return;
    const result = await executeCommand(cmd);
    setOutputs(prev => [{ command: cmd, output: result.output, type: result.type }, ...prev]);
  }

  const attrPart = selectMode === 'all' ? '*' : attrs;
  const cmd = buildJoinCmd({ attrs: attrPart, source1, source2, target, attr1, attr2 });

  return (
    <div>
      <div className="page-header">
        <h1>🔀 Join</h1>
        <p>Perform equi-join operations between two relations on matching attributes.</p>
      </div>

      <div className="grid-2">
        <div className="card" id="join-card">
          <div className="card-header">
            <div className="card-icon indigo">🔀</div>
            <div>
              <div className="card-title">Equi-Join Builder</div>
              <div className="card-subtitle">Join two relations on a common attribute</div>
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

          {selectMode === 'attrs' && (
            <div className="form-group">
              <label className="form-label">Attributes</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. name, course, grade"
                value={attrs}
                onChange={e => setAttrs(e.target.value)}
                id="join-attrs"
              />
              <div className="form-hint">Comma-separated list of attribute names from both relations</div>
            </div>
          )}

          {/* Source Relations */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source Relation 1</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Students"
                value={source1}
                onChange={e => setSource1(e.target.value)}
                id="join-source1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Source Relation 2</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Courses"
                value={source2}
                onChange={e => setSource2(e.target.value)}
                id="join-source2"
              />
            </div>
          </div>

          {/* Target */}
          <div className="form-group">
            <label className="form-label">Target Relation</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Enrollment"
              value={target}
              onChange={e => setTarget(e.target.value)}
              id="join-target"
            />
          </div>

          {/* Join Attributes */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--sp-4)',
            marginBottom: 'var(--sp-4)',
          }}>
            <div style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              color: 'var(--accent-indigo)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 'var(--sp-3)',
            }}>
              WHERE (Join Condition)
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div className="form-hint" style={{ marginBottom: 4 }}>
                  {source1 || 'Relation1'}.attribute
                </div>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. studentId"
                  value={attr1}
                  onChange={e => setAttr1(e.target.value)}
                  id="join-attr1"
                />
              </div>

              <span style={{
                color: 'var(--accent-indigo)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 'var(--fs-lg)',
                paddingTop: 18,
              }}>
                =
              </span>

              <div style={{ flex: 1, minWidth: 120 }}>
                <div className="form-hint" style={{ marginBottom: 4 }}>
                  {source2 || 'Relation2'}.attribute
                </div>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. studentId"
                  value={attr2}
                  onChange={e => setAttr2(e.target.value)}
                  id="join-attr2"
                />
              </div>
            </div>
          </div>

          {/* Preview */}
          {cmd && (
            <div>
              <div className="command-preview-label">Generated Command</div>
              <div className="command-preview">
                <span className="command-preview-text" style={{ fontSize: 'var(--fs-xs)' }}>{cmd}</span>
              </div>
            </div>
          )}

          <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => runCommand(cmd)}
              disabled={!cmd}
              id="join-btn"
            >
              🔀 Execute Join
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSource1(''); setSource2(''); setTarget('');
                setAttr1(''); setAttr2(''); setAttrs('');
                setSelectMode('all');
              }}
            >
              🔄 Reset
            </button>
          </div>
        </div>

        <div>
          <CommandOutput entries={outputs} />

          {/* Info card */}
          <div className="card" style={{ marginTop: 'var(--sp-6)' }}>
            <div className="card-header">
              <div className="card-icon blue">💡</div>
              <div>
                <div className="card-title">Join Notes</div>
                <div className="card-subtitle">Important things to know</div>
              </div>
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <ul style={{ paddingLeft: 'var(--sp-5)' }}>
                <li>NITCbase supports <strong style={{ color: 'var(--text-primary)' }}>equi-join</strong> only (= operator)</li>
                <li>Both source relations must be <strong style={{ color: 'var(--success)' }}>opened</strong> first</li>
                <li>The join attribute of the second relation is <strong style={{ color: 'var(--warning)' }}>excluded</strong> from the target</li>
                <li>An <strong style={{ color: 'var(--accent-blue)' }}>index</strong> on the join attribute of Relation 2 speeds up the join</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
