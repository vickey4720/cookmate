"""
COOKMATE — Full-Stack Food Platform & Smart Recipe Companion
Main Application Server (Python Flask)
"""

import os
import re
import uuid
import datetime
from functools import wraps

from flask import (
    Flask, render_template, request, redirect, url_for,
    session, flash, jsonify, abort
)
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import requests

from config import Config, BASE_DIR
import db

# -----------------------------------------------------------------------------
# Initialize Flask Application
# -----------------------------------------------------------------------------
app = Flask(__name__)
app.config.from_object(Config)

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# -----------------------------------------------------------------------------
# Security & Authorization Decorators
# -----------------------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            flash('Please sign in to access this page.', 'error')
            return redirect(url_for('signin', next=request.url))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            flash('Admin access required. Please sign in.', 'error')
            return redirect(url_for('signin', next=request.url))
        if session.get('user_role') != 'admin':
            flash('Access denied. Administrator privileges required.', 'error')
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

# -----------------------------------------------------------------------------
# Customer Facing Page Routes
# -----------------------------------------------------------------------------
@app.route('/')
@app.route('/home')
def home():
    """CookMate Home Page (Reference Image 1 & Phase 5)"""
    # Fetch top 4 featured food items from MySQL
    featured_food = db.query(
        "SELECT * FROM food_items WHERE is_available = 1 ORDER BY rating DESC LIMIT 4",
        fetch='all'
    ) or []
    return render_template('index.html', active_page='home', featured_food=featured_food)

@app.route('/recipes')
def recipes_page():
    """Recipe Discovery Page powered by TheMealDB (Phase 6)"""
    return render_template('recipes.html', active_page='recipes')

@app.route('/food-order')
def food_order_page():
    """Customer Food Ordering Menu (MySQL Data, Phase 7)"""
    items = db.query(
        "SELECT * FROM food_items ORDER BY category, name",
        fetch='all'
    ) or []
    return render_template('food_order.html', active_page='food_order', items=items)

@app.route('/favorites')
def favorites_page():
    """Customer Favorites Page (Strictly matching Reference Image 4)"""
    user_id = session.get('user_id')
    if not user_id:
        flash('Sign in to view and save your favorite recipes!', 'info')
        return redirect(url_for('signin', next=url_for('favorites_page')))
    
    favorites = db.query(
        "SELECT * FROM favorites WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,), fetch='all'
    ) or []
    return render_template('favorites.html', active_page='favorites', favorites=favorites)

@app.route('/ai-chef')
def ai_chef_page():
    """Voice-Enabled AI Chef with 3D Character (Strictly matching Reference Image 2)"""
    return render_template('ai_chef.html', active_page='ai_chef')

@app.route('/about')
def about_page():
    """About CookMate & Contact Page (Strictly matching Reference Image 5)"""
    return render_template('about.html', active_page='about')

