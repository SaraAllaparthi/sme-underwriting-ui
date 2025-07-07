module.exports = async function (context, req) {
  const prompt = req.body && req.body.prompt;
  context.res = {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      role: 'assistant',
      content: `Echo: ${prompt}`
    }
  };
};
