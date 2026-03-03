from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services import folder_service, project_service

router = APIRouter()


class FolderContentsResponse(BaseModel):
    folders: List[folder_service.Folder]
    projects: List[project_service.Project]


class CreateFolderRequest(BaseModel):
    name: str = Field(min_length=1)
    parent_id: Optional[str] = None


class MoveProjectRequest(BaseModel):
    folder_id: Optional[str] = None


class UpdateFolderRequest(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None


def _status_code_for_value_error(error: ValueError, default: int = 400) -> int:
    return 404 if "not found" in str(error).lower() else default


def _normalize_folder_name(name: str) -> str:
    normalized = name.strip()
    if not normalized:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")
    return normalized


@router.get("/tree", response_model=List[folder_service.FolderTreeItem])
async def get_folder_tree():
    return folder_service.get_folder_tree()


@router.get("/contents", response_model=FolderContentsResponse)
async def get_folder_contents(folder_id: Optional[str] = Query(default=None)):
    try:
        payload = folder_service.get_folder_contents(folder_id)
        return FolderContentsResponse(**payload)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error))


@router.post("/", response_model=folder_service.Folder)
async def create_folder(request: CreateFolderRequest):
    try:
        return folder_service.create_folder(
            name=_normalize_folder_name(request.name),
            parent_id=request.parent_id,
        )
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.patch("/{folder_id}", response_model=folder_service.Folder)
async def update_folder(folder_id: str, request: UpdateFolderRequest):
    field_set = request.model_fields_set
    if "name" not in field_set and "parent_id" not in field_set:
        raise HTTPException(status_code=400, detail="No update fields provided")

    name = _normalize_folder_name(request.name) if "name" in field_set and request.name is not None else request.name
    parent_id = request.parent_id if "parent_id" in field_set else folder_service.UNSET

    try:
        return folder_service.update_folder(folder_id=folder_id, name=name, parent_id=parent_id)
    except ValueError as error:
        raise HTTPException(status_code=_status_code_for_value_error(error), detail=str(error))


@router.delete("/{folder_id}")
async def delete_folder(folder_id: str, cascade: bool = Query(default=True)):
    try:
        deleted = folder_service.delete_folder(folder_id=folder_id, cascade=cascade)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    if not deleted:
        raise HTTPException(status_code=404, detail="Folder not found")

    return {"message": "Folder deleted successfully"}


@router.post("/projects/{project_id}/move")
async def move_project_to_folder(project_id: str, request: MoveProjectRequest):
    try:
        folder_service.move_project_to_folder(project_id=project_id, folder_id=request.folder_id)
    except ValueError as error:
        raise HTTPException(status_code=_status_code_for_value_error(error), detail=str(error))

    return {"message": "Project moved successfully"}