# -----------------------------------------------------------------------------
# User Authentication (Sign In & Sign Up — Reference Image 3)
# -----------------------------------------------------------------------------
@app.route('/signin', methods=['GET', 'POST'])
def signin():
    """Sign In handler with secure password verification"""
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        
        if not email or not password:
            flash('Please enter both email and password.', 'error')
            return render_template('signin.html')
            
        user = db.query("SELECT * FROM users WHERE email = %s", (email,), fetch='one')
        if user and check_password_hash(user['password_hash'], password):
            # Establish session
            session.clear()
            session['user_id'] = user['id']
            session['user_name'] = user['name']
            session['user_email'] = user['email']
            session['user_role'] = user.get('role', 'customer')
            session.permanent = True
            
            flash(f"Welcome back, {user['name']}!", 'success')
            next_url = request.args.get('next')
            if user.get('role') == 'admin':
                return redirect(next_url or url_for('admin_dashboard'))
            return redirect(next_url or url_for('home'))
        else:
            flash('Invalid email or password. Please try again.', 'error')
            
    return render_template('signin.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    """Sign Up handler with input validation and duplicate prevention"""
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # Validations
        if not name or not email or not password:
            flash('All fields are required.', 'error')
            return render_template('signup.html')

        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('signup.html')

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return render_template('signup.html')

        # Check existing user
        existing = db.query("SELECT id FROM users WHERE email = %s", (email,), fetch='one')
        if existing:
            flash('An account with this email already exists. Please sign in.', 'error')
            return redirect(url_for('signin'))

        # Create user (always customer role for public registration)
        pwd_hash = generate_password_hash(password)
        user_id = db.execute(
            """INSERT INTO users (name, email, password_hash, role)
               VALUES (%s, %s, %s, 'customer')""",
            (name, email, pwd_hash)
        )

        session.clear()
        session['user_id'] = user_id
        session['user_name'] = name
        session['user_email'] = email
        session['user_role'] = 'customer'
        session.permanent = True

        flash(f"Welcome to CookMate, {name}! Your account has been created.", 'success')
        return redirect(url_for('home'))

    return render_template('signup.html')

@app.route('/signout')
def signout():
    """Log out customer or admin"""
    session.clear()
    flash('You have been signed out.', 'info')
    return redirect(url_for('home'))

# -----------------------------------------------------------------------------
# Cart & Checkout Logic (Phase 7 & Phase 8)
# -----------------------------------------------------------------------------
def get_user_cart(user_id):
    """Retrieve authoritative cart items and calculate totals using database prices."""
    rows = db.query("""
        SELECT c.id as cart_id, c.quantity, f.id as food_item_id, f.name,
               f.price, f.discount_price, f.image_url, f.is_available
        FROM cart_items c
        JOIN food_items f ON c.food_item_id = f.id
        WHERE c.user_id = %s
    """, (user_id,), fetch='all') or []

    total = 0.0
    for r in rows:
        unit_price = float(r['discount_price'] if r['discount_price'] else r['price'])
        total += unit_price * r['quantity']
        
    return rows, round(total, 2)

@app.route('/checkout')
@login_required
def checkout_page():
    """Checkout Page with delivery details and COD order summary"""
    user_id = session['user_id']
    cart_items, total_amount = get_user_cart(user_id)
    user = db.query("SELECT * FROM users WHERE id = %s", (user_id,), fetch='one')
    return render_template(
        'checkout.html',
        cart_items=cart_items,
        total_amount=total_amount,
        user=user
    )

@app.route('/orders/place', methods=['POST'])
@login_required
def place_order():
    """Place Order with transactional safety and authoritative price calculation"""
    user_id = session['user_id']
    customer_name = request.form.get('customer_name', '').strip()
    customer_phone = request.form.get('customer_phone', '').strip()
    customer_email = request.form.get('customer_email', '').strip()
    delivery_address = request.form.get('delivery_address', '').strip()
    payment_method = request.form.get('payment_method', 'Cash on Delivery')
    notes = request.form.get('notes', '').strip()

    if not customer_name or not customer_phone or not delivery_address:
        flash('Please fill in all required delivery information.', 'error')
        return redirect(url_for('checkout_page'))

    # Retrieve authoritative cart items
    cart_items, total_amount = get_user_cart(user_id)
    if not cart_items:
        flash('Your shopping cart is empty.', 'error')
        return redirect(url_for('food_order_page'))

    # Verify item availability
    for item in cart_items:
        if not item['is_available']:
            flash(f"Sorry, '{item['name']}' is currently out of stock. Please remove it from your cart.", 'error')
            return redirect(url_for('checkout_page'))

    # Generate unique Order ID (e.g. ORD-2026-A1B2)
    order_number = f"ORD-2026-{uuid.uuid4().hex[:6].upper()}"

    # Create Order Header within database
    order_id = db.execute("""
        INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, delivery_address, total_amount, payment_method, status, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Placed', %s)
    """, (order_number, user_id, customer_name, customer_email, customer_phone, delivery_address, total_amount, payment_method, notes))

    # Create snapshot for each Order Item
    for item in cart_items:
        unit_price = float(item['discount_price'] if item['discount_price'] else item['price'])
        line_total = unit_price * item['quantity']
        db.execute("""
            INSERT INTO order_items (order_id, food_item_id, item_name, unit_price, quantity, line_total)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (order_id, item['food_item_id'], item['name'], unit_price, item['quantity'], line_total))

    # Clear user's cart
    db.execute("DELETE FROM cart_items WHERE user_id = %s", (user_id,))

    flash(f"Order #{order_number} has been placed successfully!", 'success')
    return redirect(url_for('order_confirmation', order_number=order_number))

@app.route('/orders/confirmation/<order_number>')
@login_required
def order_confirmation(order_number):
    """Order placed confirmation screen"""
    user_id = session['user_id']
    order = db.query(
        "SELECT * FROM orders WHERE order_number = %s AND user_id = %s",
        (order_number, user_id), fetch='one'
    )
    if not order:
        abort(404)
        
    items = db.query(
        "SELECT * FROM order_items WHERE order_id = %s",
        (order['id'],), fetch='all'
    ) or []
    
    return render_template('order_confirmation.html', order=order, items=items)

@app.route('/my-orders')
@login_required
def my_orders_page():
    """Customer order history page"""
    user_id = session['user_id']
    orders = db.query(
        "SELECT * FROM orders WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,), fetch='all'
    ) or []

    # Attach item details to each order
    for o in orders:
        o['items'] = db.query(
            "SELECT * FROM order_items WHERE order_id = %s",
            (o['id'],), fetch='all'
        ) or []

    return render_template('my_orders.html', active_page='orders', orders=orders)

# -----------------------------------------------------------------------------
# REST APIs for Cart, Favorites, Contact & AI Chef
# -----------------------------------------------------------------------------
@app.route('/api/cart', methods=['GET'])
def api_get_cart():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': True, 'cart': [], 'total': 0.0})
    cart_items, total = get_user_cart(user_id)
    return jsonify({'success': True, 'cart': cart_items, 'total': total})

@app.route('/api/cart/add', methods=['POST'])
def api_add_cart():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'require_auth': True, 'message': 'Please sign in to add items to your cart.'})
        
    data = request.get_json() or {}
    food_id = data.get('food_item_id')
    quantity = int(data.get('quantity', 1))

    food = db.query("SELECT * FROM food_items WHERE id = %s", (food_id,), fetch='one')
    if not food or not food['is_available']:
        return jsonify({'success': False, 'error': 'Item is not available'})

    existing = db.query(
        "SELECT id, quantity FROM cart_items WHERE user_id = %s AND food_item_id = %s",
        (user_id, food_id), fetch='one'
    )
    if existing:
        new_qty = existing['quantity'] + quantity
        db.execute(
            "UPDATE cart_items SET quantity = %s WHERE id = %s",
            (new_qty, existing['id'])
        )
    else:
        db.execute(
            "INSERT INTO cart_items (user_id, food_item_id, quantity) VALUES (%s, %s, %s)",
            (user_id, food_id, quantity)
        )
        
    return jsonify({'success': True, 'message': f"Added '{food['name']}' to cart!"})

@app.route('/api/cart/update', methods=['POST'])
def api_update_cart():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'require_auth': True})
    data = request.get_json() or {}
    food_id = data.get('food_item_id')
    quantity = int(data.get('quantity', 1))

    if quantity <= 0:
        db.execute("DELETE FROM cart_items WHERE user_id = %s AND food_item_id = %s", (user_id, food_id))
    else:
        db.execute("UPDATE cart_items SET quantity = %s WHERE user_id = %s AND food_item_id = %s", (quantity, user_id, food_id))
    return jsonify({'success': True})

@app.route('/api/cart/remove', methods=['POST'])
def api_remove_cart():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'require_auth': True})
    data = request.get_json() or {}
    food_id = data.get('food_item_id')
    db.execute("DELETE FROM cart_items WHERE user_id = %s AND food_item_id = %s", (user_id, food_id))
    return jsonify({'success': True})

@app.route('/api/favorites/ids', methods=['GET'])
def api_favorites_ids():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': True, 'favorite_ids': []})
    rows = db.query("SELECT meal_id FROM favorites WHERE user_id = %s", (user_id,), fetch='all') or []
    fav_ids = [str(r['meal_id']) for r in rows]
    return jsonify({'success': True, 'favorite_ids': fav_ids})

@app.route('/api/favorites/toggle', methods=['POST'])
def api_favorites_toggle():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'success': False, 'require_auth': True, 'message': 'Please sign in to save your favorite recipes.'})
        
    data = request.get_json() or {}
    meal_id = str(data.get('meal_id', '')).strip()
    meal_name = data.get('meal_name', 'Delicious Recipe').strip()
    meal_thumb = data.get('meal_thumb', '')
    meal_category = data.get('meal_category', 'General')

    if not meal_id:
        return jsonify({'success': False, 'error': 'Invalid recipe identifier'})

    existing = db.query(
        "SELECT id FROM favorites WHERE user_id = %s AND meal_id = %s",
        (user_id, meal_id), fetch='one'
    )
    if existing:
        db.execute("DELETE FROM favorites WHERE id = %s", (existing['id'],))
        return jsonify({'success': True, 'is_favorite': False, 'message': f"Removed '{meal_name}' from favorites."})
    else:
        db.execute("""
            INSERT INTO favorites (user_id, meal_id, meal_name, meal_thumb, meal_category)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, meal_id, meal_name, meal_thumb, meal_category))
        return jsonify({'success': True, 'is_favorite': True, 'message': f"Saved '{meal_name}' to your favorites! ❤️"})

