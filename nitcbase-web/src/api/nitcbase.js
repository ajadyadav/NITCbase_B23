/**
 * NITCbase API Client
 * 
 * Handles communication with the C++ backend API server.
 * Falls back to local simulation when the backend is not running.
 */

const API_BASE = 'http://localhost:8800/api';

/**
 * Check if the backend API server is running
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Execute a NITCbase command via the backend API
 * @param {string} command - The NITCbase command string
 * @returns {{ output: string, status: number, type: 'success' | 'error' }}
 */
export async function executeCommand(command) {
  try {
    const res = await fetch(`${API_BASE}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();
    return {
      output: data.output || '',
      status: data.status || 0,
      type: data.status === 0 ? 'success' : 'error',
    };
  } catch (err) {
    // Backend not running — return a simulation result
    return simulateCommand(command);
  }
}

/**
 * Simulate command execution locally (when backend is not available).
 * This generates realistic output for the command.
 */
function simulateCommand(command) {
  const cmd = command.trim().toUpperCase();
  const original = command.trim();

  // CREATE TABLE
  if (cmd.startsWith('CREATE TABLE')) {
    const match = original.match(/CREATE\s+TABLE\s+(\w+)/i);
    const name = match ? match[1] : 'unknown';
    return {
      output: `Relation ${name} created successfully`,
      status: 0,
      type: 'success',
    };
  }

  // DROP TABLE
  if (cmd.startsWith('DROP TABLE')) {
    const match = original.match(/DROP\s+TABLE\s+(\w+)/i);
    const name = match ? match[1] : 'unknown';
    return {
      output: `Relation ${name} deleted successfully`,
      status: 0,
      type: 'success',
    };
  }

  // OPEN TABLE
  if (cmd.startsWith('OPEN TABLE')) {
    const match = original.match(/OPEN\s+TABLE\s+(\w+)/i);
    const name = match ? match[1] : 'unknown';
    return {
      output: `Relation ${name} opened successfully`,
      status: 0,
      type: 'success',
    };
  }

  // CLOSE TABLE
  if (cmd.startsWith('CLOSE TABLE')) {
    const match = original.match(/CLOSE\s+TABLE\s+(\w+)/i);
    const name = match ? match[1] : 'unknown';
    return {
      output: `Relation ${name} closed successfully`,
      status: 0,
      type: 'success',
    };
  }

  // CREATE INDEX
  if (cmd.startsWith('CREATE INDEX')) {
    return {
      output: `Index created successfully`,
      status: 0,
      type: 'success',
    };
  }

  // DROP INDEX
  if (cmd.startsWith('DROP INDEX')) {
    return {
      output: `Index deleted successfully`,
      status: 0,
      type: 'success',
    };
  }

  // ALTER TABLE RENAME ... COLUMN
  if (cmd.includes('COLUMN')) {
    return {
      output: `Renamed Attribute Successfully`,
      status: 0,
      type: 'success',
    };
  }

  // ALTER TABLE RENAME
  if (cmd.startsWith('ALTER TABLE RENAME')) {
    return {
      output: `Renamed Relation Successfully`,
      status: 0,
      type: 'success',
    };
  }

  // INSERT INTO
  if (cmd.startsWith('INSERT INTO')) {
    return {
      output: `Inserted successfully`,
      status: 0,
      type: 'success',
    };
  }

  // SELECT
  if (cmd.startsWith('SELECT')) {
    const match = original.match(/INTO\s+(\w+)/i);
    const target = match ? match[1] : 'target';
    return {
      output: `Selected successfully into ${target}`,
      status: 0,
      type: 'success',
    };
  }

  // HELP
  if (cmd === 'HELP' || cmd === 'HELP;') {
    return {
      output: `CREATE TABLE tablename(attr1_name attr1_type, attr2_name attr2_type...);
  - create a relation with given attribute names

DROP TABLE tablename;
  - delete the relation

OPEN TABLE tablename;
  - open the relation

CLOSE TABLE tablename;
  - close the relation

CREATE INDEX ON tablename.attributename;
  - create an index on a given attribute.

DROP INDEX ON tablename.attributename;
  - delete the index.

ALTER TABLE RENAME tablename TO new_tablename;
  - rename an existing relation to a given new name.

ALTER TABLE RENAME tablename COLUMN column_name TO new_column_name;
  - rename an attribute of an existing relation.

INSERT INTO tablename VALUES ( value1,value2,value3,... );
  - insert a single record into the given relation.

INSERT INTO tablename VALUES FROM filepath;
  - insert multiple records from a csv file

SELECT * FROM source_relation INTO target_relation;
  - creates a relation with the same attributes and records as of source relation

SELECT Attribute1,Attribute2,... FROM source_relation INTO target_relation;
  - creates a relation with attributes specified and all records

SELECT * FROM source_relation INTO target_relation WHERE attrname OP value;
  - retrieve records based on a condition

exit
  - Exit the interface`,
      status: 0,
      type: 'success',
    };
  }

  // EXIT
  if (cmd === 'EXIT' || cmd === 'EXIT;') {
    return { output: 'Exiting...', status: 0, type: 'success' };
  }

  // ECHO
  if (cmd.startsWith('ECHO')) {
    const msg = original.replace(/^echo\s*/i, '').replace(/;$/, '');
    return { output: msg, status: 0, type: 'success' };
  }

  return {
    output: 'Syntax Error',
    status: -1,
    type: 'error',
  };
}

/**
 * Generate a NITCbase CREATE TABLE command
 */
export function buildCreateTableCmd(tableName, attributes) {
  if (!tableName || attributes.length === 0) return '';
  const attrStr = attributes
    .filter(a => a.name)
    .map(a => `${a.name} ${a.type}`)
    .join(', ');
  return `CREATE TABLE ${tableName}(${attrStr})`;
}

/**
 * Generate a NITCbase INSERT INTO command
 */
export function buildInsertCmd(tableName, values) {
  if (!tableName || values.length === 0) return '';
  const valStr = values.filter(Boolean).join(', ');
  return `INSERT INTO ${tableName} VALUES (${valStr})`;
}

/**
 * Generate a NITCbase SELECT command
 */
export function buildSelectCmd({ attrs, source, target, whereAttr, whereOp, whereVal }) {
  if (!source || !target) return '';
  const attrPart = !attrs || attrs === '*' ? '*' : attrs;
  let cmd = `SELECT ${attrPart} FROM ${source} INTO ${target}`;
  if (whereAttr && whereOp && whereVal) {
    cmd += ` WHERE ${whereAttr} ${whereOp} ${whereVal}`;
  }
  return cmd;
}

/**
 * Generate a NITCbase JOIN command
 */
export function buildJoinCmd({ attrs, source1, source2, target, attr1, attr2 }) {
  if (!source1 || !source2 || !target || !attr1 || !attr2) return '';
  const attrPart = !attrs || attrs === '*' ? '*' : attrs;
  return `SELECT ${attrPart} FROM ${source1} JOIN ${source2} INTO ${target} WHERE ${source1}.${attr1} = ${source2}.${attr2}`;
}

/** Error code descriptions for NITCbase */
export const ERROR_CODES = {
  0: 'Success',
  '-1': 'Command Failed',
  1: 'Out of bound',
  2: 'Free slot',
  3: 'No index',
  4: 'Insufficient space in disk',
  5: 'Invalid block',
  6: 'Relation does not exist',
  7: 'Relation already exists',
  8: 'Attribute does not exist',
  9: 'Attribute already exists',
  10: 'Cache is full',
  11: 'Relation is not open',
  12: 'Mismatch in number of attributes',
  13: 'Duplicate attributes found',
  14: 'Relation is open',
  15: 'Mismatch in attribute type',
  16: 'Invalid index or argument',
  17: 'Maximum number of relations already present',
  18: 'Maximum number of attributes allowed for a relation is 125',
  19: 'Operation not permitted',
};
