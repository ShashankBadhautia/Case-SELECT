import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  PlayerSqlError,
  relationsInPlan,
  validatePlayerSql,
} from "../src/services/playerSql.service.js";

test("accepts a single SELECT and strips the terminator", () => {
  assert.equal(validatePlayerSql("SELECT * FROM guests;"), "SELECT * FROM guests");
});

test("accepts WITH queries and leading comments", () => {
  assert.equal(
    validatePlayerSql("-- who ate what\nWITH o AS (SELECT * FROM restaurant_orders) SELECT * FROM o"),
    "-- who ate what\nWITH o AS (SELECT * FROM restaurant_orders) SELECT * FROM o",
  );
});

test("rejects anything that is not a SELECT", () => {
  for (const sql of ["DELETE FROM guests", "UPDATE guests SET role = 'x'", "DROP TABLE guests"]) {
    assert.throws(() => validatePlayerSql(sql), PlayerSqlError, sql);
  }
});

test("rejects more than one statement", () => {
  assert.throws(() => validatePlayerSql("SELECT 1; SELECT 2"), /one query at a time/);
});

test("allows semicolons inside string literals", () => {
  assert.equal(validatePlayerSql("SELECT ';' AS a"), "SELECT ';' AS a");
});

test("rejects empty input and system catalogs", () => {
  assert.throws(() => validatePlayerSql("   "), /Write a query/);
  assert.throws(() => validatePlayerSql("SELECT * FROM pg_user"), /off limits/);
  assert.throws(() => validatePlayerSql("SELECT * FROM information_schema.tables"), /off limits/);
});

test("collects every table an EXPLAIN plan reads", () => {
  const plan = [
    {
      Plan: {
        "Node Type": "Hash Join",
        Plans: [
          { "Node Type": "Seq Scan", "Relation Name": "payments" },
          {
            "Node Type": "Hash",
            Plans: [{ "Node Type": "Seq Scan", "Relation Name": "bank_accounts" }],
          },
        ],
      },
    },
  ];
  assert.deepEqual([...relationsInPlan(plan)].sort(), ["bank_accounts", "payments"]);
});