@app.route('/api/contact', methods=['POST'])
def api_contact():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    subject = data.get('subject', '').strip()
    message = data.get('message', '').strip()

    if not name or not email or not message:
        return jsonify({'success': False, 'error': 'Please fill in your name, email, and message.'})

    db.execute("""
        INSERT INTO contact_messages (name, email, subject, message)
        VALUES (%s, %s, %s, %s)
    """, (name, email, subject or 'Inquiry', message))

    return jsonify({'success': True, 'message': 'Thank you! Your message has been sent to Vickey. We will respond shortly.'})

# -----------------------------------------------------------------------------
# AI Chef Voice & NLP Backend Engine (Phase 9)
# -----------------------------------------------------------------------------
@app.route('/api/ai-chef/ask', methods=['POST'])
def api_ai_chef_ask():
    """
    Intelligent Culinary AI Assistant Endpoint
    Processes user questions, calls external AI API if key configured,
    or utilizes expert culinary knowledge base.
    """
    data = request.get_json() or {}
    question = data.get('question', '').strip()
    if not question:
        return jsonify({'success': False, 'error': 'Please provide a cooking question.'})

    # If external AI API Key is provided, call external AI provider
    if Config.AI_API_KEY and Config.AI_API_KEY != 'your_ai_api_key_here':
        try:
            # Gemini API call
            if Config.AI_PROVIDER == 'gemini':
                gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={Config.AI_API_KEY}"
                payload = {
                    "contents": [{
                        "parts": [{
                            "text": f"You are Chef CookMate, an energetic, friendly, and expert cartoon 3D Chef. Answer the following culinary or recipe question concisely, warmly, and clearly in 3 to 5 sentences or bulleted cooking steps. If asked in Hindi or Hinglish, reply in friendly Hinglish matching the CookMate culinary style. Question: {question}"
                        }]
                    }]
                }
                res = requests.post(gemini_url, json=payload, timeout=8)
                if res.status_code == 200:
                    ai_json = res.json()
                    answer = ai_json['candidates'][0]['content']['parts'][0]['text']
                    return jsonify({'success': True, 'answer': answer, 'speech_text': answer})
        except Exception as e:
            print(f"External AI API error: {e}. Falling back to internal culinary engine.")

    # High-Performance Internal Culinary Knowledge Engine
    q_lower = question.lower()

    # Case 1: Hindi / Hinglish prompt matching Reference Image 2
    if 'aloo' in q_lower and 'paneer' in q_lower:
        answer = (
            "Aap aloo aur paneer se bahut saari tasty dishes bana sakte hain. Yahan 3 best options hain:\n\n"
            "1. **Aloo Paneer ki Sabzi** — Rich tomato-onion gravy with aromatic spices and soft paneer cubes.\n"
            "2. **Aloo Paneer Paratha** — Crispy whole wheat flatbread stuffed with spiced mashed potatoes and grated paneer.\n"
            "3. **Aloo Paneer Sandwich** — Crispy toasted bread with potato paneer filling and fresh green mint chutney.\n\n"
            "Main aapko Aloo Paneer ki Sabzi ki recipe step-by-step bata deta hun. Ready?"
        )
        return jsonify({
            'success': True,
            'answer': answer,
            'speech_text': "Aap aloo aur paneer se bahut saari tasty dishes bana sakte hain: Aloo Paneer ki Sabzi, Aloo Paneer Paratha, ya Aloo Paneer Sandwich.",
            'dish_image': "https://www.themealdb.com/images/media/meals/uwxqwy1483389553.jpg"
        })

    # Case 2: Pasta recipes & technique
    elif 'pasta' in q_lower:
        answer = (
            "Here is how to make restaurant-quality creamy pasta in 20 minutes:\n\n"
            "1. **Boil Pasta**: Cook penne or fettuccine in heavily salted boiling water until al dente. Reserve half a cup of pasta water before draining.\n"
            "2. **Garlic Butter**: Sauté minced garlic in butter and olive oil over medium heat for 1 minute.\n"
            "3. **Cream & Cheese**: Pour in heavy cream and grated parmesan cheese. Stir until smooth.\n"
            "4. **Toss**: Add the drained pasta and a splash of reserved pasta water. Season with black pepper, fresh basil, and chili flakes!"
        )
        return jsonify({
            'success': True,
            'answer': answer,
            'speech_text': "To make creamy pasta: boil pasta until al dente, sauté garlic in butter, add heavy cream and parmesan, then toss together with reserved pasta water.",
            'dish_image': "/static/images/pasta-skillet.jpg"
        })

    # Case 3: Pizza questions
    elif 'pizza' in q_lower:
        answer = (
            "For a perfect crispy pizza at home:\n\n"
            "1. **High Oven Heat**: Preheat your oven to its highest setting (250°C / 480°F) with your baking tray inside.\n"
            "2. **Thin Dough Base**: Roll out dough thin in the center with a slightly thicker puffy crust edge.\n"
            "3. **Toppings & Mozzarella**: Spread seasoned tomato sauce, shredded mozzarella, and fresh basil leaves.\n"
            "4. **Bake 8-10 mins**: Bake until the crust is deeply golden brown and cheese is bubbling!"
        )
        return jsonify({
            'success': True,
            'answer': answer,
            'speech_text': "For perfect pizza, preheat your oven to maximum temperature, roll the dough thin, top with sauce and mozzarella, and bake for eight to ten minutes.",
            'dish_image': "/static/images/pizza.jpg"
        })

    # Case 4: Biryani guidance
    elif 'biryani' in q_lower:
        answer = (
            "The secret to authentic royal Dum Biryani lies in the layering and aromatics:\n\n"
            "1. **Marination**: Marinate chicken with yogurt, ginger-garlic paste, garam masala, turmeric, and lemon juice for at least 1 hour.\n"
            "2. **Rice Par-boil**: Cook long-grain basmati rice with whole spices (cardamom, cloves, bay leaf) until exactly 70% done.\n"
            "3. **Dum Layering**: Layer cooked meat gravy, rice, crispy fried onions (birista), mint leaves, and saffron milk.\n"
            "4. **Slow Cook**: Seal tightly with a lid and cook on low flame (dum) for 20 minutes."
        )
        return jsonify({
            'success': True,
            'answer': answer,
            'speech_text': "The key to authentic Biryani is marinating with spiced yogurt, boiling basmati rice until seventy percent done, and slow-cooking on dum with fried onions and saffron.",
            'dish_image': "https://www.themealdb.com/images/media/meals/xr004r1606764831.jpg"
        })

    # Case 5: Substitutions
    elif 'substitute' in q_lower or 'substitution' in q_lower:
        if 'buttermilk' in q_lower:
            answer = "For 1 cup of buttermilk, mix 1 tablespoon of fresh lemon juice or white vinegar into 1 cup of whole milk. Let sit for 5 minutes until slightly curdled!"
        elif 'heavy cream' in q_lower or 'cream' in q_lower:
            answer = "To substitute 1 cup of heavy cream, melt 1/4 cup of butter and whisk thoroughly into 3/4 cup of whole milk, or blend soft silken tofu for a vegan alternative."
        elif 'egg' in q_lower:
            answer = "For baking, substitute 1 egg with 1/4 cup of unsweetened applesauce, half a mashed ripe banana, or 1 tablespoon of ground flaxseed mixed with 3 tablespoons of warm water."
        else:
            answer = "Tell me which specific ingredient you want to substitute (e.g. buttermilk, heavy cream, egg, or cornstarch) and I will give you the exact culinary ratio!"
        return jsonify({'success': True, 'answer': answer, 'speech_text': answer})

    # Case 6: General cooking / step by step advice
    else:
        answer = (
            f"Here is Chef CookMate's expert advice on '{question}':\n\n"
            "1. **Fresh Prep**: Always prep and chop all ingredients before turning on the stove (mise en place).\n"
            "2. **Season in Layers**: Add a pinch of salt at each stage of cooking rather than only at the end to deepen the dish's flavor.\n"
            "3. **Control Your Heat**: Sauté aromatics on medium-low heat to release sweetness without burning, then sear meats on high heat for browning.\n\n"
            "Would you like a step-by-step recipe or ingredient measurements for this dish?"
        )
        return jsonify({
            'success': True,
            'answer': answer,
            'speech_text': f"To make {question}, prep ingredients in advance, season lightly in layers, and balance your heat between gentle simmering and golden searing.",
            'dish_image': "/static/images/pasta-skillet.jpg"
        })

