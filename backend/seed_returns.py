from app import create_app
from app.models import db
from app.models.returns import Return, ReturnStatus
from app.models.order import Order
from app.models.user import User
import uuid

app = create_app()

with app.app_context():
    # Get first order and user
    order = Order.query.first()
    user = User.query.filter_by(email='customer@test.com').first()
    
    if order and user:
        # Create sample returns
        returns_data = [
            {'reason': 'Product defective', 'status': ReturnStatus.PENDING},
            {'reason': 'Wrong item received', 'status': ReturnStatus.APPROVED},
            {'reason': 'Changed my mind', 'status': ReturnStatus.REJECTED},
            {'reason': 'Not as described', 'status': ReturnStatus.COMPLETED},
        ]
        
        for data in returns_data:
            ret = Return(
                id=str(uuid.uuid4()),
                order_id=order.id,
                user_id=user.id,
                reason=data['reason'],
                status=data['status']
            )
            db.session.add(ret)
        
        db.session.commit()
        print(f'Created {len(returns_data)} sample returns')
    else:
        print('No orders or users found. Run seed_all.py first.')
