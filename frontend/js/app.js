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

// Hardware Renderer 인스턴스
let componentLibrary = null;
let wireRouter = null;
let parser = null;
let renderer = null;

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // Hardware Renderer 초기화
    await initHardwareRenderer();
    
    loadBoards();
    setupEventListeners();
    autoResizeTextarea();
    loadThemePreference();
});

// Hardware Renderer 초기화
async function initHardwareRenderer() {
    try {
        componentLibrary = new ComponentLibrary();
        await componentLibrary.init();
        wireRouter = new WireRouter();
        parser = new Parser();
        renderer = new Renderer(componentLibrary, wireRouter);
        console.log('Hardware Renderer 초기화 완료');
    } catch (error) {
        console.error('Hardware Renderer 초기화 실패:', error);
    }
}

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
    
    // 튜토리얼로 돌아가기 버튼
    const backToTutorialBtn = document.getElementById('backToTutorialBtn');
    if (backToTutorialBtn) {
        backToTutorialBtn.addEventListener('click', backToTutorial);
    }

    // 터미널 입력창
    const terminalInput = document.getElementById('terminalInput');
    if (terminalInput) {
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = terminalInput.value.trim();
                if (command) {
                    // 터미널에 입력 표시
                    appendToTerminal(`$ ${command}`);
                    
                    // WebSocket으로 입력 전송
                    if (currentWebSocket && currentWebSocket.readyState === WebSocket.OPEN) {
                        console.log('터미널 입력 전송:', command);
                        currentWebSocket.send('INPUT:' + command);
                    } else {
                        appendToTerminal('오류: 실행 중인 프로세스가 없습니다.');
                    }
                    
                    terminalInput.value = '';
                }
            }
        });
    }
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
        
        console.log('===== API 응답 데이터 =====');
        console.log('response_type:', data.response_type);
        console.log('code_content:', data.code_content);
        console.log('wiring_content:', data.wiring_content);
        console.log('steps_content:', data.steps_content);
        console.log('==========================');

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
            const messageDiv = addMessage('bot', botResponse || data.plain_text || '응답 내용 없음', data.wiring_content, data.steps_content);
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
function addMessage(type, content, wiringContent = null, stepsContent = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? 'U' : 'AI';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // wiring과 steps 데이터를 messageDiv에 저장
    if (wiringContent) {
        messageDiv.dataset.wiring = wiringContent;
        console.log('Wiring 데이터 저장됨:', wiringContent);
    }
    if (stepsContent) {
        messageDiv.dataset.steps = stepsContent;
        console.log('Steps 데이터 저장됨:', stepsContent);
    }

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
        readyButton.onclick = () => {
            // messageDiv에 저장된 wiring과 steps 데이터 가져오기
            const wiringContent = messageDiv.dataset.wiring || null;
            const stepsContent = messageDiv.dataset.steps || null;
            
            console.log('===== 실행 준비 버튼 클릭 =====');
            console.log('Content:', content);
            console.log('Wiring Content:', wiringContent);
            console.log('Steps Content:', stepsContent);
            console.log('================================');
            
            enterTutorialMode(content, wiringContent, stepsContent);
        };
        messageContent.appendChild(readyButton);
    } else {
        // 일반 메시지 처리
        const formattedContent = formatMessageContent(content);
        messageContent.innerHTML = formattedContent;
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);

    // 스크롤을 최하단으로 (비동기로 처리하여 렌더링 완료 후 스크롤)
    setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
    
    return messageDiv; // messageDiv 반환
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
                // wiring_content와 steps_content도 함께 전달
                addMessage('bot', botResponse || chat.plain_text || '응답 내용 없음', chat.wiring_content, chat.steps_content);
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
function enterTutorialMode(botResponse, wiringContent = null, stepsContent = null) {
    // 코드 추출
    const codeMatch = botResponse.match(/```python\n([\s\S]*?)```/);
    if (codeMatch) {
        currentCode = codeMatch[1].trim();
    }

    // STEPS 콘텐츠 파싱 (줄 단위로 분리)
    if (stepsContent) {
        tutorialSteps = stepsContent.split('\n')
            .filter(line => line.trim())
            .map(line => ({
                description: line.trim()
            }));
    } else {
        // 기본 단계 설정 (STEPS가 없는 경우)
        tutorialSteps = [
            { description: '회로를 연결해주세요' }
        ];
    }

    currentStep = 0;

    // UI 초기화 (튜토리얼 1단계부터 시작)
    canvasViewer.style.display = 'flex';
    codeViewer.style.display = 'none';
    document.querySelector('.canvas-header h3').textContent = '회로 연결 가이드';
    stepIndicator.style.display = 'flex';
    document.querySelector('.navigation-buttons').style.display = 'flex';
    executeCodeBtn.style.display = 'flex';
    executeCodeBtn.disabled = false;
    stopCodeBtn.style.display = 'none';
    const backToTutorialBtn = document.getElementById('backToTutorialBtn');
    if (backToTutorialBtn) {
        backToTutorialBtn.style.display = 'none';
    }
    isCodeRunning = false;
    terminalStatus.textContent = '대기 중';
    terminalStatus.classList.remove('running');
    terminalOutput.innerHTML = '<div class="terminal-welcome">PIGENT 터미널<br>코드를 실행하면 출력 결과가 여기에 표시됩니다.</div>';

    // WIRING 콘텐츠로 회로도 렌더링
    if (wiringContent && renderer) {
        renderCircuitDiagram(wiringContent);
    }

    // UI 전환
    messagesContainer.style.display = 'none';
    tutorialMode.style.display = 'flex';
    backToChatBtn.style.display = 'flex';
    inputContainer.style.display = 'none'; // 입력창 숨기기

    // 첫 단계 표시
    updateTutorialStep();
}

