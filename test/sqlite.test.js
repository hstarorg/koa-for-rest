const sqlite3 = require('sqlite3').verbose();
const { SQLiteClient } = require('../src/providers');

let db = new SQLiteClient(null); // 无效用法，为了获取VSC智能提示

beforeAll(async () => {
  let database = new sqlite3.Database(':memory:');
  db = new SQLiteClient(database);
  await db.executeNonQuery(`CREATE TABLE SqliteTestTable(Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, Name VARCHAR(50) NOT NULL, Age INT NOT NULL);`);
});

afterAll(async () => {
  await db.executeNonQuery(`DROP TABLE SqliteTestTable;`);
});

describe('base usage', () => {
  test('insert data return auto id', async () => {
    let id = await db.executeInsert(`INSERT INTO SqliteTestTable(Name, Age) VALUES('test', 11)`);
    expect(id).toEqual(1);
  });

  test('query will return data list', async () => {
    let results = await db.executeQuery(`SELECT Name FROM SqliteTestTable`);
    expect(results).toHaveLength(1);
    expect(results[0].Name).toEqual('test');
  });

  test('insert new row by executeNonQuery', async () => {
    let result = await db.executeNonQuery(`INSERT INTO SqliteTestTable(Name, Age) VALUES('test2', 22)`);
    expect(result).toBe(1);
  });

  test('query count will return 2', async () => {
    let result = await db.executeScalar(`SELECT COUNT(0) AS TotalCount FROM SqliteTestTable;`);
    expect(result).not.toBe(null);
    expect(result.TotalCount).toBe(2);
  });

  test(`update row will return affected rows`, async () => {
    let affectedRows = await db.executeNonQuery(`UPDATE SqliteTestTable SET Name = 'xxx' WHERE Id < 0;`);
    expect(affectedRows).toBe(0);
  });

  test('delete row will return affected rows', async () => {
    let affectedRows = await db.executeNonQuery(`DELETE FROM SqliteTestTable WHERE Id > 1;`);
    expect(affectedRows).toBe(1);
  });

  test('query data with params', async () => {
    let data = await db.executeQuery(`SELECT * FROM SqliteTestTable WHERE Id = @Id`, { Id: 1 });
    expect(data).toHaveLength(1);
    expect(data[0].Name).toBe('test');
  });

  test('insert row with params', async () => {
    let affectedRows = await db.executeNonQuery('INSERT INTO SqliteTestTable(Name, Age) VALUES(@Name, @Age)', { Name: 'Name', Age: 22, XXX: 1 });
    expect(affectedRows).toBe(1);
    let count = (await db.executeScalar(`SELECT COUNT(0) AS TotalCount FROM SqliteTestTable;`)).TotalCount;
    expect(count).toBe(2);
  });
});

describe('transaction', () => {
  test('transaction commit', async () => {
    await db.beginTransaction();
    await db.executeNonQuery(`INSERT INTO SqliteTestTable(Name, Age) VALUES('Tran1', 999);`, null);
    await db.commitTransaction();
    let countResult = await db.executeScalar('SELECT COUNT(0) AS TotalCount FROM SqliteTestTable WHERE Age = @Age;', { Age: 999 });
    expect(countResult.TotalCount).toBe(1);
  });

  test('transaction rollback', async () => {
    await db.beginTransaction();
    await db.executeNonQuery(`DELETE FROM SqliteTestTable`, null);
    await db.rollbackTransaction();
    let countResult = await db.executeScalar('SELECT COUNT(0) AS TotalCount FROM SqliteTestTable', { Age: 999 });
    expect(countResult.TotalCount).toBe(3);
  });
});

describe('error tests', () => {
  test('throw error by error sql', async () => {
    try {
      await db.executeInsert('INSERT INTO SqliteTestTable1');
    } catch (e) {
      expect(e).toHaveProperty('errno');
      expect(e.code).toBe('SQLITE_ERROR');
    }
  });

  test('throw error by insert error data', async () => {
    try {
      await db.executeInsert(`INSERT INTO SqliteTestTable(Name) VALUES('Error')`);
    } catch (e) {
      expect(e).toHaveProperty('errno');
      expect(e.code).toBe('SQLITE_CONSTRAINT');
    }
  });
});
