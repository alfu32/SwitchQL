import IDBProvider from './dbProvider';
import ProcessedField from '../../models/processedField';

/* eslint-disable no-useless-escape */
/* eslint-disable no-unused-expressions */
const tab = `  `;

class PgSqlProvider implements IDBProvider {
    constructor(private connString: string) { }

    connection() {
        let conn = `const oracledb = require('oracledb')();\n`;
        conn += `const connect = {};\n`;
        conn += `const parseUrl = require('url-parse/);'\n`;
        conn += `// WARNING - Properly secure the connection string\n`;
        conn += `const connString='${this.connString}');
const url = parse(connString, true);
let db
try {
    connect.conn = await oracledb.getConnection( {
      user          : url.username,
      password      : url.password,
      connectString : \`\${url.host}:\${url.port}/\${url.pathname}?\${url.query}\`,
    });

  } catch (err) {
    console.error(err);
  } finally {
    if (connect.conn) {
      try {
        await connect.conn.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
`;

        return conn;
    }

    selectWithWhere(table: string, col: string, val: string, returnsMany: boolean) {
        let query = `const sql = 'SELECT * FROM "${table}" WHERE "${col}" = $1';\n`;

        returnsMany ?
            query += `${tab.repeat(4)}return connect.conn.execute(sql, ${val})\n` :
            query += `${tab.repeat(4)}return connect.conn.execute(sql, ${val})\n`;

        query += addPromiseResolution();

        return query;
    }

    select(table: string) {
        let query = `const sql = 'SELECT * FROM "${table}"';\n`;
        query += `${tab.repeat(4)}return connect.conn.execute(sql)\n`;

        query += addPromiseResolution();

        return query;
    }

    insert(table: string, cols: string, args: string) {
        const normalized = args
            .split(',')
            .map(a => a.replace(/[' | { | } | \$]/g, ''));

        const params = normalized.map((val, idx) => `$${idx + 1}`).join(', ');

        let query = `const sql = 'INSERT INTO "${table}" (${cols}) VALUES (${params}) RETURNING *';\n`;
        query += `${tab.repeat(4)}return connect.conn.execute(sql, [${normalized.join(
            ', '
        )}])\n`;

        query += addPromiseResolution();

        return query;
    }

    update(table: string, idColumnName: string) {
        let query = `const sql = \`UPDATE "${table}" SET \${parameterized} WHERE "${idColumnName}" = $1 RETURNING *\`;\n`;
        query += `${tab.repeat(
            4
        )}return connect.conn.execute(sql, [${idColumnName}, ...Object.values(rest)])\n`;

        query += addPromiseResolution();
        return query;
    }

    delete(table: string, column: string) {
        let query = `const sql = 'DELETE FROM "${table}" WHERE "${column}" = $1 RETURNING *';\n`;
        query += `${tab.repeat(4)}return connect.conn.execute(sql, args.${column})\n`;

        query += addPromiseResolution();

        return query;
    }

    parameterize(fields: ProcessedField[]) {
        let query = `${tab.repeat(4)}let updateValues = [];\n`;
        query += `${tab.repeat(4)}let idx = 2;\n\n`;

        query += `${tab.repeat(4)}for (const prop in rest) {\n`;

        query += `${tab.repeat(6)}updateValues.push(\`\${prop} = \$\${idx}\`);\n`;
        query += `${tab.repeat(6)}idx++;\n`;
        query += `${tab.repeat(4)}}\n`;

        query += `${tab.repeat(4)}const parameterized = updateValues.join(", ");\n`;

        return query;
    }

    configureExport() {
        return `module.exports = new GraphQLSchema({\n${tab}query: RootQuery,\n${tab}mutation: Mutation\n});`;
    }
}

const addPromiseResolution = () => {
    let str = `${tab.repeat(5)}.then(data => {\n`;
    str += `${tab.repeat(6)}return data;\n`;
    str += `${tab.repeat(5)}})\n`;
    str += `${tab.repeat(5)}.catch(err => {\n`;
    str += `${tab.repeat(6)}return ('The error is', err);\n`;
    str += `${tab.repeat(5)}})`;

    return str;
};

export default PgSqlProvider;
