const fs = require('fs');
const path = require('path');
const Datastore = require('nedb');
const { NedbClient } = require('../src/providers');

let db = new NedbClient(null); // 无效用法，为了获取VSC智能提示

beforeAll(async () => {
  let tests = new Datastore({ filename: path.join(__dirname, 'tests.db'), autoload: true });
  db = new NedbClient(tests);
});

afterAll(async () => {
  await fs.unlinkSync(path.join(__dirname, 'tests.db'));
});

test('insert data', async () => {
  await db.insert({ name: 'name1' });
  let count = await db.count();
  expect(count).toBe(1);
});

test('insert multi data', async () => {
  await db.insert([{ name: 'name2' }, { name: 'name3' }]);
  let count = await db.count();
  expect(count).toBe(3);
});

test('find one data', async () => {
  let doc = await db.findOne({ name: 'name2' });
  expect(doc.name).toBe('name2');
});

test('find data list', async () => {
  let docs = await db.find({ name: 'name2' });
  expect(docs).toHaveLength(1);
});

test('update whole document', async () => {
  await db.update({ name: 'name3' }, { name: 'name30' });
  expect(await db.count({ name: 'name30' })).toBe(1);
});

test('update part document', async () => {
  await db.update({ name: 'name30' }, { $set: { age: 10 } });
  expect(await db.count({ age: 10 })).toBe(1);
});

test('remove document', async () => {
  await db.remove({ name: 'name1' });
  expect(await db.count()).toBe(2);
});

test('remove all document', async () => {
  await db.remove({}, true);
  expect(await db.count()).toBe(0);
});
