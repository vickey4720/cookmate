"""
Database Seed Script for CookMate
Populates the database with initial admin and customer accounts, menu items, and initial data.
"""

from werkzeug.security import generate_password_hash
import db

def seed_database():
    print("[CookMate Seeder] Initializing database tables...")
    db.init_db()
    
    # 1. Seed Admin User
    existing_admin = db.query("SELECT id FROM users WHERE email = %s", ('admin@cookmate.com',), fetch='one')
    if not existing_admin:
        admin_pass = generate_password_hash('Admin@123')
        db.execute(
            """INSERT INTO users (name, email, password_hash, role, phone)
               VALUES (%s, %s, %s, %s, %s)""",
            ('CookMate Admin', 'admin@cookmate.com', admin_pass, 'admin', '7464838401')
        )
        print("[CookMate Seeder] Created Admin: admin@cookmate.com (Password: Admin@123)")
    else:
        print("[CookMate Seeder] Admin account already exists.")

    # 2. Seed Customer User (Vicky)
    existing_user = db.query("SELECT id FROM users WHERE email = %s", ('vickey.dev.in@gmail.com',), fetch='one')
    user_id = None
    if not existing_user:
        cust_pass = generate_password_hash('Password@123')
        user_id = db.execute(
            """INSERT INTO users (name, email, password_hash, role, phone)
               VALUES (%s, %s, %s, %s, %s)""",
            ('Vicky', 'vickey.dev.in@gmail.com', cust_pass, 'customer', '7464838401')
        )
        print("[CookMate Seeder] Created Customer: vickey.dev.in@gmail.com (Password: Password@123)")
    else:
        user_id = existing_user['id']
        print("[CookMate Seeder] Customer account already exists.")

    # 3. Seed Menu Items
    existing_items = db.query("SELECT COUNT(*) as count FROM food_items", fetch='one')
    if existing_items and existing_items['count'] == 0:
        items = [
            (
                "Margherita Pizza", "Pizza", 249.00, 199.00,
                "Delicious cheesy pizza with fresh toppings, Italian herbs, mozzarella and vine tomatoes.",
                "20 mins", "2 persons", 4.5, "/static/images/pizza.jpg", 1
            ),
            (
                "Gourmet Cheeseburger", "Burgers", 299.00, 229.00,
                "Double grilled patty with melted cheddar, crisp lettuce, red onion, pickles, and crispy fries.",
                "15 mins", "1 person", 4.8, "/static/images/burger.jpg", 1
            ),
            (
                "Creamy Pasta Alfredo", "Pasta", 260.00, 210.00,
                "Rich creamy penne pasta cooked in a parmesan garlic herb butter sauce with cherry tomatoes.",
                "25 mins", "2 persons", 4.6, "/static/images/pasta-skillet.jpg", 1
            ),
            (
                "Royal Chicken Biryani", "Biryani", 349.00, 289.00,
                "Authentic royal dum biryani with marinated tender chicken pieces and aromatic long-grain basmati rice.",
                "45 mins", "2 persons", 4.7, "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80", 1
            ),
            (
                "Paneer Butter Masala", "Main Course", 279.00, 239.00,
                "Fresh cottage cheese cubes simmered in a rich buttery tomato and cashew gravy.",
                "30 mins", "2 persons", 4.5, "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80", 1
            ),
            (
                "Chocolate Lava Cake", "Dessert", 180.00, 149.00,
                "Warm decadent molten chocolate cake with a rich liquid fudge center and dusting of sugar.",
                "20 mins", "1 person", 4.9, "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&auto=format&fit=crop&q=80", 1
            ),
            (
                "Crispy Masala Dosa", "South Indian", 160.00, 129.00,
                "Traditional golden crispy dosa crepe stuffed with spiced potato masala, served with coconut chutney.",
                "20 mins", "1 person", 4.6, "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80", 1
            ),
            (
                "Veg Manchurian Gravy", "Chinese", 220.00, 180.00,
                "Crisp vegetable dumplings simmered in a savory and spicy Indo-Chinese garlic soy sauce.",
                "25 mins", "2 persons", 4.4, "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80", 1
            )
        ]
        for itm in items:
            db.execute("""
                INSERT INTO food_items (name, category, price, discount_price, description, prep_time, serving_size, rating, image_url, is_available)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, itm)
        print(f"[CookMate Seeder] Successfully seeded {len(items)} food items.")
    else:
        print("[CookMate Seeder] Food items already exist.")

    # 4. Seed initial favorites for Vicky (matching Reference Image 4)
    if user_id:
        existing_favs = db.query("SELECT COUNT(*) as count FROM favorites WHERE user_id = %s", (user_id,), fetch='one')
        if existing_favs and existing_favs['count'] == 0:
            sample_favs = [
                ("52772", "Chicken Biryani", "https://www.themealdb.com/images/media/meals/xr004r1606764831.jpg", "Chicken"),
                ("53014", "Margherita Pizza", "https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg", "Vegetarian"),
                ("52844", "Paneer Butter Masala", "https://www.themealdb.com/images/media/meals/uwxqwy1483389553.jpg", "Vegetarian"),
                ("52835", "Pasta Alfredo", "https://www.themealdb.com/images/media/meals/yqsrrm1483389599.jpg", "Pasta"),
                ("52948", "Masala Dosa", "https://www.themealdb.com/images/media/meals/v9xx781581014109.jpg", "Vegetarian"),
                ("52768", "Chocolate Lava Cake", "https://www.themealdb.com/images/media/meals/twspvx1511784937.jpg", "Dessert"),
                ("52955", "Veg Manchurian", "https://www.themealdb.com/images/media/meals/1529446352.jpg", "Vegetarian"),
                ("52807", "Chole Bhature", "https://www.themealdb.com/images/media/meals/wxyvqq1511723401.jpg", "Vegetarian")
            ]
            for fav in sample_favs:
                db.execute("""
                    INSERT INTO favorites (user_id, meal_id, meal_name, meal_thumb, meal_category)
                    VALUES (%s, %s, %s, %s, %s)
                """, (user_id, fav[0], fav[1], fav[2], fav[3]))
            print(f"[CookMate Seeder] Seeded {len(sample_favs)} favorite recipes for Vicky.")

    print("[CookMate Seeder] Database setup complete!")

if __name__ == '__main__':
    seed_database()
