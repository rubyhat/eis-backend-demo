import { beforeAll, afterAll, afterEach } from "vitest";
import {
  connect,
  closeDatabase,
  clearDatabase,
} from "./src/__tests__/helpers/db";

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});
