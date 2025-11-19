// API 기본 설정
const API_BASE_URL = 'http://localhost:8000';

// DOM 요소
const chatInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const messagesContainer = document.getElementById('messagesContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const loadingScreen = document.getElementById('loadingScreen');
const chatHeader = document.getElementById('chatHeader');
const chatTitle = document.getElementById('chatTitle');
const newChatBtn = document.getElementById('newChatBtn');
const chatList = document.getElementById('chatList');
const themeToggle = document.getElementById('themeToggle');

// 튜토리얼 모드 요소
const tutorialMode = document.getElementById('tutorialMode');
const backToChatBtn = document.getElementById('backToChatBtn');
const prevStepBtn = document.getElementById('prevStepBtn');
const nextStepBtn = document.getElementById('nextStepBtn');
const executeCodeBtn = document.getElementById('executeCodeBtn');
const stopCodeBtn = document.getElementById('stopCodeBtn');
const canvasViewer = document.getElementById('canvasViewer');
const codeViewer = document.getElementById('codeViewer');
const circuitDescription = document.getElementById('circuitDescription');
const generatedCode = document.getElementById('generatedCode');
const terminalOutput = document.getElementById('terminalOutput');
const terminalStatus = document.getElementById('terminalStatus');
const stepIndicator = document.getElementById('stepIndicator');
const inputContainer = document.querySelector('.input-container');

// 상태 관리
let currentBoardId = null;
let boards = [];
let useMockData = false; // 목업 데이터 사용 여부

// 튜토리얼 상태
let currentStep = 0;
let tutorialSteps = [];
let currentCode = '';
let isCodeRunning = false;

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    loadBoards();
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

    // 튜토리얼 모드 이벤트
    backToChatBtn.addEventListener('click', backToChat);
    prevStepBtn.addEventListener('click', previousStep);
    nextStepBtn.addEventListener('click', nextStep);
    executeCodeBtn.addEventListener('click', executeCode);
    stopCodeBtn.addEventListener('click', stopCode);
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

    // Board가 없으면 생성 (첫 메시지)
    if (!currentBoardId) {
        // 사용자 질문을 10글자만 잘라서 타이틀로 사용
        const title = message.substring(0, 10);
        console.log('새 보드 생성:', title);
        
        const newBoard = await createNewBoard(title);
        if (!newBoard) {
            alert('보드 생성에 실패했습니다.');
            return;
        }
        
        currentBoardId = newBoard.board_id;
        console.log('보드 생성 완료:', currentBoardId);
        
        // 헤더 표시 및 타이틀 설정
        chatHeader.style.display = 'block';
        chatTitle.textContent = title;
    }

    // 환영 화면 숨기기
    welcomeScreen.style.display = 'none';

    // 로딩 화면 표시
    loadingScreen.style.display = 'flex';
    messagesContainer.style.display = 'none';

    // 입력창 초기화
    chatInput.value = '';
    autoResizeTextarea();

    // 전송 버튼 비활성화
    sendBtn.disabled = true;

    try {
        // 실제 API 호출
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                board_id: currentBoardId,
                user_input: message 
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to send message');
        }
        
        const data = await response.json();

        // 로딩 화면 숨기기 및 메시지 컨테이너 표시
        loadingScreen.style.display = 'none';
        messagesContainer.style.display = 'flex';
        messagesContainer.classList.add('active');

        // 사용자 메시지 추가
        addMessage('user', message);

        // AI 응답 추가
        if (data.response_type === 'success') {
            let botResponse = '';
            if (data.code_content) {
                botResponse += `\n\n\`\`\`python\n${data.code_content}\n\`\`\``;
            }
            addMessage('bot', botResponse || data.plain_text || '응답 내용 없음');
        } else {
            addMessage('bot', data.plain_text || '응답 내용 없음');
        }
    } catch (error) {
        // 로딩 화면 숨기기
        loadingScreen.style.display = 'none';
        messagesContainer.style.display = 'flex';
        messagesContainer.classList.add('active');

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

    // 봇 메시지이고 코드가 포함된 경우
    if (type === 'bot' && content.includes('```python')) {
        // 코드를 제외한 텍스트만 표시
        const textWithoutCode = content.replace(/```python\n[\s\S]*?```/g, '').trim();

        if (textWithoutCode) {
            const formattedContent = formatMessageContent(textWithoutCode);
            messageContent.innerHTML = formattedContent;
        } else {
            messageContent.innerHTML = '코드가 생성되었습니다.';
        }

        // 실행 준비 버튼 추가
        const readyButton = document.createElement('button');
        readyButton.className = 'ready-button';
        readyButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            실행 준비가 되었습니다!
        `;
        readyButton.onclick = () => enterTutorialMode(content);
        messageContent.appendChild(readyButton);
    } else {
        // 일반 메시지 처리
        const formattedContent = formatMessageContent(content);
        messageContent.innerHTML = formattedContent;
    }

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
async function startNewChat() {
    // 튜토리얼 모드가 활성화되어 있다면 종료
    if (tutorialMode.style.display !== 'none') {
        // 실행 중인 코드 중지
        if (isCodeRunning) {
            isCodeRunning = false;
        }

        // 튜토리얼 모드 UI 초기화
        tutorialMode.style.display = 'none';
        backToChatBtn.style.display = 'none';
        canvasViewer.style.display = 'flex';
        codeViewer.style.display = 'none';
        executeCodeBtn.disabled = true;
        executeCodeBtn.style.display = 'flex';
        stopCodeBtn.style.display = 'none';
        currentStep = 0;
        terminalStatus.textContent = '대기 중';
        terminalStatus.classList.remove('running');
        terminalOutput.innerHTML = '<div class="terminal-welcome">PIGENT 터미널<br>코드를 실행하면 출력 결과가 여기에 표시됩니다.</div>';
    }

    // 새 보드 생성
    const newBoard = await createNewBoard('새 프로젝트');
    if (newBoard) {
        currentBoardId = newBoard.board_id;
    }

    messagesContainer.innerHTML = '';
    messagesContainer.classList.remove('active');
    messagesContainer.style.display = 'none';
    loadingScreen.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    chatHeader.style.display = 'none';
    inputContainer.style.display = 'block'; // 입력창 표시
    chatInput.value = '';
    autoResizeTextarea();
}

// 보드 목록 로드
async function loadBoards() {
    try {
        const response = await fetch(`${API_BASE_URL}/boards`);
        if (!response.ok) {
            throw new Error(`Failed to fetch boards: ${response.status} ${response.statusText}`);
        }
        
        boards = await response.json();
        console.log('보드 로드 완료:', boards);
        updateBoardListUI();
        
        // 보드가 없으면 자동으로 첫 보드 생성
        if (boards.length === 0) {
            console.log('보드가 없어서 새로 생성합니다');
            await createNewBoard('새 프로젝트');
        }
    } catch (error) {
        console.error('보드 로드 실패:', error);
        alert(`서버 연결 실패: ${error.message}\n서버가 실행 중인지 확인하세요.`);
    }
}

// 새 보드 생성
async function createNewBoard(title) {
    try {
        console.log('보드 생성 요청:', title);
        const response = await fetch(`${API_BASE_URL}/boards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create board: ${response.status} - ${errorText}`);
        }
        
        const newBoard = await response.json();
        console.log('보드 생성 완료:', newBoard);
        
        // 보드 목록 맨 위에 추가
        boards.unshift(newBoard);
        
        // UI 즉시 업데이트
        updateBoardListUI();
        
        return newBoard;
    } catch (error) {
        console.error('보드 생성 실패:', error);
        return null;
    }
}

// 보드 목록 UI 업데이트
function updateBoardListUI() {
    console.log('보드 목록 UI 업데이트:', boards);
    chatList.innerHTML = '';

    if (boards.length === 0) {
        chatList.innerHTML = '<div class="no-boards">채팅이 없습니다</div>';
        return;
    }

    boards.forEach(board => {
        const boardItem = document.createElement('div');
        boardItem.className = 'chat-item';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'chat-item-title';
        titleSpan.textContent = board.title;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-board-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteBoard(board.board_id);
        };

        boardItem.appendChild(titleSpan);
        boardItem.appendChild(deleteBtn);

        if (board.board_id === currentBoardId) {
            boardItem.classList.add('active');
        }

        boardItem.addEventListener('click', () => loadBoard(board.board_id));
        chatList.appendChild(boardItem);
    });
}

// 보드 삭제
async function deleteBoard(boardId) {
    if (!confirm('이 보드를 삭제하시겠습니까?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete board');
        }

        console.log('보드 삭제 성공:', boardId);

        // 로컬 boards 배열에서 삭제
        boards = boards.filter(b => b.board_id !== boardId);

        // 삭제된 보드가 현재 보드인 경우
        if (currentBoardId === boardId) {
            currentBoardId = null;
            chatMessages.innerHTML = '';
            // 튜토리얼 모드가 활성화되어 있다면 종료
            if (tutorialMode.style.display !== 'none') {
                tutorialMode.style.display = 'none';
                backToChatBtn.style.display = 'none';
            }
        }

        // UI 업데이트
        updateBoardListUI();

    } catch (error) {
        console.error('보드 삭제 실패:', error);
        alert('보드 삭제에 실패했습니다.');
    }
}

// 특정 보드의 채팅 로드
async function loadBoard(boardId) {
    try {
        const response = await fetch(`${API_BASE_URL}/boards/${boardId}/chats`);
        if (!response.ok) {
            throw new Error('Failed to fetch board chats');
        }
        
        const chats = await response.json();
        const board = boards.find(b => b.board_id === boardId);
        
        if (!board) return;

        // 튜토리얼 모드가 활성화되어 있다면 종료
        if (tutorialMode.style.display !== 'none') {
            // 실행 중인 코드 중지
            if (isCodeRunning) {
                isCodeRunning = false;
            }

            // 튜토리얼 모드 UI 초기화
            tutorialMode.style.display = 'none';
            backToChatBtn.style.display = 'none';
            canvasViewer.style.display = 'flex';
            codeViewer.style.display = 'none';
            executeCodeBtn.disabled = true;
            executeCodeBtn.style.display = 'flex';
            stopCodeBtn.style.display = 'none';
            currentStep = 0;
            terminalStatus.textContent = '대기 중';
            terminalStatus.classList.remove('running');
            terminalOutput.innerHTML = '<div class="terminal-welcome">PIGENT 터미널<br>코드를 실행하면 출력 결과가 여기에 표시됩니다.</div>';
        }

        currentBoardId = boardId;
        messagesContainer.innerHTML = '';
        welcomeScreen.style.display = 'none';
        loadingScreen.style.display = 'none';
        messagesContainer.style.display = 'flex';
        messagesContainer.classList.add('active');
        inputContainer.style.display = 'block'; // 입력창 표시

        // 헤더 표시 및 타이틀 설정
        chatHeader.style.display = 'block';
        chatTitle.textContent = board.title;

        // 채팅 메시지 복원
        chats.forEach(chat => {
            // 사용자 메시지
            addMessage('user', chat.user_content);
            
            // AI 응답
            if (chat.response_type === 'success') {
                // CODE, WIRING, STEPS를 포함한 응답 재구성
                let botResponse = '';
                if (chat.code_content) {
                    botResponse += `\n\n\`\`\`python\n${chat.code_content}\n\`\`\``;
                }
                addMessage('bot', botResponse || chat.plain_text || '응답 내용 없음');
            } else {
                addMessage('bot', chat.plain_text || '응답 내용 없음');
            }
        });

        updateBoardListUI();
    } catch (error) {
        console.error('보드 채팅 로드 실패:', error);
    }
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

