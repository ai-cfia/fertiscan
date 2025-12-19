from http import HTTPStatus
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from app.controllers.data_extraction import extract_data
from app.controllers.files import (
    create_inspection_folder,
    delete_inspection_folder,
    read_inspection_folder,
    read_inspection_folders,
    read_label,
)
from app.controllers.inspections import (
    create_inspection,
    delete_inspection,
    read_all_inspections,
    read_inspection,
    update_inspection,
)
from app.controllers.users import sign_up
from app.dependencies import (
    AuthUserDep,
    ConnectionPoolDep,
    FileValidationDep,
    GPTDep,
    OCRDep,
    StorageDep,
    UserDep,
)
from app.exceptions import (
    FileNotFoundError,
    FolderNotFoundError,
    InspectionNotFoundError,
    UserConflictError,
)
from app.models.files import DeleteFolderResponse, FolderResponse
from app.models.inspections import (
    DeletedInspection,
    InspectionCreate,
    InspectionData,
    InspectionResponse,
    InspectionUpdate,
)
from app.models.label_data import LabelData
from app.models.monitoring import HealthStatus
from app.models.users import User

router = APIRouter()


@router.get("/", tags=["Home"])
async def home(request: Request):
    return RedirectResponse(url=request.app.docs_url)


@router.get("/health", tags=["Monitoring"], response_model=HealthStatus)
async def health_check():
    return HealthStatus()


@router.post("/analyze", response_model=LabelData, tags=["Pipeline"])
async def analyze_document(ocr: OCRDep, gpt: GPTDep, files: FileValidationDep):
    label_images = [await f.read() for f in files]
    return extract_data(ocr, gpt, label_images)


@router.post("/signup", tags=["Users"], status_code=201, response_model=User)
async def signup(cp: ConnectionPoolDep, user: AuthUserDep):
    try:
        return await sign_up(cp, user)
    except UserConflictError:
        raise HTTPException(status_code=HTTPStatus.CONFLICT, detail="User exists!")


@router.post("/login", tags=["Users"], status_code=200, response_model=User)
async def login(user: UserDep):
    return user


@router.get("/inspections", tags=["Inspections"], response_model=list[InspectionData])
async def get_inspections(cp: ConnectionPoolDep, user: UserDep):
    return await read_all_inspections(cp, user)


@router.get(
    "/inspections/{id}", tags=["Inspections"], response_model=InspectionResponse
)
async def get_inspection(cp: ConnectionPoolDep, user: UserDep, id: UUID):
    try:
        return await read_inspection(cp, user, id)
    except InspectionNotFoundError:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Inspection not found"
        )


@router.post("/inspections", tags=["Inspections"], response_model=InspectionResponse)
async def post_inspection(
    cp: ConnectionPoolDep, fs: StorageDep, user: UserDep, data: InspectionCreate
):
    return await create_inspection(cp, fs, user, data)


@router.put(
    "/inspections/{id}", tags=["Inspections"], response_model=InspectionResponse
)
async def put_inspection(
    cp: ConnectionPoolDep, user: UserDep, id: UUID, inspection: InspectionUpdate
):
    try:
        return await update_inspection(cp, user, id, inspection)
    except InspectionNotFoundError:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Inspection not found"
        )


@router.delete(
    "/inspections/{id}", tags=["Inspections"], response_model=DeletedInspection
)
async def delete_inspection_(
    cp: ConnectionPoolDep, fs: StorageDep, user: UserDep, id: UUID
):
    try:
        return await delete_inspection(cp, fs, user, id)
    except InspectionNotFoundError:
        raise HTTPException(
            status_code=HTTPStatus.NOT_FOUND, detail="Inspection not found"
        )


@router.get("/files", tags=["Files"], response_model=list[FolderResponse])
async def get_folders(cp: ConnectionPoolDep, fs: StorageDep, user: UserDep):
    return await read_inspection_folders(cp, fs, user.id)


@router.get("/files/{folder_id}", tags=["Files"], response_model=FolderResponse)
async def get_folder(
    cp: ConnectionPoolDep, fs: StorageDep, user: UserDep, folder_id: UUID
):
    try:
        return await read_inspection_folder(cp, fs, user.id, folder_id)
    except FolderNotFoundError:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Folder not found")


@router.post("/files", tags=["Files"], response_model=FolderResponse)
async def create_folder_(
    cp: ConnectionPoolDep, fs: StorageDep, user: UserDep, files: FileValidationDep
):
    label_images = [await f.read() for f in files]
    return await create_inspection_folder(cp, fs, user.id, label_images)


@router.delete(
    "/files/{folder_id}", tags=["Files"], response_model=DeleteFolderResponse
)
async def delete_folder_(
    cp: ConnectionPoolDep, fs: StorageDep, user: UserDep, folder_id: UUID
):
    try:
        return await delete_inspection_folder(cp, fs, user.id, folder_id)
    except FolderNotFoundError:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="Folder not found")


@router.get("/files/{folder_id}/{file_id}", tags=["Files"], response_class=Response)
async def get_file(fs: StorageDep, user: UserDep, folder_id: UUID, file_id: UUID):
    try:
        file = await read_label(fs, user.id, folder_id, file_id)
        return Response(content=file.content, media_type=file.content_type)
    except FileNotFoundError:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND, detail="File not found")