// 회로도 렌더링 함수
async function renderCircuitDiagram(wiringText) {
    try {
        const circuitCanvas = document.getElementById('circuitCanvas');
        
        if (!parser || !renderer) {
            console.error('Hardware Renderer가 초기화되지 않았습니다');
            circuitCanvas.innerHTML = '<p style="color: #ef4444; padding: 20px;">회로도 렌더러를 초기화할 수 없습니다.</p>';
            return;
        }

        // WIRING 텍스트를 AST로 파싱
        const ast = parser.parse(wiringText);
        
        if (parser.hasErrors()) {
            console.error('WIRING 파싱 오류:', parser.getErrors());
            circuitCanvas.innerHTML = '<p style="color: #ef4444; padding: 20px;">회로도를 파싱할 수 없습니다.</p>';
            return;
        }

        // AST를 회로도로 렌더링
        await renderer.render(ast, circuitCanvas);
        console.log('회로도 렌더링 완료');
        
    } catch (error) {
        console.error('회로도 렌더링 실패:', error);
        const circuitCanvas = document.getElementById('circuitCanvas');
        circuitCanvas.innerHTML = '<p style="color: #ef4444; padding: 20px;">회로도 렌더링 중 오류가 발생했습니다.</p>';
    }
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
    
    // 코드를 줄 번호와 함께 표시
    displayCodeWithLineNumbers(currentCode);

    // 제목을 "코드창"으로 변경
    document.querySelector('.canvas-header h3').textContent = '코드창';

    // 단계 표시 숨기기
    stepIndicator.style.display = 'none';

    // 이전/다음 버튼 숨기기
    document.querySelector('.navigation-buttons').style.display = 'none';

    // 실행 버튼 숨기고 중지 버튼 표시
    executeCodeBtn.style.display = 'none';
    stopCodeBtn.style.display = 'flex';

    // "튜토리얼로 돌아가기" 버튼 표시
    const backToTutorialBtn = document.getElementById('backToTutorialBtn');
    if (backToTutorialBtn) {
        backToTutorialBtn.style.display = 'flex';
    }

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
            // WebSocket을 통한 실시간 코드 실행
            await executeCodeWithWebSocket();
        }
    } catch (error) {
        appendToTerminal(`연결 오류: ${error.message}`);
    } finally {
        // 실행 완료 후 버튼 상태 복원
        isCodeRunning = false;
        executeCodeBtn.style.display = 'flex';
        stopCodeBtn.style.display = 'none';
        terminalStatus.textContent = '대기 중';
        terminalStatus.classList.remove('running');
    }
}

// WebSocket을 통한 실시간 코드 실행
async function executeCodeWithWebSocket() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('ws://localhost:8000/ws/execute');
        currentWebSocket = ws;
        
        console.log('WebSocket 연결 시도 중...');
        
        ws.onopen = () => {
            console.log('WebSocket 연결 성공');
            // 코드 전송
            ws.send(currentCode);
            console.log('코드 전송 완료');
        };
        
        ws.onmessage = (event) => {
            const message = event.data;
            // 실시간으로 출력 추가
            appendToTerminal(message);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket 오류:', error);
            appendToTerminal('\n>>> WebSocket 연결 오류');
            currentWebSocket = null;
            reject(error);
        };
        
        ws.onclose = (event) => {
            console.log('WebSocket 연결 종료됨', event);
            currentWebSocket = null;
            resolve();
        };
    });
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

    // WebSocket 연결 종료 (백엔드에 중지 신호 전송)
    if (currentWebSocket && currentWebSocket.readyState === WebSocket.OPEN) {
        console.log('WebSocket 연결 종료 중...');
        currentWebSocket.close();
        currentWebSocket = null;
        console.log('WebSocket 연결 종료됨');
    }

    // 버튼 상태 복원
    executeCodeBtn.style.display = 'flex';
    stopCodeBtn.style.display = 'none';

    // 터미널 상태 변경
    terminalStatus.textContent = '중지됨';
    terminalStatus.classList.remove('running');

    appendToTerminal('\n> 실행이 중지되었습니다.\n');
}

