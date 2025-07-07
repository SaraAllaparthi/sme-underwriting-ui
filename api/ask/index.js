const { DefaultAzureCredential } = require("@azure/identity");
const { AIProjectClient }   = require("@azure/ai-projects");   // preview SDK

const ENDPOINT =
  "https://sara-openai-underwritin-resource.services.ai.azure.com";

const PROJECT = "sara-openai-underwritin-project";
const AGENT_ID= "asst_0N9JnFU6reHLbJqS4wMbysEu";

module.exports = async function (context, req) {
  try {
    const prompt = req.body.prompt ?? "";
    const credential = new DefaultAzureCredential();
    const client = new AIProjectClient(credential, ENDPOINT);

    const thread  = await client.agents.threads.create({ projectName: PROJECT });
    await client.agents.messages.create({
      projectName: PROJECT, threadId: thread.id,
      role: "user", content: prompt
    });
    const run = await client.agents.runs.createAndProcess({
      projectName: PROJECT, threadId: thread.id, agentId: AGENT_ID
    });

    // Simple polling (5–10 secs typical). Production: use webhooks instead
    while (["queued","in_progress"].includes(run.status)) {
      await new Promise(r => setTimeout(r, 1500));
      run.status = (await client.agents.runs.get({
        projectName: PROJECT, threadId: thread.id, runId: run.id
      })).status;
    }
    const msgs = await client.agents.messages.list({
      projectName: PROJECT, threadId: thread.id
    });
    const assistantMsg = msgs.reverse()
      .find(m => m.role === "assistant")?.textMessages?.[0].text.value;

    return { status: 200,
             body: { role: "assistant", content: assistantMsg } };
  } catch (err) {
    context.log(err);
    return { status: 500, body: {error: err.message} };
  }
};
