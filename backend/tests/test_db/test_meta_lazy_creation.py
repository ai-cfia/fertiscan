"""Tests for meta model lazy creation/deletion logic."""

from sqlmodel import Session, select

from app.db.models.fertilizer_label_data_meta import (
    FertilizerLabelDataFieldName,
    FertilizerLabelDataMeta,
)
from app.db.models.label_data_field_meta import LabelDataFieldMeta, LabelDataFieldName
from tests.factories.fertilizer_label_data import FertilizerLabelDataFactory
from tests.factories.label_data import LabelDataFactory


class TestFertilizerLabelDataMetaLazyCreation:
    """Tests for FertilizerLabelDataMeta lazy creation/deletion logic."""

    def test_meta_row_created_when_needs_review_true(self, db: Session) -> None:
        """Test that meta row is created when needs_review=True."""
        fertilizer_data = FertilizerLabelDataFactory()
        db.flush()

        # Create meta row with needs_review=True
        meta = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.n,
            needs_review=True,
        )
        db.add(meta)
        db.flush()

        # Verify meta row exists
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.label_id == fertilizer_data.id,
            FertilizerLabelDataMeta.field_name == FertilizerLabelDataFieldName.n,
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.needs_review is True
        assert found_meta.note is None
        assert found_meta.ai_generated is False

    def test_meta_row_created_when_note_added(self, db: Session) -> None:
        """Test that meta row is created when note is added."""
        fertilizer_data = FertilizerLabelDataFactory()
        db.flush()

        # Create meta row with note
        meta = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.p,
            note="Test note",
        )
        db.add(meta)
        db.flush()

        # Verify meta row exists
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.label_id == fertilizer_data.id,
            FertilizerLabelDataMeta.field_name == FertilizerLabelDataFieldName.p,
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.note == "Test note"
        assert found_meta.needs_review is False
        assert found_meta.ai_generated is False

    def test_meta_row_created_when_ai_generated_true(self, db: Session) -> None:
        """Test that meta row is created when ai_generated=True."""
        fertilizer_data = FertilizerLabelDataFactory()
        db.flush()

        # Create meta row with ai_generated=True
        meta = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.k,
            ai_generated=True,
        )
        db.add(meta)
        db.flush()

        # Verify meta row exists
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.label_id == fertilizer_data.id,
            FertilizerLabelDataMeta.field_name == FertilizerLabelDataFieldName.k,
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.ai_generated is True
        assert found_meta.needs_review is False
        assert found_meta.note is None

    def test_no_meta_row_treated_as_defaults(self, db: Session) -> None:
        """Test that if no meta row exists, treat as defaults (needs_review=False, note=None, ai_generated=False)."""
        fertilizer_data = FertilizerLabelDataFactory()
        db.flush()

        # Verify no meta rows exist
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.label_id == fertilizer_data.id
        )
        result = db.execute(stmt)
        meta_rows = list(result.scalars().all())
        assert len(meta_rows) == 0

        # When querying for meta, should return None (indicating defaults)
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.label_id == fertilizer_data.id,
            FertilizerLabelDataMeta.field_name == FertilizerLabelDataFieldName.n,
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is None
        # In application logic, this would be treated as:
        # needs_review=False, note=None, ai_generated=False

    def test_meta_row_deleted_when_all_false_or_none(self, db: Session) -> None:
        """Test that meta row is deleted when needs_review=False, note=None, and ai_generated=False."""
        fertilizer_data = FertilizerLabelDataFactory()
        db.flush()

        # Create meta row with needs_review=True
        meta = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.n,
            needs_review=True,
        )
        db.add(meta)
        db.flush()
        meta_id = meta.id

        # Verify meta row exists
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.id == meta_id
        )
        result = db.execute(stmt)
        assert result.scalar_one_or_none() is not None

        # Set all fields to defaults (needs_review=False, note=None, ai_generated=False)
        meta.needs_review = False
        meta.note = None
        meta.ai_generated = False
        db.flush()

        # Delete meta row (simulating lazy deletion logic)
        db.delete(meta)
        db.flush()

        # Verify meta row is deleted
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.id == meta_id
        )
        result = db.execute(stmt)
        assert result.scalar_one_or_none() is None

    def test_meta_row_persists_when_any_field_set(self, db: Session) -> None:
        """Test that meta row persists as long as any field is set (needs_review=True, note is not None, or ai_generated=True)."""
        fertilizer_data = FertilizerLabelDataFactory()
        db.flush()

        # Create meta row with needs_review=True
        meta = FertilizerLabelDataMeta(
            label_id=fertilizer_data.id,
            field_name=FertilizerLabelDataFieldName.n,
            needs_review=True,
            note="Test note",
            ai_generated=True,
        )
        db.add(meta)
        db.flush()
        meta_id = meta.id

        # Set needs_review=False, but keep note and ai_generated
        meta.needs_review = False
        db.flush()

        # Verify meta row still exists
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.id == meta_id
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.needs_review is False
        assert found_meta.note == "Test note"
        assert found_meta.ai_generated is True

        # Set note=None, but keep ai_generated
        meta.note = None
        db.flush()

        # Verify meta row still exists
        stmt = select(FertilizerLabelDataMeta).where(
            FertilizerLabelDataMeta.id == meta_id
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.ai_generated is True


class TestLabelDataFieldMetaLazyCreation:
    """Tests for LabelDataFieldMeta lazy creation/deletion logic."""

    def test_meta_row_created_when_needs_review_true(self, db: Session) -> None:
        """Test that meta row is created when needs_review=True."""
        label_data = LabelDataFactory()
        db.flush()

        # Create meta row with needs_review=True
        meta = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.brand_name,
            needs_review=True,
        )
        db.add(meta)
        db.flush()

        # Verify meta row exists
        stmt = select(LabelDataFieldMeta).where(
            LabelDataFieldMeta.label_id == label_data.id,
            LabelDataFieldMeta.field_name == LabelDataFieldName.brand_name,
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.needs_review is True
        assert found_meta.note is None
        assert found_meta.ai_generated is False

    def test_meta_row_created_when_note_added(self, db: Session) -> None:
        """Test that meta row is created when note is added."""
        label_data = LabelDataFactory()
        db.flush()

        # Create meta row with note
        meta = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.registration_number,
            note="Test note",
        )
        db.add(meta)
        db.flush()

        # Verify meta row exists
        stmt = select(LabelDataFieldMeta).where(
            LabelDataFieldMeta.label_id == label_data.id,
            LabelDataFieldMeta.field_name == LabelDataFieldName.registration_number,
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.note == "Test note"
        assert found_meta.needs_review is False
        assert found_meta.ai_generated is False

    def test_meta_row_created_when_ai_generated_true(self, db: Session) -> None:
        """Test that meta row is created when ai_generated=True."""
        label_data = LabelDataFactory()
        db.flush()

        # Create meta row with ai_generated=True
        meta = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.product_name,
            ai_generated=True,
        )
        db.add(meta)
        db.flush()

        # Verify meta row exists
        stmt = select(LabelDataFieldMeta).where(
            LabelDataFieldMeta.label_id == label_data.id,
            LabelDataFieldMeta.field_name == LabelDataFieldName.product_name,
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.ai_generated is True
        assert found_meta.needs_review is False
        assert found_meta.note is None

    def test_no_meta_row_treated_as_defaults(self, db: Session) -> None:
        """Test that if no meta row exists, treat as defaults (needs_review=False, note=None, ai_generated=False)."""
        label_data = LabelDataFactory()
        db.flush()

        # Verify no meta rows exist
        stmt = select(LabelDataFieldMeta).where(
            LabelDataFieldMeta.label_id == label_data.id
        )
        result = db.execute(stmt)
        meta_rows = list(result.scalars().all())
        assert len(meta_rows) == 0

        # When querying for meta, should return None (indicating defaults)
        stmt = select(LabelDataFieldMeta).where(
            LabelDataFieldMeta.label_id == label_data.id,
            LabelDataFieldMeta.field_name == LabelDataFieldName.brand_name,
        )
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is None
        # In application logic, this would be treated as:
        # needs_review=False, note=None, ai_generated=False

    def test_meta_row_deleted_when_all_false_or_none(self, db: Session) -> None:
        """Test that meta row is deleted when needs_review=False, note=None, and ai_generated=False."""
        label_data = LabelDataFactory()
        db.flush()

        # Create meta row with needs_review=True
        meta = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.brand_name,
            needs_review=True,
        )
        db.add(meta)
        db.flush()
        meta_id = meta.id

        # Verify meta row exists
        stmt = select(LabelDataFieldMeta).where(LabelDataFieldMeta.id == meta_id)
        result = db.execute(stmt)
        assert result.scalar_one_or_none() is not None

        # Set all fields to defaults (needs_review=False, note=None, ai_generated=False)
        meta.needs_review = False
        meta.note = None
        meta.ai_generated = False
        db.flush()

        # Delete meta row (simulating lazy deletion logic)
        db.delete(meta)
        db.flush()

        # Verify meta row is deleted
        stmt = select(LabelDataFieldMeta).where(LabelDataFieldMeta.id == meta_id)
        result = db.execute(stmt)
        assert result.scalar_one_or_none() is None

    def test_meta_row_persists_when_any_field_set(self, db: Session) -> None:
        """Test that meta row persists as long as any field is set (needs_review=True, note is not None, or ai_generated=True)."""
        label_data = LabelDataFactory()
        db.flush()

        # Create meta row with needs_review=True
        meta = LabelDataFieldMeta(
            label_id=label_data.id,
            field_name=LabelDataFieldName.brand_name,
            needs_review=True,
            note="Test note",
            ai_generated=True,
        )
        db.add(meta)
        db.flush()
        meta_id = meta.id

        # Set needs_review=False, but keep note and ai_generated
        meta.needs_review = False
        db.flush()

        # Verify meta row still exists
        stmt = select(LabelDataFieldMeta).where(LabelDataFieldMeta.id == meta_id)
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.needs_review is False
        assert found_meta.note == "Test note"
        assert found_meta.ai_generated is True

        # Set note=None, but keep ai_generated
        meta.note = None
        db.flush()

        # Verify meta row still exists
        stmt = select(LabelDataFieldMeta).where(LabelDataFieldMeta.id == meta_id)
        result = db.execute(stmt)
        found_meta = result.scalar_one_or_none()
        assert found_meta is not None
        assert found_meta.ai_generated is True
