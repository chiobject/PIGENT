# Backend 실행 가이드

## 환경 설정

### 1. 의존성 설치
```
pip install -r requirements.txt
```

### 2. 환경 변수 설정
backend 폴더 내에 `.env` 파일 생성:
```env
LLM_API_KEY=your_gemini_api_key
LLM_MODEL_NAME=gemini-2.0-flash-exp
```

## 서버 실행

```
cd backend
python main.py
```

서버 주소: `http://localhost:8000`

## API 테스트

### Board 생성
```
Invoke-WebRequest -Uri http://localhost:8000/boards -Method POST -ContentType "application/json" -Body '{"title":"Test Board"}'
```

### Chat 요청
```
Invoke-WebRequest -Uri http://localhost:8000/chat -Method POST -ContentType "application/json" -Body '{"board_id":1,"user_input":"I want to blink the LED lamp 3 times in a row"}'
```

### Chat 조회
```
Invoke-WebRequest -Uri http://localhost:8000/boards/1/chats -Method GET
```

## 데이터베이스

<img width="800" alt="image" src="https://github.com/user-attachments/assets/f2c0f309-f884-4cf5-b8d1-a2b6c84433bc" />

- 위치: `backend/pigent.db`
- SQLite 자동 생성
- SQLite Viewer로 확인 가능
