const mysql = require('mysql');
const { MysqlClient } = require('../src/providers');

let db = new MysqlClient(null); // 无效用法，为了获取VSC智能提示

beforeAll(async () => {
  let pool = mysql.createPool({
    connectionLimit: 10,
    host: '192.168.1.200',
    port: 3308,
    user: 'root',
    password: 'humin',
    database: 'TestDB'
  });
  db = new MysqlClient(pool);
  await db.executeNonQuery(`CREATE TABLE MysqlTestTable(Id INT NOT NULL AUTO_INCREMENT, Name VARCHAR(50) NOT NULL, Age INT NOT NULL, PRIMARY KEY (Id));`);
});

afterAll(async () => {
  await db.executeNonQuery(`DROP TABLE MysqlTestTable;`);
});

describe('base usage', () => {
  test('insert data return auto id', async () => {
    let id = await db.executeInsert(`INSERT INTO MysqlTestTable(Name, Age) VALUES('test', 11)`);
    expect(id).toEqual(1);
  });

  test('query will return data list', async () => {
    let results = await db.executeQuery(`SELECT Name FROM MysqlTestTable`);
    expect(results).toHaveLength(1);
    expect(results[0].Name).toEqual('test');
  });

  test('insert new row by executeNonQuery', async () => {
    let result = await db.executeNonQuery(`INSERT INTO MysqlTestTable(Name, Age) VALUES('test2', 22)`);
    expect(result).toBe(1);
  });

  test('query count will return 2', async () => {
    let result = await db.executeScalar(`SELECT COUNT(0) AS TotalCount FROM MysqlTestTable;`);
    expect(result).not.toBe(null);
    expect(result.TotalCount).toBe(2);
  });

  test(`update row will return affected rows`, async () => {
    let affectedRows = await db.executeNonQuery(`UPDATE MysqlTestTable SET Name = 'xxx' WHERE Id < 0;`);
    expect(affectedRows).toBe(0);
  });

  test('delete row will return affected rows', async () => {
    let affectedRows = await db.executeNonQuery(`DELETE FROM MysqlTestTable WHERE Id > 1;`);
    expect(affectedRows).toBe(1);
  });

  test('query data with params', async () => {
    let data = await db.executeQuery(`SELECT * FROM MysqlTestTable WHERE Id = @Id`, { Id: 1 });
    expect(data).toHaveLength(1);
    expect(data[0].Name).toBe('test');
  });

  test('insert row with params', async () => {
    let affectedRows = await db.executeNonQuery('INSERT INTO MysqlTestTable(Name, Age) VALUES(@Name, @Age)', { Name: 'Name', Age: 22, XXX: 1 });
    expect(affectedRows).toBe(1);
    let count = (await db.executeScalar(`SELECT COUNT(0) AS TotalCount FROM MysqlTestTable;`)).TotalCount;
    expect(count).toBe(2);
  });
});

describe('transaction', () => {
  test('transaction commit', async () => {
    let tran = await db.beginTransaction();
    await db.executeNonQuery(`INSERT INTO MysqlTestTable(Name, Age) VALUES('Tran1', 999);`, null, tran);
    await db.commitTransaction(tran);
    let countResult = await db.executeScalar('SELECT COUNT(0) AS TotalCount FROM MysqlTestTable WHERE Age = @Age;', { Age: 999 });
    expect(countResult.TotalCount).toBe(1);
  });

  test('transaction rollback', async () => {
    let tran = await db.beginTransaction();
    await db.executeNonQuery(`DELETE FROM MysqlTestTable`, null, tran);
    await db.rollbackTransaction(tran);
    let countResult = await db.executeScalar('SELECT COUNT(0) AS TotalCount FROM MysqlTestTable', { Age: 999 });
    expect(countResult.TotalCount).toBe(3);
  });
});

describe('error tests', () => {
  test('throw error by error sql', async () => {
    try {
      await db.executeInsert('INSERT INTO MysqlTestTable1');
    } catch (e) {
      expect(e).toHaveProperty('errno');
      expect(e.code).toBe('ER_PARSE_ERROR');
    }
  });

  test('throw error by insert error data', async () => {
    try {
      await db.executeInsert(`INSERT INTO MysqlTestTable(Name) VALUES('Error')`);
    } catch (e) {
      expect(e).toHaveProperty('errno');
      expect(e.code).toBe('ER_NO_DEFAULT_FOR_FIELD');
    }
  });
});
