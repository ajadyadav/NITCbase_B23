import { useState } from 'react';
import { executeCommand, buildInsertCmd } from '../api/nitcbase';
import CommandOutput from '../components/CommandOutput';

export default function InsertPage() {
  const [outputs, setOutputs] = useState([]);
  const [tableName, setTableName] = useState('');
  const [values, setValues] = useState(['', '']);

  async function runCommand(cmd) {
    if (!cmd) return;
    const result = await executeCommand(cmd);
    setOutputs(prev => [{ command: cmd, output: result.output, type: result.type }, ...prev]);
  }

  function addValue() {
    setValues(prev => [...prev, '']);
  }

  function removeValue(idx) {
    if (values.length <= 1) return;
    setValues(prev => prev.filter((_, i) => i !== idx));
  }

  function updateValue(idx, val) {
    setValues(prev => prev.map((v, i) => (i === idx ? val : v)));
  }

  const cmd = buildInsertCmd(tableName, values);

  function handleInsertAndClear() {
    runCommand(cmd);
    // Clear only values, keep table name
    setValues(values.map(() => ''));
  }

  return (
    <div>
      <div className="page-header">
        <h1>➕ Insert</h1>
        <p>Insert records into a relation. Provide the table name and attribute values.</p>
      </div>

      <div className="grid-2">
        <div className="card" id="insert-card">
          <div className="card-header">
            <div className="card-icon green">📥</div>
            <div>
              <div className="card-title">Insert Record</div>
              <div className="card-subtitle">Add a new row into a relation</div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Table Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. Students"
              value={tableName}
              onChange={e => setTableName(e.target.value)}
              id="insert-table-name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Values</label>
            <div className="attr-rows">
              {values.map((val, idx) => (
                <div className="attr-row" key={idx}>
                  <span className="attr-row-number">{idx + 1}</span>
                  <input
                    className="form-input"
                    type="text"
                    placeholder={`Value ${idx + 1}`}
                    value={val}
                    onChange={e => updateValue(idx, e.target.value)}
                  />
                  <button
                    className="btn btn-icon btn-danger"
                    onClick={() => removeValue(idx)}
                    title="Remove value"
                    disabled={values.length <= 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn btn-sm btn-secondary"
              onClick={addValue}
              style={{ marginTop: 'var(--sp-3)' }}
            >
              + Add Value
            </button>
          </div>

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
              id="insert-btn"
            >
              📥 Insert Record
            </button>
            <button
              className="btn btn-success"
              onClick={handleInsertAndClear}
              disabled={!cmd}
              title="Insert and clear values for another entry"
            >
              📥 Insert & Clear
            </button>
          </div>
        </div>

        <div>
          <CommandOutput entries={outputs} />

          {/* Bulk insert info */}
          <div className="card" style={{ marginTop: 'var(--sp-6)' }}>
            <div className="card-header">
              <div className="card-icon purple">📄</div>
              <div>
                <div className="card-title">Bulk Insert from CSV</div>
                <div className="card-subtitle">Insert multiple records at once</div>
              </div>
            </div>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-3)' }}>
              To insert multiple records from a CSV file, use the Terminal and run:
            </p>
            <div className="command-preview" style={{ margin: 0 }}>
              <span className="command-preview-text">
                INSERT INTO tablename VALUES FROM filename.csv
              </span>
            </div>
            <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 'var(--sp-2)' }}>
              Place the CSV file in <code>NITCbase/Files/Input_Files/</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
