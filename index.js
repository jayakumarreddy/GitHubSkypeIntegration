const express = require("express");
const app = express();
const port = 3000;
const { BotFrameworkAdapter } = require("botbuilder");
const botConfig = require("./config");

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const { ProactiveBot } = require("./bot");

// Create the main dialog.
const conversationReferences = {};
const bot = new ProactiveBot(conversationReferences);

const adapter = new BotFrameworkAdapter({
  appId: botConfig.appId,
  appPassword: botConfig.appPassword
});

app.get("/", (req, res) => res.send("Hello World!"));

// Listen for incoming requests at /api/messages.
app.post("/api/messages", (req, res) => {
  console.log("message received", req.body, "\n");
  console.log("conversationReferences", conversationReferences, "\n");
  adapter.processActivity(req, res, async turnContext => {
    // route to main dialog.
    await bot.run(turnContext);
  });
});

app.post("/github", async (req, res) => {
  console.log("req is", req.body);
  const actionPayload = req.body;

  if (actionPayload["pull_request"] && actionPayload.action === "opened") {
    for (const conversationReference of Object.values(conversationReferences)) {
      await adapter.continueConversation(
        conversationReference,
        async turnContext => {
          await turnContext.sendActivity(
            `A new PR has been raised by ${actionPayload.pull_request.user
              .login || ""} \n URL : ${actionPayload.pull_request.html_url ||
              ""}`
          );
        }
      );
    }
  }

  res.end();
});

app.post("/post", async (req, res) => {
  console.log("post called");
  for (const conversationReference of Object.values(conversationReferences)) {
    await adapter.continueConversation(
      conversationReference,
      async turnContext => {
        await turnContext.sendActivity("proactive hello");
      }
    );
  }
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.write(
    "<html><body><h1>Proactive messages have been sent.</h1></body></html>"
  );
  res.end();
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
