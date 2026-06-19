import { useState } from 'react';
import { executeCommand, buildCreateTableCmd } from '../api/nitcbase';
import CommandOutput from '../components/CommandOutput';

export default function TablesPage() {
  const [activeTab, setActiveTab] = useState('create');
  const [outputs, setOutputs] = useState([]);

  // Create Table state
  const [createName, setCreateName] = useState('');
  const [attributes, setAttributes] = useState([
    { name: '', type: 'STR' },
    { name: '', type: 'NUM' },
  ]);

  // Drop Table state
  const [dropName, setDropName] = useState('');

  // Open/Close state
  const [openName, setOpenName] = useState('');
  const [closeName, setCloseName] = useState('');

  // Rename Table
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');

  // Rename Column
  const [renColTable, setRenColTable] = useState('');
  const [renColFrom, setRenColFrom] = useState('');
  const [renColTo, setRenColTo] = useState('');

  async function runCommand(cmd) {
    if (!cmd) return;
    const result = await executeCommand(cmd);
    setOutputs(prev => [{ command: cmd, output: result.output, type: result.type }, ...prev]);
  }

  function addAttribute() {
    setAttributes(prev => [...prev, { name: '', type: 'STR' }]);
  }

  function removeAttribute(idx) {
    if (attributes.length <= 1) return;
    setAttributes(prev => prev.filter((_, i) => i !== idx));
  }

  function updateAttribute(idx, field, value) {
    setAttributes(prev =>
      prev.map((attr, i) => (i === idx ? { ...attr, [field]: value } : attr))
    );
  }

  const createCmd = buildCreateTableCmd(createName, attributes);

  const tabs = [
    { id: 'create', label: 'Create Table' },
    { id: 'drop', label: 'Drop Table' },
    { id: 'open', label: 'Open / Close' },
    { id: 'rename', label: 'Rename' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>📋 Tables</h1>
        <p>Create, drop, open, close, and rename tables (relations) in your NITCbase database.</p>
      </div>

      <div className="tabs" id="tables-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`tab${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid-2">
        <div>
          {/* CREATE TABLE */}
          {activeTab === 'create' && (
            <div className="card" id="create-table-card">
              <div className="card-header">
                <div className="card-icon blue">🏗️</div>
                <div>
                  <div className="card-title">Create Table</div>
                  <div className="card-subtitle">Define a new relation with attributes</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Table Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Students"
                  value={createName}
                  onChange={e => setCreateName(e.target.value)}
                  id="create-table-name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Attributes</label>
                <div className="attr-rows">
                  {attributes.map((attr, idx) => (
                    <div className="attr-row" key={idx}>
                      <span className="attr-row-number">{idx + 1}</span>
                      <input
                        className="form-input"
                        type="text"
                        placeholder="Attribute name"
                        value={attr.name}
                        onChange={e => updateAttribute(idx, 'name', e.target.value)}
                      />
                      <select
                        className="form-select"
                        value={attr.type}
                        onChange={e => updateAttribute(idx, 'type', e.target.value)}
                        style={{ maxWidth: 100 }}
                      >
                        <option value="STR">STR</option>
                        <option value="NUM">NUM</option>
                      </select>
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => removeAttribute(idx)}
                        title="Remove attribute"
                        disabled={attributes.length <= 1}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={addAttribute}
                  style={{ marginTop: 'var(--sp-3)' }}
                >
                  + Add Attribute
                </button>
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
                  id="create-table-btn"
                >
                  🚀 Create Table
                </button>
              </div>
            </div>
          )}

          {/* DROP TABLE */}
          {activeTab === 'drop' && (
            <div className="card" id="drop-table-card">
              <div className="card-header">
                <div className="card-icon pink">🗑️</div>
                <div>
                  <div className="card-title">Drop Table</div>
                  <div className="card-subtitle">Permanently delete a relation</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Table Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="e.g. Students"
                  value={dropName}
                  onChange={e => setDropName(e.target.value)}
                  id="drop-table-name"
                />
              </div>

              {dropName && (
                <div>
                  <div className="command-preview-label">Generated Command</div>
                  <div className="command-preview">
                    <span className="command-preview-text">DROP TABLE {dropName}</span>
                  </div>
                </div>
              )}

              <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
                <button
                  className="btn btn-danger btn-lg"
                  onClick={() => runCommand(`DROP TABLE ${dropName}`)}
                  disabled={!dropName}
                  id="drop-table-btn"
                >
                  🗑️ Drop Table
                </button>
              </div>
            </div>
          )}

          {/* OPEN / CLOSE TABLE */}
          {activeTab === 'open' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
              <div className="card" id="open-table-card">
                <div className="card-header">
                  <div className="card-icon green">📂</div>
                  <div>
                    <div className="card-title">Open Table</div>
                    <div className="card-subtitle">Load a relation into the cache</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Table Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Students"
                    value={openName}
                    onChange={e => setOpenName(e.target.value)}
                    id="open-table-name"
                  />
                </div>

                {openName && (
                  <div>
                    <div className="command-preview-label">Generated Command</div>
                    <div className="command-preview">
                      <span className="command-preview-text">OPEN TABLE {openName}</span>
                    </div>
                  </div>
                )}

                <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
                  <button
                    className="btn btn-success btn-lg"
                    onClick={() => runCommand(`OPEN TABLE ${openName}`)}
                    disabled={!openName}
                    id="open-table-btn"
                  >
                    📂 Open Table
                  </button>
                </div>
              </div>

              <div className="card" id="close-table-card">
                <div className="card-header">
                  <div className="card-icon purple">📁</div>
                  <div>
                    <div className="card-title">Close Table</div>
                    <div className="card-subtitle">Release a relation from the cache</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Table Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Students"
                    value={closeName}
                    onChange={e => setCloseName(e.target.value)}
                    id="close-table-name"
                  />
                </div>

                {closeName && (
                  <div>
                    <div className="command-preview-label">Generated Command</div>
                    <div className="command-preview">
                      <span className="command-preview-text">CLOSE TABLE {closeName}</span>
                    </div>
                  </div>
                )}

                <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => runCommand(`CLOSE TABLE ${closeName}`)}
                    disabled={!closeName}
                    id="close-table-btn"
                  >
                    📁 Close Table
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RENAME TABLE / COLUMN */}
          {activeTab === 'rename' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
              <div className="card" id="rename-table-card">
                <div className="card-header">
                  <div className="card-icon indigo">✏️</div>
                  <div>
                    <div className="card-title">Rename Table</div>
                    <div className="card-subtitle">Change a relation's name</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Current Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Students"
                      value={renameFrom}
                      onChange={e => setRenameFrom(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. Pupils"
                      value={renameTo}
                      onChange={e => setRenameTo(e.target.value)}
                    />
                  </div>
                </div>

                {renameFrom && renameTo && (
                  <div>
                    <div className="command-preview-label">Generated Command</div>
                    <div className="command-preview">
                      <span className="command-preview-text">
                        ALTER TABLE RENAME {renameFrom} TO {renameTo}
                      </span>
                    </div>
                  </div>
                )}

                <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => runCommand(`ALTER TABLE RENAME ${renameFrom} TO ${renameTo}`)}
                    disabled={!renameFrom || !renameTo}
                  >
                    ✏️ Rename Table
                  </button>
                </div>
              </div>

              <div className="card" id="rename-column-card">
                <div className="card-header">
                  <div className="card-icon purple">🏷️</div>
                  <div>
                    <div className="card-title">Rename Column</div>
                    <div className="card-subtitle">Change an attribute's name</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Table Name</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="e.g. Students"
                    value={renColTable}
                    onChange={e => setRenColTable(e.target.value)}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Current Column Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. name"
                      value={renColFrom}
                      onChange={e => setRenColFrom(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Column Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. fullname"
                      value={renColTo}
                      onChange={e => setRenColTo(e.target.value)}
                    />
                  </div>
                </div>

                {renColTable && renColFrom && renColTo && (
                  <div>
                    <div className="command-preview-label">Generated Command</div>
                    <div className="command-preview">
                      <span className="command-preview-text">
                        ALTER TABLE RENAME {renColTable} COLUMN {renColFrom} TO {renColTo}
                      </span>
                    </div>
                  </div>
                )}

                <div className="btn-group" style={{ marginTop: 'var(--sp-5)' }}>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => runCommand(`ALTER TABLE RENAME ${renColTable} COLUMN ${renColFrom} TO ${renColTo}`)}
                    disabled={!renColTable || !renColFrom || !renColTo}
                  >
                    🏷️ Rename Column
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <CommandOutput entries={outputs} />
        </div>
      </div>
    </div>
  );
}
