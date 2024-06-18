from datetime import datetime
from psycopg2.extras import RealDictCursor

def get_current_season():
    month = datetime.now().month
    if month in (3, 4, 5):
        return 'spring'
    elif month in (6, 7, 8):
        return 'summer'
    elif month in (9, 10, 11):
        return 'autumn'
    else:
        return 'winter'
    
def get_main_ingredient_categories(dish_id, db):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    query = """
        SELECT category FROM ingredients
        WHERE dish_id = %s AND is_main = true
    """
    cursor.execute(query, (dish_id,))
    ingredients = cursor.fetchall()
    return [ingredient['category'] for ingredient in ingredients]

def select_dish(types, db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories, allow_repeats=False):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    current_season = get_current_season()
    if dinner_time == 'later':
        dinner_time = 'tomorrow'
    query = """
        SELECT * FROM dishes
        WHERE type IN %s 
        AND category LIKE %s 
        AND dinner_time LIKE %s 
        AND cooking_time <= %s 
        AND (season LIKE %s OR season = 'all seasons')
        AND (
            cuisine = 'universal'  
            OR EXISTS (            
                SELECT 1 
                FROM unnest(string_to_array(cuisine, ', ')) AS c
                WHERE c = ANY(%s)
            )
        )
        ORDER BY RANDOM() LIMIT 1
    """
    selected_dish_ids = {dish['id'] for dish in menu}
    cursor.execute(query, (types, '%' + dinner_category + '%', '%' + dinner_time + '%', cooking_time, '%' + current_season + '%', list(current_cuisines)))
    dishes = cursor.fetchall()
    
    for dish in dishes:
        if dish['id'] in selected_dish_ids:
            continue
        
        dish_main_categories = get_main_ingredient_categories(dish['id'], db)
        
        if allow_repeats:
            main_ingredient_categories.extend(dish_main_categories)
            return dish
        
        category_counts = {category: main_ingredient_categories.count(category) for category in dish_main_categories}

        is_allowed = True
        for count in category_counts.values():
            if count != 0:
                is_allowed = False
                break

        if is_allowed:
            main_ingredient_categories.extend(dish_main_categories)
            return dish

    if not allow_repeats:
        return select_dish(types, db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories, allow_repeats=True)
    
    return None

def update_current_cuisines(dish, current_cuisines):
    if dish['cuisine'] != 'universal':
        dish_cuisines = set(dish['cuisine'].split(', '))
        current_cuisines.intersection_update(dish_cuisines)

def add_dish(types, db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories):
    dish = select_dish(types, db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories, allow_repeats=False)
    if dish is None:
        dish = select_dish(types, db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories, allow_repeats=True)
    if dish is not None:
        menu.append(dish)
        update_current_cuisines(dish, current_cuisines)

def sort_menu_by_type(menu):
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
    return sorted(menu, key=lambda dish: type_order.get(dish['type'], float('inf')))

def find_matching_dishes(db, dinner_category, dinner_time, cooking_time):
    menu = []
    current_cuisines = {'european', 'asian', 'mediterranean', 'russian', 'italian', 'mexican'}
    main_ingredient_categories = []

    if dinner_category == 'weeknight':
        add_dish(('main dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        if menu and menu[-1]['side_dish']:
            add_dish(('side dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        if cooking_time == 1:
            add_dish(('salad', 'soup'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        if cooking_time == 2:
            add_dish(('salad',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
            add_dish(('soup',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

    elif dinner_category == 'family':
        add_dish(('main dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        if menu and menu[-1]['side_dish']:
            add_dish(('side dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        add_dish(('salad',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        add_dish(('soup',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        if cooking_time == 3:
            add_dish(('starter', 'desert'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
            
        if cooking_time == 4:
            add_dish(('starter',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
            add_dish(('desert',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

    elif dinner_category == 'guest':
        add_dish(('soup', 'main dish'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        if menu and menu[-1]['side_dish']:
            add_dish(('side dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
                
        add_dish(('salad',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        add_dish(('salad',), db, dinner_category, dinner_time, 1, current_cuisines, menu, main_ingredient_categories)
        add_dish(('starter',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        if cooking_time >= 3:
            add_dish(('desert',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

            if dinner_time != 'today':
                add_dish(('salad', 'starter'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

                if dinner_time == 'later':
                    add_dish(('hot starter', 'starter'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

    elif dinner_category == 'festive':
        add_dish(('main dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        if menu and menu[-1]['side_dish']:
            add_dish(('side dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        for i in range(2):
            add_dish(('appetizer',), db, dinner_category, dinner_time, 1, current_cuisines, menu, main_ingredient_categories)
            add_dish(('salad',), db, dinner_category, dinner_time, 1, current_cuisines, menu, main_ingredient_categories)
        
        add_dish(('appetizer',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        add_dish(('salad',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        add_dish(('desert',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        if cooking_time == 4:
            add_dish(('appetizer', 'starter'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
            add_dish(('starter', 'hot starter'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        if dinner_time == 'later':
            add_dish(('salad', 'starter'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

    elif dinner_category == 'romantic':
        for i in range(3):
            add_dish(('appetizer',), db, dinner_category, dinner_time, 1, current_cuisines, menu, main_ingredient_categories)

        add_dish(('salad',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
        add_dish(('desert',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        if cooking_time == 2:
            add_dish(('appetizer',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        elif cooking_time == 3:
            add_dish(('main dish', 'soup', 'hot starter'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
            if menu and menu[-1]['side_dish']:
                add_dish(('side dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

        else:
            add_dish(('main dish', 'soup'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)
            if menu and menu[-1]['side_dish']:
                add_dish(('side dish',), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

            add_dish(('starter', 'hot starter'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

            if dinner_time == 'later':
                add_dish(('appetizer', 'starter'), db, dinner_category, dinner_time, cooking_time, current_cuisines, menu, main_ingredient_categories)

    return sort_menu_by_type(menu)        
