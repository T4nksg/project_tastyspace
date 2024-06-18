from psycopg2.extras import RealDictCursor
import inflect

category_headings = {
    'meat': "Meat & Chicken",
    'chicken': "Meat & Chicken",
    'turkey': "Meat & Chicken",
    'liver': "Meat & Chicken",
    'fish': "Fish & Seafood",
    'seafood': "Fish & Seafood",
    'deli meats': "Deli meats",
    'eggs': "Eggs & Dairy",
    'dairy': "Eggs & Dairy",
    'cheese': "Dairy",
    'pasta': "Pasta, Beans & Cereal",
    'beans': "Pasta, Beans & Cereal",
    'rice': "Pasta, Beans & Cereal",
    'cereal': "Pasta, Beans & Cereal",
    'canned fish': "Canned Goods",
    'canned beans': "Canned Goods",
    'canned goods': "Canned Goods",
    'dry food': "Dry food",
    'sweets': "Sweets",
    'mushrooms': "Vegetables & Mushrooms",
    'potato': "Vegetables & Mushrooms",
    'carrot': "Vegetables & Mushrooms",
    'tomato': "Vegetables & Mushrooms",
    'vegetables': "Vegetables & Mushrooms",
    'fruits': "Fruits",
    'greenery': "Greenery",
    'sauces': "Sauces",
    'seasoning': "Seasoning",
    'baking supplies': "Baking supplies",
    'other': "Other"
}

p = inflect.engine()

def normalize_name(name):
    words = name.lower().split()
    normalized_words = [p.singular_noun(word) or word for word in words]
    return ' '.join(normalized_words)

def format_amount(amount):
    return '{:.2f}'.format(amount).rstrip('0').rstrip('.')

def aggregate_ingredients(db, dish_ids):
    cursor = db.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT LOWER(name) as name, SUM(amount) as amount, measurement, category
        FROM ingredients
        WHERE dish_id = ANY(%s)
        GROUP BY LOWER(name), measurement, category
    """
    cursor.execute(query, (dish_ids,))
    ingredients = cursor.fetchall()

    grouped_ingredients = {}
    for ingredient in ingredients:
        ingredient_name = normalize_name(ingredient['name'])
        category_heading = category_headings.get(ingredient['category'], "Other")
        if category_heading not in grouped_ingredients:
            grouped_ingredients[category_heading] = []
        
        existing = next((item for item in grouped_ingredients[category_heading] if item['name'] == ingredient_name and item['measurement'] == ingredient['measurement']), None)
        
        if existing:
            existing_amount_before = existing['amount']
            existing['amount'] += ingredient['amount']
            print(f"Updated ingredient: {ingredient['name']}, measurement: {ingredient['measurement']}, from {existing_amount_before} to {existing['amount']}")
        else:
            grouped_ingredients[category_heading].append({
                'name': ingredient_name,
                'amount': ingredient['amount'],
                'measurement': ingredient['measurement'],
                'category': ingredient['category']
            })
            print(f"Added new ingredient: {ingredient['name']}, measurement: {ingredient['measurement']}, amount: {ingredient['amount']}")

    for category in grouped_ingredients:
        for ingredient in grouped_ingredients[category]:
            ingredient['amount'] = format_amount(ingredient['amount'])

    for category in grouped_ingredients:
        grouped_ingredients[category].sort(key=lambda x: (x['name'], x['measurement']))
            
    return grouped_ingredients
