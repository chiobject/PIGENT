from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime
from pathlib import Path

# 환경변수 로드
load_dotenv()

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM API 설정
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME")  # 기본값: gemini-2.5-flash

if not LLM_API_KEY:
    raise ValueError("LLM_API_KEY가 설정되지 않았습니다.")

genai.configure(api_key=LLM_API_KEY)
model = genai.GenerativeModel(LLM_MODEL_NAME)

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

# 요청 모델
class ProjectRequest(BaseModel):
    user_input: str

# 응답 모델
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

        # Gemini API 호출
        response = model.generate_content(full_prompt)

        # 로그 저장
        save_log(request.user_input, response.text)

        return ProjectResponse(
            response=response.text,
            status="success"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM 처리 중 오류 발생: {str(e)}")


@app.get("/health")
async def health_check():
    """
    서버 상태 확인 엔드포인트
    """
    return {
        "status": "healthy",
        "llm_api_configured": bool(LLM_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