// 튜토리얼로 돌아가기
function backToTutorial() {
    // 실행 중인 경우 확인 메시지 표시
    if (isCodeRunning) {
        if (!confirm('코드 실행이 중지됩니다. 계속하시겠습니까?')) {
            return;
        }
        // 코드 중지
        isCodeRunning = false;
        
        // WebSocket 연결 종료
        if (currentWebSocket && currentWebSocket.readyState === WebSocket.OPEN) {
            console.log('WebSocket 연결 종료 중...');
            currentWebSocket.close();
            currentWebSocket = null;
        }
        
        terminalStatus.textContent = '중지됨';
        terminalStatus.classList.remove('running');
        appendToTerminal('\n> 실행이 중지되었습니다.\n');
    }

    // 1단계로 초기화
    currentStep = 0;

    // UI 복원
    canvasViewer.style.display = 'flex';
    codeViewer.style.display = 'none';

    // 제목 복원
    document.querySelector('.canvas-header h3').textContent = '회로 연결 가이드';

    // 단계 표시 복원
    stepIndicator.style.display = 'flex';

    // 이전/다음 버튼 복원
    document.querySelector('.navigation-buttons').style.display = 'flex';

    // 버튼 상태 복원
    executeCodeBtn.style.display = 'flex';
    executeCodeBtn.disabled = false;
    stopCodeBtn.style.display = 'none';

    // "튜토리얼로 돌아가기" 버튼 숨기기
    const backToTutorialBtn = document.getElementById('backToTutorialBtn');
    if (backToTutorialBtn) {
        backToTutorialBtn.style.display = 'none';
    }

    // 튜토리얼 단계 업데이트
    updateTutorialStep();

    // 터미널 초기화
    terminalStatus.textContent = '대기 중';
    terminalStatus.classList.remove('running');
    terminalOutput.innerHTML = '<div class="terminal-welcome">PIGENT 터미널<br>코드를 실행하면 출력 결과가 여기에 표시됩니다.</div>';
}

// 터미널에 텍스트 추가
function appendToTerminal(text) {
    const line = document.createElement('div');
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// 코드를 줄 번호와 함께 표시하고 문법 하이라이팅 적용
function displayCodeWithLineNumbers(code) {
    const lines = code.split('\n');
    let highlightedHTML = '';
    
    lines.forEach((line, index) => {
        const highlightedLine = highlightPythonSyntax(line);
        highlightedHTML += `<span class="code-line">${highlightedLine}</span>\n`;
    });
    
    generatedCode.innerHTML = highlightedHTML;
}

// Python 문법 하이라이팅
function highlightPythonSyntax(line) {
    // 주석
    line = line.replace(/(#.*$)/g, '<span style="color: #6a9955;">$1</span>');
    
    // 문자열 (큰따옴표)
    line = line.replace(/("(?:[^"\\]|\\.)*")/g, '<span style="color: #ce9178;">$1</span>');
    
    // 문자열 (작은따옴표)
    line = line.replace(/('(?:[^'\\]|\\.)*')/g, '<span style="color: #ce9178;">$1</span>');
    
    // 키워드
    const keywords = ['import', 'from', 'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False', 'lambda', 'yield', 'global', 'nonlocal', 'assert', 'del', 'raise'];
    keywords.forEach(keyword => {
        const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
        line = line.replace(regex, '<span style="color: #569cd6;">$1</span>');
    });
    
    // 함수 호출
    line = line.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span style="color: #dcdcaa;">$1</span>(');
    
    // 숫자
    line = line.replace(/\b(\d+)\b/g, '<span style="color: #b5cea8;">$1</span>');
    
    return line;
}

// 채팅으로 돌아가기
function backToChat() {
    // 코드 실행 중인 경우 확인 메시지
    if (isCodeRunning) {
        if (!confirm('코드 실행이 중지됩니다. 계속하시겠습니까?')) {
            return;
        }
        stopCode();
    }

    // 튜토리얼 모드 숨기기
    tutorialMode.style.display = 'none';
    messagesContainer.style.display = 'flex';
    backToChatBtn.style.display = 'none';
    inputContainer.style.display = 'block'; // 입력창 다시 표시

    // 상태 초기화

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
