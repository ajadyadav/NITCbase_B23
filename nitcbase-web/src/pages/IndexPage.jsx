import { useState } from 'react';
import { executeCommand } from '../api/nitcbase';
import CommandOutput from '../components/CommandOutput';

export default function IndexPage() {
  const [activeTab, setActiveTab] = useState('create');
  const [outputs, setOutputs] = useState([]);

  // Create Index
  const [createTable, setCreateTable] = useState('');
  const [createAttr, setCreateAttr] = useState('');

  // Drop Index
  const [dropTable, setDropTable] = useState('');
  const [dropAttr, setDropAttr] = useState('');

  async function runCommand(cmd) {
    if (!cmd) return;
    const result = await executeCommand(cmd);
    setOutputs(prev => [{ command: cmd, output: result.output, type: result.type }, ...prev]);
  }

  const createCmd = createTable && createAttr
    ? `CREATE INDEX ON ${createTable}.${createAttr}`
    : '';

  const dropCmd = dropTable && dropAttr
    ? `DROP INDEX ON ${dropTable}.${dropAttr}`
    : '';

  return (
    <div>
      <div className="page-header">
        <h1>🔗 Indexes</h1>
        <p>Create and drop B+ tree indexes on relation attributes for faster query performance.</p>
      </div>

      <div className="tabs" id="index-tabs">
        <button
          className={`tab${activeTab === 'create' ? ' active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Index
        </button>
        <button
          className={`tab${activeTab === 'drop' ? ' active' : ''}`}
          onClick={() => setActiveTab('drop')}
        >
          Drop Index
        </button>
      </div>

      <div className="grid-2">
        <div>
          {activeTab === 'create' && (
            <div className="card" id="create-index-card">
              <div className="card-header">
                <div className="card-icon green">🌳</div>
                <div>
                  <div className="card-title">Create B+ Tree Index</div>
                  <div className="card-subtitle">Build an index on an attribute for fast lookups</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Table Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Students"
                    value={createTable}
                    onChange={e => setCreateTable(e.target.value)}
                    id="create-index-table"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Attribute Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. name"
                    value={createAttr}
                    onChange={e => setCreateAttr(e.target.value)}
                    id="create-index-attr"
                  />
                </div>
              </div>

              {createCmd && (
                <div>
                  <div className="command-preview-label">Generated Command</div>
                  <div className="command-preview">
                    <span className="command-preview-text">{createCmd}</span>
                  </div>
                </div>
              )}

              <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => runCommand(createCmd)}
                  disabled={!createCmd}
                  id="create-index-btn"
                >
                  🌳 Create Index
                </button>
              </div>
            </div>
          )}

          {activeTab === 'drop' && (
            <div className="card" id="drop-index-card">
              <div className="card-header">
                <div className="card-icon pink">🗑️</div>
                <div>
                  <div className="card-title">Drop Index</div>
                  <div className="card-subtitle">Remove an existing B+ tree index</div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Table Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Students"
                    value={dropTable}
                    onChange={e => setDropTable(e.target.value)}
                    id="drop-index-table"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Attribute Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. name"
                    value={dropAttr}
                    onChange={e => setDropAttr(e.target.value)}
                    id="drop-index-attr"
                  />
                </div>
              </div>

              {dropCmd && (
                <div>
                  <div className="command-preview-label">Generated Command</div>
                  <div className="command-preview">
                    <span className="command-preview-text">{dropCmd}</span>
                  </div>
                </div>
              )}

              <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
                <button
                  className="btn btn-danger btn-lg"
                  onClick={() => runCommand(dropCmd)}
                  disabled={!dropCmd}
                  id="drop-index-btn"
                >
                  🗑️ Drop Index
                </button>
              </div>
            </div>
          )}

          {/* Info card */}
          <div className="card" style={{ marginTop: 'var(--sp-6)' }}>
            <div className="card-header">
              <div className="card-icon blue">💡</div>
              <div>
                <div className="card-title">About B+ Tree Indexes</div>
                <div className="card-subtitle">How indexes work in NITCbase</div>
              </div>
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <p>NITCbase uses <strong style={{ color: 'var(--text-primary)' }}>B+ Tree</strong> data structures for indexing.</p>
              <ul style={{ paddingLeft: 'var(--sp-5)', marginTop: 'var(--sp-2)' }}>
                <li>Internal nodes hold up to <strong style={{ color: 'var(--accent-blue)' }}>100 keys</strong></li>
                <li>Leaf nodes hold up to <strong style={{ color: 'var(--accent-blue)' }}>63 keys</strong></li>
                <li>Indexes speed up <strong style={{ color: 'var(--accent-purple)' }}>SELECT ... WHERE</strong> queries</li>
                <li>The table must be <strong style={{ color: 'var(--success)' }}>opened</strong> before creating an index</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <CommandOutput entries={outputs} />
        </div>
      </div>
    </div>
  );
}
