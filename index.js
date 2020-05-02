const express = require("express");
const app = express();
var fs = require("fs");

const port = 3000;

const { BotFrameworkAdapter } = require("botbuilder");
const botConfig = require("./config");
const { Bot } = require("./bot");

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

let conversationsData = fs.readFileSync("./conversations.json");
const conversationReferences = JSON.parse(conversationsData);

// Create the main dialog.

const bot = new Bot(conversationReferences);

const adapter = new BotFrameworkAdapter({
  appId: botConfig.appId,
  appPassword: botConfig.appPassword
});

app.get("/", (req, res) => res.send("Hello World!"));

// Listen for incoming requests at /api/messages.
app.post("/api/bot", (req, res) => {
  adapter.processActivity(req, res, async turnContext => {
    bot.addConversationReference(turnContext.activity);
    await bot.run(turnContext);
  });
});

app.post("/github", async (req, res) => {
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
  for (const conversationReference of Object.values(conversationReferences)) {
    await adapter.continueConversation(
      conversationReference,
      async turnContext => {
        await turnContext.sendActivity("proactive hello");
      }
    );
  }
  res.status(200).send("");
  res.end();
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
