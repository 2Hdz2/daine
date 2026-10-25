"""
Household Inventory Service
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import logging

from database.models import InventoryItem
from database.schemas import InventoryItemCreate, InventoryItemResponse, InventoryUpdateRequest

logger = logging.getLogger(__name__)


class InventoryService:
    """Service for managing household food inventory."""
    
    @staticmethod
    def add_inventory_item(
        db: Session,
        user_id: int,
        item_create: InventoryItemCreate,
    ) -> InventoryItem:
        """Add food/ingredient to inventory."""
        try:
            item = InventoryItem(
                user_id=user_id,
                food_id=item_create.food_id,
                food_name=item_create.food_name,
                quantity=item_create.quantity,
                unit=item_create.unit,
                expiry_date=item_create.expiry_date,
            )
            
            db.add(item)
            db.commit()
            db.refresh(item)
            
            logger.info(f"Inventory item added: {item.food_name} for user {user_id}")
            return item
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error adding inventory item: {str(e)}")
            raise
    
    @staticmethod
    def get_inventory_items(
        db: Session,
        user_id: int,
        exclude_expired: bool = True,
    ) -> List[InventoryItem]:
        """Get all inventory items for user."""
        query = db.query(InventoryItem).filter(InventoryItem.user_id == user_id)
        
        if exclude_expired:
            now = datetime.utcnow()
            today_start = datetime.combine(now.date(), datetime.min.time())
            query = query.filter(
                (InventoryItem.expiry_date.is_(None)) |
                (InventoryItem.expiry_date >= today_start)
            )
        
        return query.order_by(InventoryItem.added_at.desc()).all()
    
    @staticmethod
    def get_inventory_item(
        db: Session,
        user_id: int,
        item_id: int,
    ) -> Optional[InventoryItem]:
        """Get specific inventory item."""
        return db.query(InventoryItem).filter(
            InventoryItem.id == item_id,
            InventoryItem.user_id == user_id,
        ).first()
    
    @staticmethod
    def update_inventory_item(
        db: Session,
        user_id: int,
        item_id: int,
        update_request: InventoryUpdateRequest,
    ) -> Optional[InventoryItem]:
        """Update inventory item."""
        try:
            item = InventoryService.get_inventory_item(db, user_id, item_id)
            
            if not item:
                return None
            
            if update_request.quantity is not None:
                item.quantity = update_request.quantity
            
            if update_request.expiry_date is not None:
                item.expiry_date = update_request.expiry_date
            
            db.commit()
            db.refresh(item)
            
            logger.info(f"Inventory item updated: {item.id}")
            return item
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating inventory item: {str(e)}")
            raise
    
    @staticmethod
    def delete_inventory_item(
        db: Session,
        user_id: int,
        item_id: int,
    ) -> bool:
        """Delete inventory item."""
        try:
            item = InventoryService.get_inventory_item(db, user_id, item_id)
            
            if not item:
                return False
            
            db.delete(item)
            db.commit()
            
            logger.info(f"Inventory item deleted: {item_id}")
            return True
        
        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting inventory item: {str(e)}")
            raise
    
    @staticmethod
    def get_inventory_summary(
        db: Session,
        user_id: int,
    ) -> dict:
        """Get summary of inventory (food list, quantities)."""
        items = InventoryService.get_inventory_items(db, user_id, exclude_expired=True)
        
        return {
            "total_items": len(items),
            "foods": [
                {
                    "food_name": item.food_name,
                    "quantity": item.quantity,
                    "unit": item.unit,
                    "expiry_date": item.expiry_date,
                    "days_until_expiry": (
                        (item.expiry_date - datetime.utcnow()).days
                        if item.expiry_date else None
                    ),
                }
                for item in items
            ],
        }
    
    @staticmethod
    def check_ingredient_availability(
        db: Session,
        user_id: int,
        ingredient_name: str,
    ) -> dict:
        """Check if ingredient is available in inventory."""
        item = db.query(InventoryItem).filter(
            InventoryItem.user_id == user_id,
            InventoryItem.food_name.ilike(f"%{ingredient_name}%"),
        ).first()
        
        if not item:
            return {
                "available": False,
                "quantity": 0,
                "expiry_date": None,
            }
        
        return {
            "available": True,
            "quantity": item.quantity,
            "unit": item.unit,
            "expiry_date": item.expiry_date,
            "is_expired": (
                item.expiry_date.date() < datetime.utcnow().date()
                if item.expiry_date else False
            ),
        }


def get_inventory_service() -> InventoryService:
    """Dependency for getting inventory service."""
    return InventoryService()
