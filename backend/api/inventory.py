"""
Household Inventory API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging

from database import get_db, InventoryItemCreate, InventoryItemResponse, InventoryUpdateRequest
from services.inventory_service import InventoryService
from api.auth import get_current_user_id
from database.models import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/inventory",
    response_model=InventoryItemResponse,
    tags=["Inventory"],
)
def add_inventory_item(
    item_create: InventoryItemCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Add food/ingredient to household inventory.
    """
    try:
        item = InventoryService.add_inventory_item(db, user_id, item_create)
        return item
    except Exception as e:
        logger.error(f"Error adding inventory item: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error adding inventory item",
        )


@router.get(
    "/inventory",
    response_model=List[InventoryItemResponse],
    tags=["Inventory"],
)
def get_inventory(
    exclude_expired: bool = True,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get all inventory items for current user.
    """
    items = InventoryService.get_inventory_items(
        db,
        user_id,
        exclude_expired=exclude_expired,
    )
    return items


@router.get(
    "/inventory/summary",
    tags=["Inventory"],
)
def get_inventory_summary(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get inventory summary (total items, food list with quantities).
    """
    summary = InventoryService.get_inventory_summary(db, user_id)
    return summary


@router.get(
    "/inventory/{item_id}",
    response_model=InventoryItemResponse,
    tags=["Inventory"],
)
def get_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Get specific inventory item.
    """
    item = InventoryService.get_inventory_item(db, user_id, item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )
    
    return item


@router.put(
    "/inventory/{item_id}",
    response_model=InventoryItemResponse,
    tags=["Inventory"],
)
def update_inventory_item(
    item_id: int,
    update_request: InventoryUpdateRequest,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Update inventory item (quantity, expiry date).
    """
    item = InventoryService.update_inventory_item(db, user_id, item_id, update_request)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )
    
    return item


@router.delete(
    "/inventory/{item_id}",
    tags=["Inventory"],
)
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Delete inventory item.
    """
    success = InventoryService.delete_inventory_item(db, user_id, item_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found",
        )
    
    return {"message": "Inventory item deleted successfully"}


@router.get(
    "/inventory/check/{ingredient_name}",
    tags=["Inventory"],
)
def check_ingredient_availability(
    ingredient_name: str,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """
    Check if ingredient is available in inventory.
    """
    availability = InventoryService.check_ingredient_availability(
        db,
        user_id,
        ingredient_name,
    )
    return availability
