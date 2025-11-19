from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from ollama import AsyncClient
import os
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path
import re
from typing import Optional

# 데이터베이스 import
from database import engine, get_db, Base
from models import ResponseType
import crud

# 환경변수 로드
load_dotenv()

app = FastAPI()

# 데이터베이스 테이블 생성
Base.metadata.create_all(bind=engine)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ollama 클라이언트 설정
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3")

ollama_client = AsyncClient(host=OLLAMA_HOST)

# text_prompt.txt 파일 읽기
def load_prompt_template():
    encodings = ['utf-8', 'cp949', 'euc-kr', 'utf-8-sig']
    for encoding in encodings:
        try:
            with open("./text_prompt.txt", "r", encoding=encoding) as f:
                content = f.read()
                return content
        except (FileNotFoundError, UnicodeDecodeError):
            continue
    print("[경고] 프롬프트 파일을 읽을 수 없어 기본 프롬프트를 사용합니다.")
    return "당신은 라즈베리파이 학습을 돕는 AI 어시스턴트입니다."

PROMPT_TEMPLATE = load_prompt_template()

# LLM 응답 파싱 함수
def parse_llm_response(response_text: str):
    """
    LLM 응답을 파싱하여 response_type과 각 섹션을 추출합니다.

    Returns:
        dict: {
            'response_type': 'success' or 'exception',
            'plain_text': str (exception인 경우),
            'code_content': str (success인 경우),
            'wiring_content': str (success인 경우),
            'steps_content': str (success인 경우)
        }
    """
    # ### CODE, ### WIRING, ### STEPS 패턴 확인
    has_code = "### CODE" in response_text
    has_wiring = "### WIRING" in response_text
    has_steps = "### STEPS" in response_text

    # 세 섹션이 모두 있으면 success, 없으면 exception
    if has_code and has_wiring and has_steps:
        # Success 응답 파싱
        code_match = re.search(r'### CODE\s*```python\s*(.*?)\s*```', response_text, re.DOTALL)
        wiring_match = re.search(r'### WIRING\s*```\s*(.*?)\s*```', response_text, re.DOTALL)
        steps_match = re.search(r'### STEPS\s*```\s*(.*?)\s*```', response_text, re.DOTALL)

        return {
            'response_type': ResponseType.SUCCESS,
            'plain_text': None,
            'code_content': code_match.group(1).strip() if code_match else "",
            'wiring_content': wiring_match.group(1).strip() if wiring_match else "",
            'steps_content': steps_match.group(1).strip() if steps_match else ""
        }
    else:
        # Exception 응답 (인사말, 에러 메시지 등)
        return {
            'response_type': ResponseType.EXCEPTION,
            'plain_text': response_text.strip(),
            'code_content': None,
            'wiring_content': None,
            'steps_content': None
        }

# 로그 저장 함수
def save_log(user_input: str, ai_response: str):
    """
    요청과 응답을 날짜별 폴더에 시간별 파일로 저장
    """
    try:
        # 현재 시간
        now = datetime.now()
        date_folder = now.strftime("%Y-%m-%d")
        time_filename = now.strftime("%H-%M-%S.txt")

        # 로그 디렉토리 생성 (log/YYYY-MM-DD/)
        log_dir = Path("./log") / date_folder
        log_dir.mkdir(parents=True, exist_ok=True)

        # 로그 파일 경로
        log_file = log_dir / time_filename

        # 로그 내용 작성
        log_content = f"""=== 요청 시간 ===
{now.strftime("%Y년 %m월 %d일 %H시 %M분 %S초")}

=== 사용자 요청 ===
{user_input}

=== AI 응답 ===
{ai_response}
"""

        # 파일 저장
        with open(log_file, "w", encoding="utf-8") as f:
            f.write(log_content)

        print(f"[로그 저장 완료] {log_file}")

    except Exception as e:
        print(f"[로그 저장 실패] {e}")

# ==================== Pydantic 모델 ====================

# Board 관련
class BoardCreate(BaseModel):
    title: str

class BoardResponse(BaseModel):
    board_id: int
    title: str
    created_time: datetime
    edited_time: datetime

    class Config:
        from_attributes = True

# Chat 관련
class ChatRequest(BaseModel):
    board_id: int
    user_input: str

class ChatResponse(BaseModel):
    user_chat_id: int
    board_id: int
    user_content: str
    response_type: str
    plain_text: Optional[str] = None
    code_content: Optional[str] = None
    wiring_content: Optional[str] = None
    steps_content: Optional[str] = None
    created_time: datetime

# 기존 모델 (호환성 유지)
class ProjectRequest(BaseModel):
    user_input: str

class ProjectResponse(BaseModel):
    response: str
    status: str



@app.get("/")
async def root():
    return {"message": "PIGENT API Server", "status": "running"}

