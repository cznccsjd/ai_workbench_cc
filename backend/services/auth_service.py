#
# 认证服务
# 提供用户认证和授权功能
#

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from database.base import get_db
from models import user as user_model

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> user_model.User:
    """获取当前用户"""
    try:
        # 这里应该实现真正的JWT验证逻辑
        # 暂时返回测试用户

        # 从数据库获取测试用户
        user = db.query(user_model.User).filter(user_model.User.email == "test_user@example.com").first()

        if not user:
            # 创建测试用户
            user = user_model.User(
                email="test_user@example.com",
                username="testuser",
                hashed_password="fake_hashed_password",  # 测试用
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="认证失败",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_active_user(
    current_user: user_model.User = Depends(get_current_user)
) -> user_model.User:
    """获取当前活跃用户"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户未激活"
        )
    return current_user