// ============ 튜토리얼 모드 함수들 ============

// 튜토리얼 모드 진입
function enterTutorialMode(botResponse) {
    // 코드 추출
    const codeMatch = botResponse.match(/```python\n([\s\S]*?)```/);
    if (codeMatch) {
        currentCode = codeMatch[1].trim();
    }

    // 튜토리얼 단계 설정 (목업 데이터)
    tutorialSteps = [
        {
            description: 'GPIO 17번 핀에 LED의 긴 다리(+)를 연결하세요',
            image: '' // 실제로는 이미지 URL
        },
        {
            description: 'LED의 짧은 다리(-)를 220Ω 저항에 연결하세요',
            image: ''
        },
        {
            description: '저항의 반대편을 GND 핀에 연결하세요',
            image: ''
        }
    ];

    currentStep = 0;

    // UI 전환
    messagesContainer.style.display = 'none';
    tutorialMode.style.display = 'flex';
    backToChatBtn.style.display = 'flex';
    inputContainer.style.display = 'none'; // 입력창 숨기기

    // 첫 단계 표시
    updateTutorialStep();
}

// 튜토리얼 단계 업데이트
function updateTutorialStep() {
    if (tutorialSteps.length === 0) return;

    const step = tutorialSteps[currentStep];

    // 단계 표시 업데이트
    document.querySelector('.current-step').textContent = currentStep + 1;
    document.querySelector('.total-steps').textContent = tutorialSteps.length;

    // 설명 업데이트
    circuitDescription.textContent = step.description;

    // 이전/다음 버튼 상태
    prevStepBtn.disabled = currentStep === 0;
    nextStepBtn.disabled = currentStep === tutorialSteps.length - 1;

    // 마지막 단계에 도달하면 실행 버튼 활성화
    if (currentStep === tutorialSteps.length - 1) {
        executeCodeBtn.disabled = false;
    }
}

