async function send() {
  const prompt = document.getElementById('prompt').value;
  const logEl = document.getElementById('log');
  logEl.textContent += `> ${prompt}\n`;
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({prompt})
  });
  const data = await res.json();
  logEl.textContent += `${data.role}: ${data.content}\n\n`;
}
