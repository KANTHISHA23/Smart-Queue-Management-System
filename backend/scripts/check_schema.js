const { getDb } = require('../src/config/db');

const db = getDb();

const org = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='organizations'")
  .get();
console.log('organizations table exists?', !!org);

const hasOrgId = !!db
  .prepare("SELECT 1 AS x FROM pragma_table_info('queues') WHERE name='organization_id'")
  .get();
console.log('queues has organization_id?', hasOrgId);

