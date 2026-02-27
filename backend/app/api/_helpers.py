from pathlib import Path

from fastapi import HTTPException

from app.services import project_service


VALID_OUTPUT_TYPES = {"design", "manufacturing"}


def get_project_or_404(project_id: str) -> project_service.Project:
    project = project_service.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def require_output_type(value: str) -> str:
    normalized = value.strip().lower()
    if normalized not in VALID_OUTPUT_TYPES:
        raise HTTPException(status_code=400, detail="Type must be 'design' or 'manufacturing'")
    return normalized


def resolve_path_within_root(root: str, relative_path: str, *, invalid_detail: str) -> Path:
    root_path = Path(root).resolve()
    target_path = (root_path / relative_path).resolve()

    try:
        target_path.relative_to(root_path)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=invalid_detail) from error

    return target_path

