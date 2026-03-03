"""
Diff API Routes (Native)
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from app.api._helpers import get_project_or_404
from app.services import diff_service

router = APIRouter()

class DiffRequest(BaseModel):
    commit1: str
    commit2: str

@router.post("/{project_id}/diff")
async def start_diff(project_id: str, request: DiffRequest):
    """Start a visual diff job."""
    get_project_or_404(project_id)
    try:
        job_id = diff_service.start_diff_job(project_id, request.commit1, request.commit2)
        return {"job_id": job_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/diff/{job_id}/status")
async def get_status(project_id: str, job_id: str):
    get_project_or_404(project_id)
    status = diff_service.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail="Job not found")
    return status

@router.get("/{project_id}/diff/{job_id}/manifest")
async def get_manifest(project_id: str, job_id: str):
    get_project_or_404(project_id)
    manifest = diff_service.get_manifest(job_id)
    if not manifest:
        raise HTTPException(status_code=404, detail="Manifest not found or job not complete")
    return manifest

@router.get("/{project_id}/diff/{job_id}/assets/{path:path}")
async def get_asset(project_id: str, job_id: str, path: str):
    get_project_or_404(project_id)
    file_path = diff_service.get_asset_path(job_id, path)
    if not file_path:
        raise HTTPException(status_code=404, detail="Asset not found")
    return FileResponse(file_path)

@router.delete("/{project_id}/diff/{job_id}")
async def delete_job(project_id: str, job_id: str):
    """Explicitly clean up a job."""
    get_project_or_404(project_id)
    diff_service.delete_job(job_id)
    return {"status": "deleted"}
