export function pgSQL(type: string) {
    switch (type) {
        case 'integer':
            return 'Integer';

        case 'double precision':
        case 'real':
            return 'Float';

        case 'boolean':
            return 'Boolean';

        case 'date':
            return 'Date';

        case 'time':
            return 'Time';

        case 'timestamp':
            return 'DateTime';

        default:
            return 'String';
    }
}

export function msSQL(type: string) {
    switch (type) {
        case 'bit':
        case 'int':
        case 'smallint':
            return 'Integer';

        case 'decimal':
        case 'money':
        case 'numeric':
        case 'smallmoney':
        case 'float':
        case 'real':
        case 'bigint':
            return 'Float';

        case 'date':
            return 'Date';

        case 'time':
            return 'Time';

        case 'datetime2':
        case 'datetime':
        case 'datetimeoffset':
        case 'smalldatetime':
            return 'DateTime';

        case 'char':
        case 'varchar':
        case 'text':
        case 'nchar':
        case 'nvarchar':
        case 'ntext':
            return 'String';

        case 'binary':
        case 'varbinary':
        case 'image':
            return 'IntegerList'

        default:
            throw new Error(`Unsupported column type found: ${type}`);
    }
}

export function oraSQL(type: string) {
    switch (type) {
        case 'integer':
        case 'number':
            return 'Integer';

        case 'double':
            return 'Float';

        case 'boolean':
            return 'Boolean';

        case 'time':
            return 'Time';

        case 'date':
        case 'timestamp':
        case 'datetime':
            return 'DateTime';

        case 'char':
        case 'varchar':
        case 'text':
            return 'String';

        case 'blob':
        case 'clob':
            return 'IntegerList'

        default:
            return 'String';
    }
}


type ColumnTypeTranslator = (type: string) => string
export default ColumnTypeTranslator