@app.post("/generate", response_model=ProjectResponse)
async def generate_tutorial(request: ProjectRequest):
    """
    사용자 입력을 받아 Gemini API로 튜토리얼을 생성합니다.
    """
    try:
        # 프롬프트 구성
        full_prompt = f"{PROMPT_TEMPLATE}\n\n사용자 요청: {request.user_input}"

        # Ollama API 호출
        response = await ollama_client.chat(
            model=OLLAMA_MODEL,
            messages=[
                {
                    'role': 'user',
                    'content': full_prompt,
                },
            ]
        )
        bot_reply = response['message']['content']

        # 로그 저장
        save_log(request.user_input, bot_reply)

        return ProjectResponse(
            response=bot_reply,
            status="success"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 처리 중 오류 발생: {str(e)}")


@app.get("/health")
async def health_check():
    """
    서버 상태 확인 엔드포인트
    """
    try:
        await ollama_client.list()
        ollama_status = True
    except:
        ollama_status = False
    
    return {
        "status": "healthy",
        "ollama_connected": ollama_status
    }

# ==================== Board API ====================

@app.post("/boards", response_model=BoardResponse)
async def create_board(board: BoardCreate, db: Session = Depends(get_db)):
    """새로운 보드 생성"""
    new_board = crud.create_board(
        db=db,
        title=board.title
    )
    return new_board

@app.get("/boards/{board_id}", response_model=BoardResponse)
async def get_board(board_id: int, db: Session = Depends(get_db)):
    """보드 조회"""
    board = crud.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    return board

@app.get("/boards")
async def get_all_boards(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """모든 보드 조회"""
    boards = crud.get_all_boards(db, skip=skip, limit=limit)
    return boards

@app.delete("/boards/{board_id}")
async def delete_board(board_id: int, db: Session = Depends(get_db)):
    """보드 삭제"""
    success = crud.delete_board(db, board_id)
    if not success:
        raise HTTPException(status_code=404, detail="Board not found")
    return {"message": "Board deleted successfully"}

# ==================== Code Execution API ====================

class CodeExecuteRequest(BaseModel):
    code: str

class CodeExecuteResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    board_id: int

@app.post("/boards/{board_id}/execute", response_model=CodeExecuteResponse)
async def execute_code(board_id: int, request: CodeExecuteRequest, db: Session = Depends(get_db)):
    """
    특정 Board의 SlaveVM에서 코드 실행
    """
    import code_executor
    
    # Board 존재 확인
    board = crud.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # 코드 실행
    success, stdout, stderr = code_executor.execute_code(db, board_id, request.code)
    
    return CodeExecuteResponse(
        success=success,
        stdout=stdout,
        stderr=stderr,
        board_id=board_id
    )

# ==================== Chat API ====================

@app.post("/chat", response_model=ChatResponse)
async def create_chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    사용자 질문을 받아 LLM 응답을 생성하고 데이터베이스에 저장합니다.
    """
    try:
        # 보드 존재 확인
        board = crud.get_board(db, request.board_id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        # 프롬프트 구성
        full_prompt = f"{PROMPT_TEMPLATE}\n\n사용자 요청: {request.user_input}"

        # Ollama API 호출
        llm_response = await ollama_client.chat(
            model=OLLAMA_MODEL,
            messages=[
                {
                    'role': 'user',
                    'content': full_prompt,
                },
            ]
        )
        response_text = llm_response['message']['content']

        # 로그 저장
        save_log(request.user_input, response_text)

        # 응답 파싱
        parsed = parse_llm_response(response_text)

        # 데이터베이스에 저장
        if parsed['response_type'] == ResponseType.SUCCESS:
            user_chat, llm_resp = crud.create_chat_with_success_response(
                db=db,
                board_id=request.board_id,
                user_content=request.user_input,
                code_content=parsed['code_content'],
                wiring_content=parsed['wiring_content'],
                steps_content=parsed['steps_content']
            )
        else:  # EXCEPTION
            user_chat, llm_resp = crud.create_chat_with_exception_response(
                db=db,
                board_id=request.board_id,
                user_content=request.user_input,
                plain_text=parsed['plain_text']
            )

        # Board의 edited_time 업데이트
        board = crud.get_board(db, request.board_id)
        if board:
            board.edited_time = datetime.now()
            db.commit()

        # 응답 반환
        return ChatResponse(
            user_chat_id=user_chat.user_chat_id,
            board_id=user_chat.board_id,
            user_content=user_chat.content,
            response_type=user_chat.response_type.value,
            plain_text=llm_resp.plain_text,
            code_content=llm_resp.code_content,
            wiring_content=llm_resp.wiring_content,
            steps_content=llm_resp.steps_content,
            created_time=user_chat.created_time
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 처리 중 오류 발생: {str(e)}")

@app.get("/boards/{board_id}/chats")
async def get_board_chats(board_id: int, db: Session = Depends(get_db)):
    """특정 보드의 모든 채팅 조회"""
    board = crud.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    chats = crud.get_chats_by_board(db, board_id)

    result = []
    for chat in chats:
        llm_resp = crud.get_llm_response(db, chat.user_chat_id)
        result.append({
            "user_chat_id": chat.user_chat_id,
            "user_content": chat.content,
            "response_type": chat.response_type.value,
            "plain_text": llm_resp.plain_text if llm_resp else None,
            "code_content": llm_resp.code_content if llm_resp else None,
            "wiring_content": llm_resp.wiring_content if llm_resp else None,
            "steps_content": llm_resp.steps_content if llm_resp else None,
            "created_time": chat.created_time
        })

    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
