import { verifyWhiteBooksSandbox } from "./whitebooks.client.js";

try {
  const result = await verifyWhiteBooksSandbox();
  console.log(JSON.stringify(result));
} catch (error) {
  console.error(error instanceof Error ? error.message : "WhiteBooks sandbox verification failed.");
  process.exitCode = 1;
}
