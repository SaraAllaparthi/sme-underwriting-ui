import { DefaultAzureCredential }           from "@azure/identity";
import { AIProjectClient }                  from "@azure/ai-projects";
import { ListSortOrder }                    from "@azure/ai-agents";

const ENDPOINT = process.env.AIFOUNDRY_ENDPOINT;     // e.g. https://<workspace>.services.ai.azure.com
const PROJECT  = process.env.AIFOUNDRY_PROJECT;      // e.g. sara-openai-underwritin-project
const AGENT_ID = process.env.AIFOUNDRY_AGENT_ID;     // asst_0N9JnF…

export default async function (context, req) {
  try {
    const prompt = req.body?.prompt?.trim();
    if (!prompt) return void (context.res = { status: 400, body: "prompt missing" });

    // 1. Connect to AI Foundry workspace
    const project = new AIProjectClient({
      endpoint:  `${ENDPOINT}/api/projects/${PROJECT}`,
      credential: new DefaultAzureCredential()
    });

    // 2. Start a new thread
    const thread = await project.agents.threads.create();

    // 3. Post user message
    await project.agents.messages.create({
      thread_id: thread.id,
      role:      "user",
      content:   prompt
    });

    // 4. Run agent
    const run = await project.agents.runs.create_and_process({
      thread_id: thread.id,
      agent_id:  AGENT_ID
    });

    if (run.status === "failed")
      throw new Error(run.last_error?.message || "run failed");

    // 5. Retrieve latest assistant message
    const msgs = await project.agents.messages.list({
      thread_id: thread.id,
      order:     ListSortOrder.DESCENDING,
      limit:     1
    });

    const assistantReply = msgs[0]?.text_messages?.[0]?.text?.value || "(empty)";
    context.res = { jsonBody: { content: assistantReply } };

  } catch (e) {
    context.log.error(e);
    context.res = { status: 500, body: String(e) };
  }
}
