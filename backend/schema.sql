
DROP TABLE users CASCADE;
-- CREATE TABLE IF NOT EXISTS users (
--     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--     username TEXT NOT NULL UNIQUE,
--     password TEXT NOT NULL,
--     email TEXT,
--     role TEXT NOT NULL DEFAULT 'user',
--     created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     edited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     last TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- INSERT INTO users (username, password, email, role)
-- VALUES ('admin', '1234', 'd.zelikina@gmail.com', 'admin');
DROP TABLE dishes CASCADE;
-- CREATE TABLE IF NOT EXISTS dishes (
--     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--     title TEXT NOT NULL UNIQUE,
--     description TEXT,
--     image_url TEXT,
--     author_id INTEGER,
--     type TEXT,
--     side_dish BOOLEAN,
--     category TEXT,
--     cuisine TEXT,
--     season TEXT,
--     cooking_time INTEGER,
--     dinner_time TEXT,
--     created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     edited TIMESTAMP,
--     is_moderated BOOLEAN DEFAULT false,
--     FOREIGN KEY (author_id) REFERENCES users(id)
-- );
DROP TABLE steps CASCADE;
-- CREATE TABLE IF NOT EXISTS steps (
--     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--     dish_id INTEGER,
--     index INTEGER,
--     description TEXT,
--     FOREIGN KEY (dish_id) REFERENCES dishes(id)
-- );
DROP TABLE ingredients CASCADE;
-- CREATE TABLE IF NOT EXISTS ingredients (
--     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--     dish_id INTEGER,
--     index INTEGER,
--     name TEXT,
--     measurement TEXT,
--     amount TEXT,
--     category TEXT,
--     is_main BOOLEAN,
--     FOREIGN KEY (dish_id) REFERENCES dishes(id)
-- );
DROP TABLE moderation CASCADE;
-- CREATE TABLE IF NOT EXISTS moderation (
--     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--     dish_id INTEGER,
--     moderator_id INTEGER,
--     published TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (dish_id) REFERENCES dishes(id),
--     FOREIGN KEY (moderator_id) REFERENCES users(id)
-- );
DROP TABLE menus CASCADE;
-- CREATE TABLE IF NOT EXISTS menus (
--     id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
--     user_id INTEGER,
--     title TEXT,
--     dishes TEXT,
--     dinner_category TEXT,
--     dinner_time TEXT,
--     cooking_time TEXT,
--     saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     removed TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- DELETE FROM steps WHERE dish_id = 118;
-- DELETE FROM ingredients WHERE dish_id = 118;
-- DELETE FROM moderation WHERE dish_id = 118;
-- DELETE FROM dishes WHERE id = 118;

-- DELETE FROM menus
-- WHERE id=3;

-- ALTER TABLE ingredients ALTER COLUMN amount TYPE REAL USING amount::REAL;


