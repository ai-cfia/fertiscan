"""Test LabelImage model database constraints."""

import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session

from app.db.models.label_image import LabelImage, UploadStatus
from tests.factories.label import LabelFactory
from tests.factories.label_image import LabelImageFactory


class TestLabelImageConstraints:
    """Tests for LabelImage database constraints."""

    def test_unique_sequence_order_per_label(self, db: Session) -> None:
        """Test that sequence_order must be unique per label."""
        label = LabelFactory()
        LabelImageFactory(label=label, sequence_order=1)
        db.flush()
        with pytest.raises(IntegrityError):
            LabelImageFactory(label=label, sequence_order=1)
            db.flush()

    def test_sequence_order_can_be_same_for_different_labels(self, db: Session) -> None:
        """Test that same sequence_order is allowed for different labels."""
        label1 = LabelFactory()
        label2 = LabelFactory()
        LabelImageFactory(label=label1, sequence_order=1)
        LabelImageFactory(label=label2, sequence_order=1)
        db.flush()
        # Should not raise IntegrityError

    def test_sequence_order_must_be_positive(self, db: Session) -> None:
        """Test that sequence_order must be >= 1."""
        label = LabelFactory()
        db.flush()
        with pytest.raises(IntegrityError):
            image = LabelImage(
                label_id=label.id,
                file_path="labels/test/image.jpg",
                display_filename="image.jpg",
                sequence_order=0,
                status=UploadStatus.completed,
            )
            db.add(image)
            db.flush()

    def test_sequence_order_cannot_be_negative(self, db: Session) -> None:
        """Test that sequence_order cannot be negative."""
        label = LabelFactory()
        db.flush()
        with pytest.raises(IntegrityError):
            image = LabelImage(
                label_id=label.id,
                file_path="labels/test/image.jpg",
                display_filename="image.jpg",
                sequence_order=-1,
                status=UploadStatus.completed,
            )
            db.add(image)
            db.flush()
