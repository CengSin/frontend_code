const queryParams = new URLSearchParams(window.location.search);
const isEmbedMode = queryParams.get('embed') === '1';

const form = document.getElementById('qa-form');
const questionInput = document.getElementById('question');
const statusEl = document.getElementById('status');
const answerEl = document.getElementById('answer');
const submitBtn = document.getElementById('submit-btn');
const copyBtn = document.getElementById('copy-answer');
const fillDemoBtn = document.getElementById('fill-demo');
const embedCodeEl = document.getElementById('embed-code');
const embedPreview = document.getElementById('embed-preview');
const refreshEmbedBtn = document.getElementById('refresh-embed');
const copyEmbedBtn = document.getElementById('copy-embed');

const ENDPOINT = 'http://localhost:8081/ai/temporal';
const demoQuestion =
  '请拉一下今年注册选股通，没有领《脱水研报》《早知道》7天试读的手机号清单,以csv形式导出。';

function setStatus(text, type = 'muted') {
  statusEl.textContent = text;
  statusEl.style.color = type === 'error' ? 'var(--danger)' : 'var(--muted)';
}

function renderMarkdown(markdown) {
  const aiBubble = answerEl.querySelector('.bubble.ai');
  if (!aiBubble) return;
  const content = markdown || '暂无内容';
  aiBubble.innerHTML = marked.parse(content, { breaks: true });
  aiBubble.classList.remove('typing');
}

function renderConversation(question) {
  answerEl.innerHTML = '';

  const userRow = document.createElement('div');
  userRow.className = 'chat-row user';
  const userBubble = document.createElement('div');
  userBubble.className = 'bubble user';
  userBubble.textContent = question;
  userRow.appendChild(userBubble);

  const aiRow = document.createElement('div');
  aiRow.className = 'chat-row ai';
  const aiBubble = document.createElement('div');
  aiBubble.className = 'bubble ai typing';
  aiBubble.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
  aiRow.appendChild(aiBubble);

  answerEl.appendChild(userRow);
  answerEl.appendChild(aiRow);
}

async function handleSubmit(event) {
  event.preventDefault();
  const question = questionInput.value.trim();
  if (!question) return;

  submitBtn.disabled = true;
  questionInput.value = '';
  setStatus('正在请求接口...');
  renderConversation(question);

  const formData = new FormData();
  formData.append('question', question);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`接口返回 ${response.status}`);
    }

    const data = await response.json();
    renderMarkdown(data.answer || '未返回 answer 字段');
    setStatus('请求完成');
  } catch (error) {
    console.error(error);
    renderMarkdown('请求失败，请检查服务是否已启动。');
    setStatus(error.message || '请求失败', 'error');
  } finally {
    submitBtn.disabled = false;
    refreshEmbedSnippet();
  }
}

function copyTextFromElement(element) {
  const text = element.value || element.innerText || element.textContent || '';
  if (!text.trim()) return;
  navigator.clipboard
    .writeText(text)
    .then(() => setStatus('已复制到剪贴板'))
    .catch(() => setStatus('复制失败', 'error'));
}

function fillDemo() {
  questionInput.value = demoQuestion;
  refreshEmbedSnippet();
}

function refreshEmbedSnippet() {
  if (!embedCodeEl || !embedPreview || isEmbedMode) return;
  const base = `${window.location.origin}${window.location.pathname}`;
  const question = questionInput.value.trim() || '在这里输入问题';
  const params = new URLSearchParams({ question, embed: '1' });
  const src = `${base}?${params.toString()}`;
  const iframe = `<iframe src="${src}" style="width:100%;max-width:720px;height:480px;border:1px solid #e5e7eb;border-radius:12px;" title="RAG助手"></iframe>`;

  embedCodeEl.value = iframe;
  embedPreview.src = src;
}

function prefillFromQuery() {
  const presetQuestion = queryParams.get('question');

  if (presetQuestion) {
    questionInput.value = presetQuestion;
  }

  refreshEmbedSnippet();
}

function applyEmbedMode() {
  if (!isEmbedMode) return;
  document.body.classList.add('embed-mode');
}

applyEmbedMode();

form.addEventListener('submit', handleSubmit);
if (copyBtn) {
  copyBtn.addEventListener('click', () => copyTextFromElement(answerEl));
}
if (fillDemoBtn) {
  fillDemoBtn.addEventListener('click', fillDemo);
}
if (refreshEmbedBtn) {
  refreshEmbedBtn.addEventListener('click', refreshEmbedSnippet);
}
if (copyEmbedBtn) {
  copyEmbedBtn.addEventListener('click', () => copyTextFromElement(embedCodeEl));
}

questionInput.addEventListener('input', () => setStatus('等待提交'));

prefillFromQuery();
