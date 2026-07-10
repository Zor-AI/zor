import type { ExportData } from './json';

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <style>
    {styles}
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>{title}</h1>
      <div class="meta">
        <span class="badge">{date}</span>
        <span class="badge">Session: {sessionId}</span>
        <span class="badge">Model: {model}</span>
        <span class="badge">Messages: {messageCount}</span>
        <span class="badge">Est. tokens: {tokenEstimate}</span>
      </div>
    </header>
    <main class="messages">
      {messages}
    </main>
    <footer class="footer">
      Exported from Zor Code v{version} on {exportedAt}
    </footer>
  </div>
</body>
</html>`;

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    background: #0d0d12;
    color: #f0f0f5;
    padding: 20px;
  }
  .container { max-width: 900px; margin: 0 auto; }
  .header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #2a2a3a; }
  .header h1 { font-size: 1.75rem; font-weight: 600; margin-bottom: 16px; }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; }
  .badge {
    background: #1e1e28;
    border: 1px solid #2a2a3a;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.8rem;
    color: #b0b0c0;
  }
  .messages { display: flex; flex-direction: column; gap: 24px; }
  .message {
    background: #16161d;
    border: 1px solid #2a2a3a;
    border-radius: 12px;
    padding: 16px;
    overflow: hidden;
  }
  .message.user { border-left: 4px solid #22d3ee; }
  .message.assistant { border-left: 4px solid #4ade80; }
  .message.tool { border-left: 4px solid #fbbf24; }
  .message.system { border-left: 4px solid #f87171; }
  .message-header {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 12px; padding-bottom: 8px;
    border-bottom: 1px solid #2a2a3a;
  }
  .role-badge {
    font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
    padding: 2px 8px; border-radius: 4px;
  }
  .role-badge.user { background: #064e5e; color: #22d3ee; }
  .role-badge.assistant { background: #064e2d; color: #4ade80; }
  .role-badge.tool { background: #4e3d08; color: #fbbf24; }
  .role-badge.system { background: #5e1a1a; color: #f87171; }
  .timestamp { font-size: 0.8rem; color: #707088; }
  .tool-info { font-size: 0.8rem; color: #fbbf24; font-family: monospace; }
  .message-content {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .message-content pre {
    background: #0d0d12; border: 1px solid #2a2a3a;
    border-radius: 8px; padding: 12px; overflow-x: auto;
    margin-top: 8px;
  }
  .message-content code {
    background: #1e1e28; padding: 2px 6px; border-radius: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.9em;
  }
  .message-content pre code { background: transparent; padding: 0; }
  .footer {
    margin-top: 48px; padding-top: 24px;
    border-top: 1px solid #2a2a3a;
    text-align: center; color: #707088; font-size: 0.85rem;
  }
  @media (prefers-color-scheme: light) {
    body { background: #ffffff; color: #1a1a2e; }
    .message { background: #f8f9fa; border-color: #e0e0e8; }
    .message-header { border-color: #e0e0e8; }
    .badge { background: #f0f0f8; border-color: #e0e0e8; color: #4a4a6a; }
    .message-content pre { background: #ffffff; border-color: #e0e0e8; }
    .message-content code { background: #f0f0f8; }
    .role-badge.user { background: #cfe8f3; color: #06b6d4; }
    .role-badge.assistant { background: #dcfce7; color: #22c55e; }
    .role-badge.tool { background: #fef3c7; color: #f59e0b; }
    .role-badge.system { background: #fee2e2; color: #ef4444; }
    .timestamp { color: #8888a0; }
    .footer { border-color: #e0e0e8; }
  }
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
}

function formatMessage(msg: ExportData['messages'][0]): string {
  const role = msg.role;
  const time = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
  const tool = msg.toolName ? `<span class="tool-info">${escapeHtml(msg.toolName)}</span>` : '';

  let content = escapeHtml(msg.content || '');

  // Basic markdown code block highlighting
  content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const l = lang || 'text';
    return `<pre><code class="language-${l}">${escapeHtml(code)}</code></pre>`;
  });

  // Inline code
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

  return `
    <div class="message ${role}">
      <div class="message-header">
        <span class="role-badge ${role}">${role}</span>
        ${time ? `<span class="timestamp">${time}</span>` : ''}
        ${tool}
      </div>
      <div class="message-content">${content}</div>
    </div>
  `;
}

export function toHtml(data: ExportData): string {
  const messagesHtml = data.messages.map(formatMessage).join('');
  const title = `Zor Session - ${data.session.name || data.session.id.slice(-8)}`;
  const date = new Date(data.exportedAt).toLocaleString();
  const sessionId = data.session.id;
  const model = data.config.model;
  const messageCount = data.stats.messageCount;
  const tokenEstimate = data.stats.tokenEstimate.toLocaleString();
  const version = '1.0.0';
  const exportedAt = date;

  return HTML_TEMPLATE
    .replace('{styles}', STYLES)
    .replace('{title}', escapeHtml(title))
    .replace('{date}', escapeHtml(date))
    .replace('{sessionId}', escapeHtml(sessionId))
    .replace('{model}', escapeHtml(model))
    .replace('{messageCount}', escapeHtml(String(messageCount)))
    .replace('{tokenEstimate}', escapeHtml(tokenEstimate))
    .replace('{messages}', messagesHtml)
    .replace('{version}', escapeHtml(version))
    .replace('{exportedAt}', escapeHtml(exportedAt));
}