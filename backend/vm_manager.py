"""
가상환경 관리 모듈
Master VM과 Slave VM 간 심볼릭 링크 기반 패키지 관리
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path
from typing import Optional

# 경로 설정
BACKEND_DIR = Path(__file__).parent
PROJECT_ROOT = BACKEND_DIR.parent
VM_DIR = PROJECT_ROOT / "vm"
MASTER_VM_PATH = VM_DIR / "master_vm"
SLAVE_VMS_DIR = VM_DIR / "slave_vm"

# Master VM의 site-packages 경로 (Windows 기준)
if sys.platform == "win32":
    MASTER_SITE_PACKAGES = MASTER_VM_PATH / "Lib" / "site-packages"
else:
    # Linux/Mac
    python_version = f"python{sys.version_info.major}.{sys.version_info.minor}"
    MASTER_SITE_PACKAGES = MASTER_VM_PATH / "lib" / python_version / "site-packages"


def create_slave_vm(board_id: int) -> Path:
    """
    특정 Board를 위한 Slave VM 생성
    
    1. slave_vms/{board_id}/ 디렉토리 생성
    2. venv 가상환경 생성
    3. site-packages 디렉토리 삭제
    4. Master VM의 site-packages를 심볼릭 링크로 연결
    
    Args:
        board_id: Board ID
    
    Returns:
        Path: 생성된 Slave VM 경로
    """
    slave_vm_path = SLAVE_VMS_DIR / str(board_id)
    
    # 이미 존재하면 삭제 후 재생성
    if slave_vm_path.exists():
        shutil.rmtree(slave_vm_path)
    
    # Slave VMs 디렉토리 생성
    SLAVE_VMS_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. venv 생성
    print(f"[VM Manager] Creating venv for board {board_id}...")
    subprocess.run([sys.executable, "-m", "venv", str(slave_vm_path)], check=True)
    
    # 2. site-packages 경로 결정
    if sys.platform == "win32":
        slave_site_packages = slave_vm_path / "Lib" / "site-packages"
    else:
        python_version = f"python{sys.version_info.major}.{sys.version_info.minor}"
        slave_site_packages = slave_vm_path / "lib" / python_version / "site-packages"
    
    # 3. site-packages 삭제
    if slave_site_packages.exists():
        shutil.rmtree(slave_site_packages)
    
    # 4. Master VM의 site-packages를 심볼릭 링크로 연결
    print(f"[VM Manager] Linking site-packages from master_vm...")
    
    if sys.platform == "win32":
        # Windows: mklink /D (디렉토리 심볼릭 링크)
        # 주의: Windows에서는 관리자 권한이 필요할 수 있음
        os.symlink(MASTER_SITE_PACKAGES, slave_site_packages, target_is_directory=True)
    else:
        # Linux/Mac: ln -s
        os.symlink(MASTER_SITE_PACKAGES, slave_site_packages)
    
    print(f"[VM Manager] Slave VM created: {slave_vm_path}")
    return slave_vm_path


def delete_slave_vm(board_id: int) -> bool:
    """
    Slave VM 삭제
    
    Args:
        board_id: Board ID
    
    Returns:
        bool: 성공 여부
    """
    slave_vm_path = SLAVE_VMS_DIR / str(board_id)
    
    if not slave_vm_path.exists():
        print(f"[VM Manager] Slave VM not found: {slave_vm_path}")
        return False
    
    try:
        shutil.rmtree(slave_vm_path)
        print(f"[VM Manager] Slave VM deleted: {slave_vm_path}")
        return True
    except Exception as e:
        print(f"[VM Manager] Error deleting slave VM: {e}")
        return False


def get_slave_vm_path(board_id: int) -> Path:
    """
    Slave VM 경로 반환
    
    Args:
        board_id: Board ID
    
    Returns:
        Path: Slave VM 경로
    """
    return SLAVE_VMS_DIR / str(board_id)


def get_slave_python_executable(board_id: int) -> Optional[Path]:
    """
    Slave VM의 Python 실행 파일 경로 반환
    
    Args:
        board_id: Board ID
    
    Returns:
        Optional[Path]: Python 실행 파일 경로 (없으면 None)
    """
    slave_vm_path = get_slave_vm_path(board_id)
    
    if not slave_vm_path.exists():
        return None
    
    if sys.platform == "win32":
        python_exe = slave_vm_path / "Scripts" / "python.exe"
    else:
        python_exe = slave_vm_path / "bin" / "python"
    
    return python_exe if python_exe.exists() else None


def get_python_version(python_exe: Path) -> tuple:
    """
    Python 실행 파일의 버전 반환
    
    Args:
        python_exe: Python 실행 파일 경로
    
    Returns:
        tuple: (major, minor) 버전 (예: (3, 11))
    """
    try:
        result = subprocess.run(
            [str(python_exe), "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        # 출력 예: "Python 3.11.5"
        version_str = result.stdout.strip().split()[1]
        major, minor = version_str.split('.')[:2]
        return (int(major), int(minor))
    except Exception:
        return (0, 0)


def verify_python_version_match(board_id: int) -> bool:
    """
    Slave VM과 Master VM의 Python 버전 일치 확인
    
    Args:
        board_id: Board ID
    
    Returns:
        bool: 버전 일치 여부
    """
    slave_python = get_slave_python_executable(board_id)
    if not slave_python:
        return False
    
    slave_version = get_python_version(slave_python)
    master_version = (sys.version_info.major, sys.version_info.minor)
    
    return slave_version == master_version


def recreate_slave_vm_if_needed(board_id: int) -> bool:
    """
    Python 버전이 다르면 Slave VM 재생성
    
    Args:
        board_id: Board ID
    
    Returns:
        bool: 재생성 여부
    """
    if not verify_python_version_match(board_id):
        print(f"[VM Manager] Python version mismatch detected for board {board_id}")
        print(f"[VM Manager] Recreating slave VM...")
        delete_slave_vm(board_id)
        create_slave_vm(board_id)
        return True
    return False


def verify_slave_vm(board_id: int) -> bool:
    """
    Slave VM이 제대로 생성되었는지 확인
    
    Args:
        board_id: Board ID
    
    Returns:
        bool: 유효성 여부
    """
    slave_vm_path = get_slave_vm_path(board_id)
    
    if not slave_vm_path.exists():
        return False
    
    # Python 실행 파일 존재 확인
    python_exe = get_slave_python_executable(board_id)
    if not python_exe or not python_exe.exists():
        return False
    
    # site-packages 심볼릭 링크 확인
    if sys.platform == "win32":
        slave_site_packages = slave_vm_path / "Lib" / "site-packages"
    else:
        python_version = f"python{sys.version_info.major}.{sys.version_info.minor}"
        slave_site_packages = slave_vm_path / "lib" / python_version / "site-packages"
    
    return slave_site_packages.exists() and slave_site_packages.is_symlink()
