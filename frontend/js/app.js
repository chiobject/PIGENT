// API 기본 설정
const API_BASE_URL = 'http://localhost:8000';

// DOM 요소
const chatInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');
const themeToggle = document.getElementById('themeToggle');

// 상태 관리
let currentChatId = null;
let chatHistory = [];

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadChatHistory();
    setupEventListeners();
    autoResizeTextarea();
    loadThemePreference();
});

// 이벤트 리스너 설정
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    chatInput.addEventListener('input', autoResizeTextarea);

    newChatBtn.addEventListener('click', startNewChat);

    themeToggle.addEventListener('change', toggleTheme);
}

// 텍스트 영역 자동 크기 조절
function autoResizeTextarea() {
    chatInput.style.height = 'auto';
    chatInput.style.height = chatInput.scrollHeight + 'px';
}

// 메시지 전송
async function sendMessage() {
    const message = chatInput.value.trim();

    if (!message) return;

    // 환영 화면 숨기기 및 메시지 컨테이너 표시
    if (welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
        messagesContainer.classList.add('active');
    }

    // 사용자 메시지 추가
    addMessage('user', message);

    // 입력창 초기화
    chatInput.value = '';
    autoResizeTextarea();

    // 전송 버튼 비활성화
    sendBtn.disabled = true;

    try {
        // API 호출
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_input: message })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // 봇 응답 추가
            addMessage('bot', data.response);

            // 채팅 기록에 저장
            saveToChatHistory(message, data.response);
        } else {
            addMessage('bot', `오류가 발생했습니다: ${data.detail || '알 수 없는 오류'}`);
        }
    } catch (error) {
        addMessage('bot', `서버 연결에 실패했습니다: ${error.message}`);
    } finally {
        // 전송 버튼 활성화
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// 메시지 추가
function addMessage(type, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? 'U' : 'AI';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    // 코드 블록 처리
    const formattedContent = formatMessageContent(content);
    messageContent.innerHTML = formattedContent;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);

    // 스크롤을 최하단으로
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 메시지 내용 포맷팅 (코드 블록 처리)
function formatMessageContent(content) {
    // ```python 코드 블록 처리
    content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // 인라인 코드 처리
    content = content.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 줄바꿈 처리
    content = content.replace(/\n/g, '<br>');

    return content;
}

// 새 채팅 시작
function startNewChat() {
    currentChatId = Date.now();
    messagesContainer.innerHTML = '';
    messagesContainer.classList.remove('active');
    welcomeScreen.style.display = 'flex';
    chatInput.value = '';
    autoResizeTextarea();
}

// 채팅 기록 저장
function saveToChatHistory(userMessage, botResponse) {
    if (!currentChatId) {
        currentChatId = Date.now();
    }

    const chatItem = {
        id: currentChatId,
        title: userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : ''),
        timestamp: new Date().toISOString(),
        messages: []
    };

    // 기존 채팅 찾기
    const existingChatIndex = chatHistory.findIndex(chat => chat.id === currentChatId);

    if (existingChatIndex >= 0) {
        chatHistory[existingChatIndex].messages.push(
            { type: 'user', content: userMessage },
            { type: 'bot', content: botResponse }
        );
    } else {
        chatItem.messages.push(
            { type: 'user', content: userMessage },
            { type: 'bot', content: botResponse }
        );
        chatHistory.unshift(chatItem);
    }

    // 로컬 스토리지에 저장
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));

    // UI 업데이트
    updateChatHistoryUI();
}

// 채팅 기록 로드
function loadChatHistory() {
    const saved = localStorage.getItem('chatHistory');
    if (saved) {
        chatHistory = JSON.parse(saved);
        updateChatHistoryUI();
    }
}

// 채팅 기록 UI 업데이트
function updateChatHistoryUI() {
    chatList.innerHTML = '';

    chatHistory.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        chatItem.textContent = chat.title;

        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }

        chatItem.addEventListener('click', () => loadChat(chat.id));
        chatList.appendChild(chatItem);
    });
}

// 특정 채팅 로드
function loadChat(chatId) {
    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    currentChatId = chatId;
    messagesContainer.innerHTML = '';
    welcomeScreen.style.display = 'none';
    messagesContainer.classList.add('active');

    // 메시지 복원
    chat.messages.forEach(msg => {
        addMessage(msg.type, msg.content);
    });

    updateChatHistoryUI();
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 테마 전환
function toggleTheme() {
    const isDark = themeToggle.checked;
    if (isDark) {
        document.body.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
    }
}

// 테마 설정 로드
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.checked = true;
    } else {
        document.body.classList.remove('dark-theme');
        themeToggle.checked = false;
    }
}
