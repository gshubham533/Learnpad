import { stopAgent } from "./lib/processManager";

stopAgent()
  .then(() => {
    console.log("[agent:stop] Agent stopped");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
