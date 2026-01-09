const fs = require('fs');

function mapPostgresTypeToTS(dataType, udtName, isNullable) {
  const nullable = isNullable ? ' | null' : '';
  const typeMap = {
    'bigint': 'number',
    'int8': 'number',
    'integer': 'number',
    'int': 'number',
    'int4': 'number',
    'smallint': 'number',
    'int2': 'number',
    'numeric': 'number',
    'decimal': 'number',
    'real': 'number',
    'float4': 'number',
    'double precision': 'number',
    'float8': 'number',
    'text': 'string',
    'varchar': 'string',
    'character varying': 'string',
    'char': 'string',
    'character': 'string',
    'uuid': 'string',
    'boolean': 'boolean',
    'bool': 'boolean',
    'date': 'string',
    'timestamp': 'string',
    'timestamp without time zone': 'string',
    'timestamp with time zone': 'string',
    'timestamptz': 'string',
    'time': 'string',
    'json': 'Record<string, any>',
    'jsonb': 'Record<string, any>',
    'array': 'any[]',
    'bytea': 'string'
  };
  let tsType = typeMap[dataType] || typeMap[udtName] || 'any';
  if (udtName && udtName.startsWith('_')) {
    tsType = 'any[]';
  }
  return tsType + nullable;
}

function processCsv(csvFile) {
  const content = fs.readFileSync(csvFile, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const tableMap = {};

  lines.forEach(line => {
    const parts = line.split(',');
    if (parts.length < 6) return;
    const [tableName, columnName, dataType, udtName, isNullableStr, isPkStr] = parts;
    if (!tableMap[tableName]) tableMap[tableName] = [];
    tableMap[tableName].push({
      column_name: columnName,
      data_type: dataType,
      udt_name: udtName,
      is_nullable: isNullableStr === 'true',
      is_primary_key: isPkStr === 'true'
    });
  });

  return tableMap;
}

function generateTypes(tableMap) {
  let output = '// Generated TypeScript types from Supabase database schema\n';
  output += '// Generated at: ' + new Date().toISOString() + '\n\n';
  output += 'export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];\n\n';
  
  output += 'export interface Database {\n';
  output += '  public: {\n';
  output += '    Tables: {\n';

  Object.keys(tableMap).sort().forEach(tableName => {
    const columns = tableMap[tableName];
    output += `      ${tableName}: {\n`;
    output += '        Row: {\n';
    columns.forEach(col => {
      const tsType = mapPostgresTypeToTS(col.data_type, col.udt_name, col.is_nullable);
      output += `          ${col.column_name}: ${tsType};\n`;
    });
    output += '        }\n';
    output += '        Insert: {\n';
    columns.forEach(col => {
      let tsType = mapPostgresTypeToTS(col.data_type, col.udt_name, col.is_nullable);
      const isOptional = col.is_nullable || col.column_name === 'id' || col.column_name.includes('created_at') || col.column_name.includes('updated_at');
      tsType = tsType.replace(' | null', '');
      output += `          ${col.column_name}${isOptional ? '?' : ''}: ${tsType}${col.is_nullable ? ' | null' : ''};\n`;
    });
    output += '        }\n';
    output += '        Update: {\n';
    columns.forEach(col => {
      let tsType = mapPostgresTypeToTS(col.data_type, col.udt_name, col.is_nullable);
      tsType = tsType.replace(' | null', '');
      output += `          ${col.column_name}?: ${tsType}${col.is_nullable ? ' | null' : ''};\n`;
    });
    output += '        }\n';
    output += '        Relationships: [];\n';
    output += '      }\n';
  });

  output += '    }\n';
  output += '    Views: {}\n';
  output += '    Functions: {}\n';
  output += '    Enums: {}\n';
  output += '    CompositeTypes: {}\n';
  output += '  }\n';
  output += '}\n';

  return output;
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error("Usage: node schema-from-csv.js <csv_file>");
  process.exit(1);
}

const tableMap = processCsv(args[0]);
const tsOutput = generateTypes(tableMap);
fs.writeFileSync('lib/database.types.ts', tsOutput);
console.log('Types generated in lib/database.types.ts');
