const { ActivityHandler, TurnContext } = require("botbuilder");
var fs = require("fs");

class Bot extends ActivityHandler {
  constructor(conversationReferences) {
    super();
    // Dependency injected dictionary for storing ConversationReference objects used in NotifyController to proactively message users
    this.conversationReferences = conversationReferences;

    this.onConversationUpdate(async (context, next) => {
      this.addConversationReference(context.activity);
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id !== context.activity.recipient.id) {
          const welcomeMessage = "Welcome !!";
          await context.sendActivity(welcomeMessage);
        }
      }
      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    this.onMessage(async (context, next) => {
      this.addConversationReference(context.activity);
      // Echo back what the user said
      await context.sendActivity(`You sent '${context.activity.text}'`);
      await next();
    });
  }

  addConversationReference(activity) {
    const conversationReference = TurnContext.getConversationReference(
      activity
    );
    if (!this.conversationReferences[conversationReference.conversation.id]) {
      this.conversationReferences[
        conversationReference.conversation.id
      ] = conversationReference;

      // Writing to conversations.json file
      fs.writeFile(
        "./conversations.json",
        JSON.stringify(this.conversationReferences, null, 2),
        err => {
          if (err) throw err;
          console.log("Data written to file");
        }
      );
    }
  }
}

module.exports.Bot = Bot;