# -----------------------------------------------------------------------------
# Admin Panel Routes (Phase 7 & Phase 8 — strictly matching Reference Image 1)
# -----------------------------------------------------------------------------
@app.route('/admin')
@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    """Admin Dashboard Overview"""
    stats = {}
    stats['total_revenue'] = (db.query("SELECT SUM(total_amount) as total FROM orders", fetch='one') or {}).get('total') or 0.0
    stats['total_orders'] = (db.query("SELECT COUNT(*) as cnt FROM orders", fetch='one') or {}).get('cnt') or 0
    stats['total_food'] = (db.query("SELECT COUNT(*) as cnt FROM food_items", fetch='one') or {}).get('cnt') or 0
    stats['total_users'] = (db.query("SELECT COUNT(*) as cnt FROM users", fetch='one') or {}).get('cnt') or 0

    recent_orders = db.query(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5",
        fetch='all'
    ) or []

    return render_template('admin/dashboard.html', admin_page='dashboard', stats=stats, recent_orders=recent_orders)

@app.route('/admin/food/add', methods=['GET', 'POST'])
@admin_required
def admin_add_food():
    """Add Food Item (Strictly matching Reference Image 1 with Live Preview)"""
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        price = float(request.form.get('price', 0) or 0)
        discount_price_raw = request.form.get('discount_price', '').strip()
        discount_price = float(discount_price_raw) if discount_price_raw else None
        category = request.form.get('category', '').strip()
        description = request.form.get('description', '').strip()
        prep_time = request.form.get('prep_time', '20 mins').strip()
        serving_size = request.form.get('serving_size', '2 persons').strip()
        rating = float(request.form.get('rating', 4.5) or 4.5)

        if not name or price <= 0 or not category or not description:
            flash('Please complete all required fields.', 'error')
            return redirect(url_for('admin_add_food'))

        # Handle image upload
        image_url = '/static/images/pizza.jpg'
        if 'food_image' in request.files:
            file = request.files['food_image']
            if file and file.filename and allowed_file(file.filename):
                safe_name = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
                upload_path = os.path.join(app.config['UPLOAD_FOLDER'], safe_name)
                file.save(upload_path)
                image_url = f"/static/uploads/{safe_name}"

        # Insert food item into MySQL
        db.execute("""
            INSERT INTO food_items (name, category, price, discount_price, description, prep_time, serving_size, rating, image_url, is_available)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
        """, (name, category, price, discount_price, description, prep_time, serving_size, rating, image_url))

        flash(f"Food item '{name}' added to menu successfully!", 'success')
        return redirect(url_for('admin_manage_food'))

    return render_template('admin/add_food.html', admin_page='add_food')

