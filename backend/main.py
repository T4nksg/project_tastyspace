from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt, jwt_required, get_jwt_identity
from datetime import timedelta
from db import close_db, get_db, init_db
from psycopg2.extras import RealDictCursor
from werkzeug.utils import secure_filename
import os
import uuid
from models.matching_dishes import find_matching_dishes
from models.aggregate_ingredients import aggregate_ingredients


app = Flask(__name__)
app.config.from_prefixed_env()
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
FRONTEND_URL = app.config.get("FRONTEND_URL", "http://localhost:5173")
cors = CORS(app, origins=FRONTEND_URL, methods=["GET", "POST", "DELETE", "PUT"], allow_headers=["Authorization", "Content-Type"])
jwt = JWTManager(app)
BASE_DIR = os.path.abspath(os.path.dirname(__file__)) 
relative_path = os.getenv('FLASK_UPLOAD_FOLDER', 'default/path') 
app.config['UPLOAD_FOLDER'] = os.path.join(BASE_DIR, relative_path) 

@app.route('/images/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename) 

@app.route("/login", methods=["POST"])
def login() -> dict:
    data = request.get_json()
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    cursor.execute(
        "SELECT id FROM users WHERE username = %s AND password = %s",
        (data["username"], data["password"]),
    )
    user = cursor.fetchone()
    if user is None:
        return {"error": "Invalid username or password"}
    else:
        access_token = create_access_token(identity=user["id"])
        return {"access_token": access_token}
    
@app.route("/check_username", methods=["POST"])
def check_username():
    data = request.get_json()
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT id FROM users WHERE username = %s", (data["username"],))
    user = cursor.fetchone()
    if user is None:
        return jsonify({"valid": False})
    return jsonify({"valid": True})
    
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    role = data.get('role')  

    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute(
            "INSERT INTO users (username, password, email, role) VALUES (%s, %s, %s, %s) RETURNING id",
            (username, password, email, role)
        )
        user = cursor.fetchone()
        db.commit()
        access_token = create_access_token(identity=user["id"])
        return jsonify(access_token=access_token, message="User registered successfully"), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 400
    
@app.route("/users/me", methods=["GET", "PUT"])
@jwt_required()
def get_me() -> dict:
    token_data = get_jwt()
    user_id = token_data["sub"]
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    
    if request.method == "GET":
        # Получаем основную информацию о пользователе
        cursor.execute("SELECT id, username, role, email, created, password FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if user is None:
            return {"error": "User not found"}
        
        # Считаем количество сохраненных меню
        cursor.execute("SELECT COUNT(*) FROM menus WHERE user_id = %s AND removed IS NULL", (user_id,))
        saved_menus_count = cursor.fetchone()['count']
        
        # Считаем количество добавленных рецептов для авторов
        if user['role'] == 'author':
            cursor.execute("SELECT COUNT(*) FROM dishes WHERE author_id = %s", (user_id,))
            recipes_count = cursor.fetchone()['count']
        
        # Считаем количество отмодерированных рецептов для модераторов
        elif user['role'] == 'moderator':
            cursor.execute("SELECT COUNT(*) FROM moderation WHERE moderator_id = %s", (user_id,))
            recipes_count = cursor.fetchone()['count']
        
        else:
            recipes_count = 0
        
        return {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "email": user["email"],
            "created": user["created"],
            "password": user["password"],
            "saved_menus_count": saved_menus_count,
            "recipes_count": recipes_count
        }
    
    if request.method == "PUT":
        data = request.get_json()
        update_fields = []
        update_values = []
        
        if "username" in data:
            update_fields.append("username = %s")
            update_values.append(data["username"])
        
        if "password" in data:
            update_fields.append("password = %s")
            update_values.append(data["password"])
        
        if "email" in data:
            update_fields.append("email = %s")
            update_values.append(data["email"])
        
        if not update_fields:
            return jsonify({"error": "No valid fields provided for update"}), 400
        
        update_values.append(user_id)
        
        try:
            cursor.execute(f'''
                UPDATE users
                SET {', '.join(update_fields)}, edited = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', tuple(update_values))
            db.commit()
            return jsonify({"message": "User information updated successfully"}), 200
        except Exception as e:
            db.rollback()
            return jsonify({"error": str(e)}), 500
    
@app.route('/addRecipe', methods=['POST'])
@jwt_required()
def add_recipe():
    token_data = get_jwt()
    user_id = token_data["sub"]
    title = request.form.get('title', '')
    description = request.form.get('description', '')
    
    image_file = request.files.get('image')
    image_url = 'default_img.jpg'  # Default image

    if image_file:
        ext = image_file.filename.rsplit('.', 1)[1].lower() if '.' in image_file.filename else ''
        unique_filename = secure_filename(f"{uuid.uuid4()}.{ext}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        image_file.save(file_path)
        image_url = unique_filename  
    
    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute('''
            INSERT INTO dishes (title, description, author_id, image_url) 
            VALUES (%s, %s, %s, %s) RETURNING id;
        ''', (title, description, user_id, image_url))
        dish_id = cursor.fetchone()[0]

        num_ingredients = len([key for key in request.form.keys() if key.startswith('ingredients[') and key.endswith('][name]')])
        for i in range(num_ingredients):
            name = request.form.get(f'ingredients[{i}][name]')
            amount = request.form.get(f'ingredients[{i}][amount]')
            measurement = request.form.get(f'ingredients[{i}][measurement]', '')
            if measurement == '-':
                measurement = ''
            index = request.form.get(f'ingredients[{i}][index]', type=int) + 1
            cursor.execute('''
                INSERT INTO ingredients (index, name, amount, measurement, dish_id) 
                VALUES (%s, %s, %s, %s, %s);
            ''', (index, name, amount, measurement, dish_id))

        steps_count = len([key for key in request.form.keys() if key.startswith('instructions[') and key.endswith('][description]')])
        for i in range(steps_count):
            description = request.form.get(f'instructions[{i}][description]')
            index = i + 1
            cursor.execute('''
                INSERT INTO steps (dish_id, index, description) 
                VALUES (%s, %s, %s);
            ''', (dish_id, index, description))

        db.commit()
        return jsonify({'message': 'Recipe added successfully', 'dish_id': dish_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 400


@app.route("/check_recipe_title", methods=["POST"])
def check_recipe_title():
    data = request.get_json()
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    
    cursor.execute("SELECT id FROM dishes WHERE title = %s", (data["title"],))
    recipe = cursor.fetchone()
    if recipe is None:
        return jsonify({"exists": False})
    return jsonify({"exists": True})


@app.route('/newRecipes', methods=['GET'])
@jwt_required()
def get_new_recipes():
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute('''
            SELECT d.id, d.title, d.image_url, 
                    to_char(d.created, 'DD.MM.YYYY') as created, 
                    to_char(d.edited, 'DD.MM.YYYY') as edited, 
                    u.username AS author
            FROM dishes d
            JOIN users u ON d.author_id = u.id
            WHERE d.is_moderated = FALSE
        ''')
        recipes = cursor.fetchall()
        return jsonify(recipes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/recipes/<int:dish_id>', methods=['GET'])
@jwt_required()
def get_recipe(dish_id):
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)

    try:
        cursor.execute('''
            SELECT * FROM dishes WHERE id = %s;
        ''', (dish_id,))
        dish = cursor.fetchone()
        
        if dish is None:
            return jsonify({"error": "Recipe not found"}), 404

        cursor.execute('''
            SELECT * FROM ingredients WHERE dish_id = %s ORDER BY index;
        ''', (dish_id,))
        ingredients = cursor.fetchall()

        cursor.execute('''
            SELECT * FROM steps WHERE dish_id = %s ORDER BY index;
        ''', (dish_id,))
        steps = cursor.fetchall()

        full_recipe_info = {
            **dish,
            "ingredients": ingredients,
            "steps": steps
        }
        print("Response data:", full_recipe_info) 

        return jsonify(full_recipe_info)
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route('/recipes/<int:dish_id>', methods=['PUT'])
@jwt_required()
def update_recipe(dish_id):
    data = request.get_json()
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute('''
            UPDATE dishes SET title=%s, description=%s, edited=CURRENT_TIMESTAMP WHERE id=%s;
        ''', (data['title'], data['description'], dish_id))

        for ingredient in data['ingredients']:
            cursor.execute('''
                UPDATE ingredients SET name=%s, amount=%s, measurement=%s, category=%s, is_main=%s WHERE id=%s AND dish_id=%s;
            ''', (ingredient['name'], ingredient['amount'], ingredient['measurement'], ingredient['category'], ingredient.get('isMain', False), ingredient['id'], dish_id))

        for step in data['steps']:
            cursor.execute('''
                UPDATE steps SET description=%s WHERE id=%s AND dish_id=%s;
            ''', (step['description'], step['id'], dish_id))

        db.commit()
        return jsonify({"message": "Recipe updated successfully"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route('/recipes/publish/<int:dish_id>', methods=['PUT'])
@jwt_required()
def publish_recipe(dish_id):
    data = request.get_json()
    db = get_db()
    cursor = db.cursor()

    token_data = get_jwt()
    moderator_id = token_data['sub']
    try:
        cursor.execute('''
            UPDATE dishes SET type=%s, side_dish=%s, cuisine=%s, cooking_time=%s, category=%s, dinner_time=%s, season=%s, is_moderated=TRUE
            WHERE id=%s;
        ''', (data['dishType'], data['needSideDish'], data['cuisine'], data['cookingTime'], data['dinnerCategories'], data['dinnerTimes'], data['seasons'], dish_id))

        cursor.execute('''
            INSERT INTO moderation (dish_id, moderator_id)
            VALUES (%s, %s);
        ''', (dish_id, moderator_id))

        db.commit()
        return jsonify({"message": "Recipe published successfully"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route('/recipes/<int:dish_id>', methods=['DELETE'])
@jwt_required()
def delete_recipe(dish_id):
    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute('''
            DELETE FROM steps WHERE dish_id = %s;
        ''', (dish_id,))

        cursor.execute('''
            DELETE FROM ingredients WHERE dish_id = %s;
        ''', (dish_id,))

        cursor.execute('''
            DELETE FROM moderation WHERE dish_id = %s;
        ''', (dish_id,))

        cursor.execute('''
            DELETE FROM dishes WHERE id = %s;
        ''', (dish_id,))

        db.commit()
        return jsonify({"message": "Recipe and all related data have been deleted"}), 200
    except Exception as e:
        db.rollback()
        return jsonify({"error": str(e)}), 500

@app.route('/createMenu', methods=['POST'])
def create_menu():
    data = request.get_json()
    db = get_db()
    dinner_category = data.get('dinnerCategory')
    dinner_time = data.get('dinnerTime')
    cooking_time = data.get('cookingTime')

    try:
        dishes = find_matching_dishes(db, dinner_category, dinner_time, cooking_time)
        if not dishes:
            return jsonify({'error': 'No dishes found matching the criteria'}), 404
        return jsonify(dishes), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/aggregateIngredients', methods=['POST'])
def get_aggregated_ingredients():
    data = request.get_json()
    dish_ids = data.get('recipes', [])
    
    if not dish_ids:
        return jsonify({'error': 'No dish IDs provided'}), 400

    db = get_db()
    try:
        ingredients = aggregate_ingredients(db, dish_ids)
        return jsonify(ingredients), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/recipeDetails', methods=['POST'])
def get_recipe_details():
    data = request.get_json()
    dish_id = data.get('recipeId')

    if not dish_id:
        return jsonify({'error': 'No recipe ID provided'}), 400

    db = get_db()
    try:
        cursor = db.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT title, description, image_url FROM dishes WHERE id = %s", (dish_id,))
        dish = cursor.fetchone()

        if dish is None:
            return jsonify({"error": "Recipe not found"}), 404

        cursor.execute("SELECT index, description FROM steps WHERE dish_id = %s ORDER BY index", (dish_id,))
        steps = cursor.fetchall()

        cursor.execute("SELECT name, amount, measurement FROM ingredients WHERE dish_id = %s ORDER BY index", (dish_id,))
        ingredients = cursor.fetchall()

        recipe = {
            'id': dish_id,
            'title': dish['title'],
            'description': dish['description'],
            'steps': steps,
            'ingredients': ingredients,
            'image_url': f'/images/{dish["image_url"]}'
        }

        return jsonify(recipe), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/saveMenu', methods=['POST'])
@jwt_required()
def save_menu():
    data = request.get_json()
    user_id = get_jwt_identity()
    title = data.get('title')
    dishes = data.get('dishes')
    dinner_category = data.get('dinnerCategory')
    dinner_time = data.get('dinnerTime')
    cooking_time = data.get('cookingTime')

    if not all([title, dishes, dinner_category, dinner_time, cooking_time]):
        return jsonify({'error': 'Missing data'}), 400

    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute('''
            INSERT INTO menus (user_id, title, dishes, dinner_category, dinner_time, cooking_time)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id;
        ''', (user_id, title, dishes, dinner_category, dinner_time, cooking_time))
        menu_id = cursor.fetchone()[0]
        db.commit()
        return jsonify({'message': 'Menu saved successfully', 'menu_id': menu_id}), 201
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/savedMenus', methods=['GET'])
@jwt_required()
def get_saved_menus():
    user_id = get_jwt_identity()
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute('''
            SELECT id, title, dinner_category, dinner_time, cooking_time, saved, dishes 
            FROM menus 
            WHERE user_id = %s AND removed IS NULL
        ''', (user_id,))
        menus = cursor.fetchall()
        
        for menu in menus:
            cursor.execute('''
                SELECT id, title, image_url, description, type
                FROM dishes
                WHERE id = ANY(string_to_array(%s, ',')::int[])
            ''', (menu['dishes'],))
            dishes = cursor.fetchall()
            
            type_order = {
                'appetizer': 1,
                'salad': 2,
                'starter': 3,
                'hot starter': 4,
                'soup': 5,
                'main dish': 6,
                'side dish': 7,
                'desert': 8
            }
            sorted_dishes = sorted(dishes, key=lambda d: type_order.get(d['type'], float('inf')))
            
            menu['recipes'] = sorted_dishes
        
        return jsonify(menus)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
@app.route('/removeMenu', methods=['POST'])
@jwt_required()
def remove_menu():
    user_id = get_jwt_identity()
    data = request.get_json()
    menu_id = data.get('menuId')
    
    if not menu_id:
        return jsonify({'error': 'Menu ID is required'}), 400

    db = get_db()
    cursor = db.cursor()
    try:
        cursor.execute('''
            UPDATE menus
            SET removed = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
        ''', (menu_id, user_id))
        db.commit()
        return jsonify({'message': 'Menu removed successfully'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/recipesHistory', methods=['GET'])
@jwt_required()
def get_recipes_history():
    user_id = get_jwt_identity()
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)

    try: 
        cursor.execute('''
            SELECT d.id, d.title, u.username AS author, d.created AS created_date,
                   m.moderator_id, m.published AS published_date
            FROM dishes d
            JOIN users u ON d.author_id = u.id
            LEFT JOIN moderation m ON d.id = m.dish_id
            ORDER BY d.id ASC
        ''')
        recipes = cursor.fetchall()

        for recipe in recipes:
            if recipe['moderator_id']:
                cursor.execute('SELECT username FROM users WHERE id = %s', (recipe['moderator_id'],))
                moderator = cursor.fetchone()
                recipe['moderator'] = moderator['username'] if moderator else '-'
            else:
                recipe['moderator'] = '-'

            recipe['published_date'] = recipe['published_date'].strftime("%d.%m.%Y") if recipe['published_date'] else '-'
            recipe['created_date'] = recipe['created_date'].strftime("%d.%m.%Y") if recipe['created_date'] else '-'

        return jsonify(recipes)
    except Exception as e:
        print("Error in get_recipes_history:", e)  # Debugging log
        return jsonify({'error': str(e)}), 500

@app.route('/menusHistory', methods=['GET'])
@jwt_required()
def get_menus_history():
    user_id = get_jwt_identity()
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute('''
            SELECT m.id, m.title, u.username, m.dinner_category, m.cooking_time, m.saved AS saved_date, m.removed AS removed_date, m.dishes
            FROM menus m
            JOIN users u ON m.user_id = u.id
            ORDER BY m.id ASC
        ''')
        menus = cursor.fetchall()

        for menu in menus:
            menu['saved_date'] = menu['saved_date'].strftime("%d.%m.%Y") if menu['saved_date'] else '-'
            menu['removed_date'] = menu['removed_date'].strftime("%d.%m.%Y") if menu['removed_date'] else '-'
            
            cursor.execute('''
                SELECT id, title FROM dishes WHERE id = ANY(string_to_array(%s, ',')::int[])
            ''', (menu['dishes'],))
            recipes = cursor.fetchall()
            menu['recipes'] = recipes

        return jsonify(menus)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    
@app.route('/admin_email', methods=['GET'])
def get_admin_email():
    db = get_db()
    cursor = db.cursor(cursor_factory=RealDictCursor)
    try:
        cursor.execute("SELECT email FROM users WHERE role = 'admin' LIMIT 1")
        admin = cursor.fetchone()
        if admin is None:
            return jsonify({"error": "Admin email not found"}), 404
        return jsonify({"email": admin['email']}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
