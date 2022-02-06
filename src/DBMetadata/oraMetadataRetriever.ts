import ConnData from '../models/connData';
import * as oracledb from 'oracledb'
import * as parseUrl from 'url-parse'
import { createHash } from 'crypto'
import { promiseTimeout } from '../util'
import DBMetadata from '../models/dbMetadata';



const pgp = pgInit();
const poolCache: { [key: string]: pgInit.IDatabase<{}> } = {};


const query = `select 
       col.table_name as "tableName", 
       col.column_name as "columnName", 
       col.nullable as "isNullable",
       col.data_type as "dataType", 
       col.data_length as "characterMaximumLength",
       a.table_name as "foreignTableName", 
       a.column_name as "foreignColumnName",
       col.data_precision, 
       col.data_scale,
       col.column_id, 
       col.owner as schema_name
from sys.all_tab_columns col
inner join sys.all_tables t on col.owner = t.owner 
  and col.table_name = t.table_name
left outer joi all_cons_columns a
      ON a.owner=col.owner
        AND a.table_name=col.table_name
        AND a.column_name=col.column_name
  JOIN all_constraints c 
      ON a.owner = c.owner 
        AND a.constraint_name = c.constraint_name
 join all_cons_columns b
      ON c.owner = b.owner 
        AND c.r_constraint_name = b.constraint_name
 WHERE c.constraint_type = 'R'
WHERE col.owner = '#{schema}#' `;

const queryForeignKeys = `SELECT 
    a.table_name as foreignTableName, 
    a.column_name as foreignColumnName, 
    a.constraint_name, 
    b.table_name as "tableName",
    b.column_name as "columnName"
  FROM all_cons_columns a
  JOIN all_constraints c 
      ON a.owner = c.owner 
        AND a.constraint_name = c.constraint_name
 join all_cons_columns b
      ON c.owner = b.owner 
        AND c.r_constraint_name = b.constraint_name
 WHERE c.constraint_type = 'R'`

const query = `SELECT
                          t.table_name as "tableName",
                          c.column_name as "columnName",
                          c.is_nullable as "isNullable",
                          c.data_type as "dataType",
                          c.character_maximum_length as "characterMaximumLength",
                          tc.constraint_type as "constraintType",
                          ccu.table_name AS "foreignTableName",
                          ccu.column_name AS "foreignColumnName"
                        FROM
                          information_schema.tables AS t JOIN information_schema.columns as c
                            ON t.table_name = c.table_name
                          LEFT JOIN information_schema.key_column_usage as kcu
                            ON t.table_name = kcu.table_name AND c.column_name = kcu.column_name
                          LEFT JOIN information_schema.table_constraints as tc
                            ON kcu.constraint_name = tc.constraint_name
                          LEFT JOIN information_schema.constraint_column_usage AS ccu 
                            ON tc.constraint_name = ccu.constraint_name
                        WHERE table_type = 'BASE TABLE'
                          AND t.table_schema = '#{schema}#'
                          AND (constraint_type = 'FOREIGN KEY' or (constraint_type is null OR constraint_type <> 'FOREIGN KEY'))
                        ORDER BY t.table_name`;

async function getSchemaInfo(connString: string, schema: string): Promise<DBMetadata[]> {
       
       
  let connection;

  try {
    const db = getDbPool(connString);
    const q = query.replace('#{schema}#', schema)
    const result = await connection.execute(q,
      [schema],  // bind value for :id
    );
    metadataInfo=result.rows
    console.log(result.rows);

  } catch (err) {
    console.error(err);
    removeFromCache(connString);
    throw err
  }/* finally {
    if (db) {
      try {
        await db.close();
      } catch (err) {
        console.error(err);
        removeFromCache(connString);
        
      }
    }
  }*/
  /*
  const db = getDbPool(connString);
  try {
    

    const metadataInfo = await promiseTimeout(
      10000,
      db.any(q)
    );

    return metadataInfo;
  } catch (err) {
    
    throw err;
  }
  */
}
// On Windows and macOS, you can specify the directory containing the Oracle
// Client Libraries at runtime, or before Node.js starts.  On other platforms
// the system library search path must always be set before Node.js is started.
// See the node-oracledb installation documentation.
// If the search path is not correct, you will get a DPI-1047 error.
function getDbPool(connString: string) {
  let libPath;
if (process.platform === 'win32') {           // Windows
  libPath = 'C:\\oracle\\instantclient_19_12';
} else if (process.platform === 'darwin') {   // macOS
  libPath = process.env.HOME + '/Downloads/instantclient_19_8';
}
if (libPath && fs.existsSync(libPath)) {
  oracledb.initOracleClient({ libDir: libPath });
}

  const url = parse(connString, true);
  const hash = createHash('sha256');
  hash.update(connString);

  const digest = hash.digest('base64');

  if (poolCache[digest]) {
    return poolCache[digest];
  }
let db
try {
    db = await oracledb.getConnection( {
      user          : url.username,
      password      : url.password,
      connectString : `${url.host}:${url.port}/${url.pathname}?${url.query}`,
    });

  } catch (err) {
    console.error(err);
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
  poolCache[digest] = db;

  return db;
}

function removeFromCache(connString: string) {
  const hash = createHash('sha256');
  hash.update(connString);

  delete poolCache[hash.digest('base64')];
}

function buildConnectionString(info: ConnData) {
  let connectionString = '';
  const port = info.port || 5432;
  connectionString += `oracle://${info.user}:${info.password}@${
    info.host
    }:${port}/${info.database}`;
  return connectionString;
}

export default {
  getSchemaInfo: getSchemaInfo,
  buildConnectionString,
};
