require("dotenv").config();
(async () => {
  const { PrismaClient } = require("@prisma/client");
  const p = new PrismaClient();
  try {
    const info = await p.$queryRawUnsafe("SELECT current_database() AS db, inet_server_port() AS port");
    console.log("DB INFO =>", info);
    const tables = await p.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname = \'public\'");
    console.log("TABLES =>", tables);
    // show prisma migrations if any
    const migrations = await p.$queryRawUnsafe("SELECT * FROM pg_catalog.pg_tables WHERE tablename = '_prisma_migrations'");
    console.log("PRISMA_MIGRATIONS_TABLE_EXISTS =>", migrations.length > 0);
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();
