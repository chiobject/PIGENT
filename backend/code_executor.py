"""
코드 실행 및 패키지 관리 유틸리티
"""

import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import List, Tuple, Optional
from sqlalchemy.orm import Session

import vm_manager
import crud


def extract_imports(code: str) -> List[str]:
    """
    Python 코드에서 import 문을 추출하여 패키지 이름 리스트 반환
    
    Args:
        code: Python 코드 문자열
    
    Returns:
        List[str]: 패키지 이름 리스트 (중복 제거)
    
    Examples:
        >>> extract_imports("import os\\nfrom gpiozero import LED")
        ['os', 'gpiozero']
        
        >>> extract_imports("from RPi import GPIO\\nimport time")
        ['RPi', 'time']
    """
    packages = set()
    
    # 1. import xxx 형태
    import_pattern = r'^import\s+([a-zA-Z_][a-zA-Z0-9_]*)'
    for match in re.finditer(import_pattern, code, re.MULTILINE):
        packages.add(match.group(1))
    
    # 2. from xxx import yyy 형태
    from_import_pattern = r'^from\s+([a-zA-Z_][a-zA-Z0-9_]*)'
    for match in re.finditer(from_import_pattern, code, re.MULTILINE):
        packages.add(match.group(1))
    
    return list(packages)


def execute_code(db: Session, board_id: int, code: str) -> Tuple[bool, str, str]:
    """
    Slave VM에서 코드 실행
    
    1. Python 버전 체크 (불일치 시 Slave VM 재생성)
    2. 임시 파일 생성
    3. Slave VM의 Python으로 실행
    4. 결과 반환 및 파일 삭제
    
    Args:
        db: DB 세션
        board_id: Board ID
        code: 실행할 Python 코드
    
    Returns:
        Tuple[bool, str, str]: (성공 여부, stdout, stderr)
    """
    # 1. Python 버전 체크 및 필요 시 재생성
    vm_manager.recreate_slave_vm_if_needed(board_id)
    
    # 2. Python 실행 파일 경로 가져오기
    python_exe = vm_manager.get_slave_python_executable(board_id)
    if not python_exe:
        return False, "", f"SlaveVM not found for board {board_id}"
    
    # 3. 임시 파일 생성 및 코드 실행
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name
        
        # 4. 환경변수 설정
        env = os.environ.copy()
        # gpiozero가 자동으로 환경을 감지하도록 GPIOZERO_PIN_FACTORY 설정 제거
        # - 라즈베리파이: 자동으로 실제 GPIO 사용
        # - Windows/Mac: 자동으로 fake-rpi(mock) 사용
        
        # 5. subprocess로 코드 실행
        result = subprocess.run(
            [str(python_exe), temp_file_path],
            capture_output=True,
            text=True,
            timeout=30,  # 30초 타임아웃
            env=env  # 환경변수 전달
        )
        
        # 6. 임시 파일 삭제
        Path(temp_file_path).unlink()
        
        success = result.returncode == 0
        return success, result.stdout, result.stderr
        
    except subprocess.TimeoutExpired:
        return False, "", "Code execution timeout (30 seconds)"
    except Exception as e:
        return False, "", f"Code execution error: {str(e)}"