@app.route('/admin/food/manage')
@admin_required
def admin_manage_food():
    """Manage food items list and availability"""
    items = db.query("SELECT * FROM food_items ORDER BY created_at DESC", fetch='all') or []
    return render_template('admin/manage_food.html', admin_page='manage_food', items=items)

@app.route('/admin/food/<int:item_id>/toggle-availability', methods=['POST'])
@admin_required
def admin_toggle_food_availability(item_id):
    """Toggle whether a food item is available or sold out"""
    item = db.query("SELECT is_available, name FROM food_items WHERE id = %s", (item_id,), fetch='one')
    if not item:
        return jsonify({'success': False, 'error': 'Item not found'})

    new_status = 0 if item['is_available'] else 1
    db.execute("UPDATE food_items SET is_available = %s WHERE id = %s", (new_status, item_id))
    status_str = "Available" if new_status else "Sold Out"
    return jsonify({'success': True, 'message': f"'{item['name']}' is now marked as {status_str}."})

@app.route('/admin/food/<int:item_id>/delete', methods=['POST'])
@admin_required
def admin_delete_food(item_id):
    """Delete food item from database"""
    item = db.query("SELECT name FROM food_items WHERE id = %s", (item_id,), fetch='one')
    if item:
        db.execute("DELETE FROM food_items WHERE id = %s", (item_id,))
        flash(f"Item '{item['name']}' deleted from menu.", 'info')
    return redirect(url_for('admin_manage_food'))

