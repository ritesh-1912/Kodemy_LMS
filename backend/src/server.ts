import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";

const port = env.PORT;

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Health: http://localhost:${port}/api/health`);
});
