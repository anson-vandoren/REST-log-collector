import express from "express";

import { CommonRoute } from "./routes/common";
import { LogRoute } from "./routes/logRoute";

const app: express.Application = express();
const port = 3000;
const routes: Array<CommonRoute> = [];

routes.push(new LogRoute(app));

const runningMessage = `Server running at http://localhost:${port}`;
app.get("/", (req: express.Request, res: express.Response) => {
  res.status(200).send(runningMessage);
});

app.listen(port, () => {
  routes.forEach((route: CommonRoute) => {
    console.log(`Routes configured for ${route.name}`);
  });

  console.log(runningMessage);
});