@app.route('/admin/orders')
@admin_required
def admin_orders():
    """View and manage customer orders"""
    orders = db.query("SELECT * FROM orders ORDER BY created_at DESC", fetch='all') or []
    for o in orders:
        o['items'] = db.query("SELECT * FROM order_items WHERE order_id = %s", (o['id'],), fetch='all') or []
    return render_template('admin/orders.html', admin_page='orders', orders=orders)

@app.route('/admin/orders/<int:order_id>/status', methods=['POST'])
@admin_required
def admin_update_order_status(order_id):
    """Update order delivery status"""
    data = request.get_json() or {}
    new_status = data.get('status')
    valid_statuses = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled']
    
    if new_status not in valid_statuses:
        return jsonify({'success': False, 'error': 'Invalid order status transition'})

    db.execute("UPDATE orders SET status = %s WHERE id = %s", (new_status, order_id))
    return jsonify({'success': True, 'message': f"Order status updated to '{new_status}'."})

# -----------------------------------------------------------------------------
# Main Application Entrypoint
# -----------------------------------------------------------------------------
if __name__ == '__main__':
    # Initialize and seed database if necessary
    import seed_data
    seed_data.seed_database()
    
    # Run server locally
    port = int(os.environ.get('PORT', 5000))
    print(f"\n=======================================================")
    print(f" COOKMATE PLATFORM RUNNING AT http://127.0.0.1:{port}")
    print(f" Admin Login: admin@cookmate.com | Password: Admin@123")
    print(f" Customer Login: vickey.dev.in@gmail.com | Password: Password@123")
    print(f"=======================================================\n")
    app.run(host='0.0.0.0', port=port, debug=True)
