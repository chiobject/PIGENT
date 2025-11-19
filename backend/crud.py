from sqlalchemy.orm import Session
from models import Board, UserChat, LLMResponse, ResponseType
from datetime import datetime
from typing import Optional, List

# ==================== Board CRUD ====================

def create_board(db: Session, title: str) -> Board:
    """새로운 보드 생성 및 SlaveVM 자동 생성"""
    import vm_manager
    
    # 1. Board 생성
    board = Board(
        title=title
    )
    db.add(board)
    db.commit()
    db.refresh(board)
    
    try:
        # 2. Slave VM 물리적 생성 (DB 저장 없음, 파일 시스템만)
        vm_manager.create_slave_vm(board.board_id)
        print(f"[CRUD] Board {board.board_id} created with SlaveVM")
        
    except Exception as e:
        print(f"[CRUD] Error creating SlaveVM: {e}")
        # Board는 생성되었지만 VM 생성 실패 - 일단 Board는 유지
        # 추후 retry 로직 추가 가능
    
    return board

def get_board(db: Session, board_id: int) -> Optional[Board]:
    """보드 ID로 조회"""
    return db.query(Board).filter(Board.board_id == board_id).first()

def get_all_boards(db: Session, skip: int = 0, limit: int = 100) -> List[Board]:
    """모든 보드 조회 (페이지네이션)"""
    return db.query(Board).offset(skip).limit(limit).all()

def update_board(db: Session, board_id: int, title: Optional[str] = None) -> Optional[Board]:
    """보드 정보 업데이트"""
    board = get_board(db, board_id)
    if not board:
        return None

    if title is not None:
        board.title = title

    board.edited_time = datetime.now()
    db.commit()
    db.refresh(board)
    return board

def delete_board(db: Session, board_id: int) -> bool:
    """보드 및 SlaveVM 삭제"""
    import vm_manager
    
    board = get_board(db, board_id)
    if not board:
        return False
    
    # 1. Slave VM 물리적 삭제 (파일 시스템)
    try:
        vm_manager.delete_slave_vm(board_id)
    except Exception as e:
        print(f"[CRUD] Error deleting SlaveVM: {e}")
    
    # 2. Board 삭제 (Cascade로 관련 데이터 자동 삭제)
    db.delete(board)
    db.commit()
    return True

# ==================== UserChat CRUD ====================

def create_user_chat(db: Session, board_id: int, content: str, response_type: ResponseType) -> UserChat:
    """새로운 사용자 채팅 생성"""
    user_chat = UserChat(
        board_id=board_id,
        content=content,
        response_type=response_type
    )
    db.add(user_chat)
    db.commit()
    db.refresh(user_chat)
    return user_chat

def get_user_chat(db: Session, user_chat_id: int) -> Optional[UserChat]:
    """사용자 채팅 ID로 조회"""
    return db.query(UserChat).filter(UserChat.user_chat_id == user_chat_id).first()

def get_chats_by_board(db: Session, board_id: int) -> List[UserChat]:
    """특정 보드의 모든 채팅 조회"""
    return db.query(UserChat).filter(UserChat.board_id == board_id).order_by(UserChat.created_time).all()

# ==================== LLMResponse CRUD ====================

def create_llm_response_exception(db: Session, user_chat_id: int, plain_text: str) -> LLMResponse:
    """Exception 타입 LLM 응답 생성 (인사말, 에러 메시지 등)"""
    llm_response = LLMResponse(
        user_chat_id=user_chat_id,
        plain_text=plain_text,
        code_content=None,
        wiring_content=None,
        steps_content=None
    )
    db.add(llm_response)
    db.commit()
    db.refresh(llm_response)
    return llm_response

def create_llm_response_success(db: Session, user_chat_id: int,
                               code_content: str, wiring_content: str, steps_content: str) -> LLMResponse:
    """Success 타입 LLM 응답 생성 (CODE, WIRING, STEPS)"""
    llm_response = LLMResponse(
        user_chat_id=user_chat_id,
        plain_text=None,
        code_content=code_content,
        wiring_content=wiring_content,
        steps_content=steps_content
    )
    db.add(llm_response)
    db.commit()
    db.refresh(llm_response)
    return llm_response

def get_llm_response(db: Session, user_chat_id: int) -> Optional[LLMResponse]:
    """user_chat_id로 LLM 응답 조회"""
    return db.query(LLMResponse).filter(LLMResponse.user_chat_id == user_chat_id).first()

# ==================== 통합 함수 ====================

def create_chat_with_exception_response(db: Session, board_id: int, user_content: str, plain_text: str):
    """사용자 채팅과 Exception 응답을 함께 생성"""
    # 1. UserChat 생성
    user_chat = create_user_chat(db, board_id, user_content, ResponseType.EXCEPTION)

    # 2. LLMResponse 생성
    llm_response = create_llm_response_exception(db, user_chat.user_chat_id, plain_text)

    return user_chat, llm_response

def create_chat_with_success_response(db: Session, board_id: int, user_content: str,
                                     code_content: str, wiring_content: str, steps_content: str):
    """사용자 채팅과 Success 응답을 함께 생성"""
    # 1. UserChat 생성
    user_chat = create_user_chat(db, board_id, user_content, ResponseType.SUCCESS)

    # 2. LLMResponse 생성
    llm_response = create_llm_response_success(db, user_chat.user_chat_id,
                                              code_content, wiring_content, steps_content)

    return user_chat, llm_response

def get_board_with_chats(db: Session, board_id: int):
    """보드와 모든 채팅, LLM 응답을 함께 조회"""
    board = get_board(db, board_id)
    if not board:
        return None

    # SQLAlchemy의 relationship을 통해 자동으로 로드됨
    return board
