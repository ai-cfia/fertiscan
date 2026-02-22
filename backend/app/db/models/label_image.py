"""LabelImage ORM model."""

from datetime import UTC, datetime
from enum import Enum
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Column, DateTime, UniqueConstraint, func
from sqlalchemy import Enum as sa_Enum
from sqlmodel import Field, Relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.label import Label


class UploadStatus(str, Enum):
    pending = "pending"
    completed = "completed"


class LabelImage(Base, table=True):
    __table_args__ = (
        UniqueConstraint(
            "label_id", "sequence_order", name="uq_labelimage_label_id_sequence_order"
        ),
        CheckConstraint(
            "sequence_order >= 1", name="ck_labelimage_sequence_order_positive"
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    label_id: UUID = Field(foreign_key="label.id", nullable=False, index=True)
    file_path: str = Field(max_length=512)
    display_filename: str = Field(max_length=255)
    sequence_order: int = Field(index=True, ge=1)
    status: UploadStatus = Field(
        sa_column=Column(
            sa_Enum(UploadStatus, native_enum=False),
            index=True,
            nullable=False,
            default=UploadStatus.pending,
        )
    )
    label: "Label" = Relationship(back_populates="images")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), default=func.now()),
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), onupdate=func.now()),
    )