// 이전 단계
function previousStep() {
    if (currentStep > 0) {
        currentStep--;
        updateTutorialStep();
    }
}

// 다음 단계
function nextStep() {
    if (currentStep < tutorialSteps.length - 1) {
        currentStep++;
        updateTutorialStep();
    }
}

// 코드 실행
async function executeCode() {
    if (isCodeRunning) return;

    isCodeRunning = true;

    // 캔버스를 코드 뷰어로 전환
    canvasViewer.style.display = 'none';
    codeViewer.style.display = 'block';
    generatedCode.textContent = currentCode;

    // 실행 버튼 숨기고 중지 버튼 표시
    executeCodeBtn.style.display = 'none';
    stopCodeBtn.style.display = 'flex';

    // 터미널 상태 변경
    terminalStatus.textContent = '실행 중';
    terminalStatus.classList.add('running');
    terminalOutput.innerHTML = '';

    // 터미널에 시작 메시지
    appendToTerminal('> 코드 실행 시작...\n');

    try {
        if (useMockData) {
            // 목업 실행 시뮬레이션
            await simulateCodeExecution();
        } else {
            // 실제 API 호출
            const response = await fetch(`${API_BASE_URL}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: currentCode })
            });

            const data = await response.json();

            if (data.status === 'success') {
                appendToTerminal(data.output || '실행 완료 (출력 없음)');
            } else {
                appendToTerminal(`오류: ${data.error || '알 수 없는 오류'}`);
            }
        }
    } catch (error) {
        appendToTerminal(`연결 오류: ${error.message}`);
    }
}

// 목업 코드 실행 시뮬레이션
async function simulateCodeExecution() {
    const outputs = [
        '> GPIO 설정 완료',
        '> LED 제어 시작...',
        '> LED ON',
        '> 1초 대기...',
        '> LED OFF',
        '> 1초 대기...',
        '> LED ON',
        '> 1초 대기...',
        '> LED OFF',
    ];

    for (const output of outputs) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        appendToTerminal(output + '\n');
    }

    appendToTerminal('\n> 프로그램이 계속 실행 중입니다. 중지하려면 "실행 중지" 버튼을 클릭하세요.\n');
}

// 코드 실행 중지
function stopCode() {
    isCodeRunning = false;

    // 버튼 상태 복원
    executeCodeBtn.style.display = 'flex';
    stopCodeBtn.style.display = 'none';

    // 터미널 상태 변경
    terminalStatus.textContent = '중지됨';
    terminalStatus.classList.remove('running');

    appendToTerminal('\n> 실행이 중지되었습니다.\n');
}

// 터미널에 텍스트 추가
function appendToTerminal(text) {
    const line = document.createElement('div');
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// 채팅으로 돌아가기
function backToChat() {
    // 튜토리얼 모드 숨기기
    tutorialMode.style.display = 'none';
    messagesContainer.style.display = 'flex';
    backToChatBtn.style.display = 'none';
    inputContainer.style.display = 'block'; // 입력창 다시 표시

    // 상태 초기화
    if (isCodeRunning) {
        stopCode();
    }

    // UI 초기화
    canvasViewer.style.display = 'flex';
    codeViewer.style.display = 'none';
    executeCodeBtn.disabled = true;
    executeCodeBtn.style.display = 'flex';
    stopCodeBtn.style.display = 'none';
    currentStep = 0;
    terminalStatus.textContent = '대기 중';
    terminalStatus.classList.remove('running');
    terminalOutput.innerHTML = '<div class="terminal-welcome">PIGENT 터미널<br>코드를 실행하면 출력 결과가 여기에 표시됩니다.</div>';

    // 실행 상태 리셋
    isCodeRunning = false;
}
