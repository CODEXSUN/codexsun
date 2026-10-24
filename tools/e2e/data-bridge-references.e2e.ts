import assert from "node:assert/strict";
import test from "node:test";
import { randomBytes } from "node:crypto";
import { createConnection } from "mysql2/promise";
import { CommonTableReferences } from "../../devkits/data-bridge/api/src/modules/import-review/import-review.references.js";

test("Data Bridge translates nested source parent IDs by target business keys", async () => {
  const config = {
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!
  };
  const names = ["source", "target"].map(
    (side) => `codexsun_bridge_fk_${side}_${randomBytes(4).toString("hex")}`
  );
  const admin = await createConnection(config);
  try {
    for (const name of names) await admin.query(`CREATE DATABASE \`${name}\``);
    const source = await createConnection({ ...config, database: names[0] });
    const target = await createConnection({ ...config, database: names[1] });
    try {
      for (const connection of [source, target]) {
        await connection.query(
          "CREATE TABLE core_countries (id INT PRIMARY KEY, code VARCHAR(8) UNIQUE, name VARCHAR(32) UNIQUE)"
        );
        await connection.query(
          "CREATE TABLE core_states (id INT PRIMARY KEY, country_id INT, code VARCHAR(8), UNIQUE(country_id,code), FOREIGN KEY(country_id) REFERENCES core_countries(id))"
        );
        await connection.query(
          "CREATE TABLE core_districts (id INT PRIMARY KEY, state_id INT, name VARCHAR(32), UNIQUE(state_id,name), FOREIGN KEY(state_id) REFERENCES core_states(id))"
        );
        await connection.query(
          "CREATE TABLE core_cities (id INT PRIMARY KEY, district_id INT, name VARCHAR(32), FOREIGN KEY(district_id) REFERENCES core_districts(id))"
        );
      }
      await source.query("INSERT INTO core_countries VALUES (1,'IN','India')");
      await target.query("INSERT INTO core_countries VALUES (9,'IN','India')");
      await source.query("INSERT INTO core_states VALUES (7,1,'TN')");
      await target.query("INSERT INTO core_states VALUES (31,9,'TN')");
      await source.query("INSERT INTO core_districts VALUES (24,7,'Tenkasi'),(25,7,'Missing')");
      await target.query("INSERT INTO core_districts VALUES (88,31,'Tenkasi')");
      const references = new CommonTableReferences(source, target);
      assert.deepEqual(
        await references.translate("core_cities", { district_id: 24, name: "Town" }),
        { district_id: 88, name: "Town" }
      );
      await assert.rejects(
        references.translate("core_cities", { district_id: 25, name: "Town" }),
        /parent (first|before this table)/u
      );
      await target.query("UPDATE core_countries SET name='Different' WHERE id=9");
      await target.query("INSERT INTO core_countries VALUES (10,'OTHER','India')");
      await assert.rejects(
        new CommonTableReferences(source, target).translate("core_states", {
          country_id: 1,
          code: "TN"
        }),
        /Ambiguous target parent/u
      );
    } finally {
      await source.end();
      await target.end();
    }
  } finally {
    for (const name of names) await admin.query(`DROP DATABASE IF EXISTS \`${name}\``);
    await admin.end();
  }
});
