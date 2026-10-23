import sys
import asyncio
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

db_url = 'postgresql+psycopg://neondb_owner:npg_AvCf5eRl0ZGt@ep-ancient-shadow-azoldoyd-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

async def check():
    engine = create_async_engine(db_url)
    try:
        async with engine.connect() as conn:
            res = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
            tables = [r[0] for r in res.fetchall()]
            print('Tables in Neon DB:', tables)
            
            if 'users' in tables:
                u = await conn.execute(text('SELECT username, role, password_hash FROM users'))
                users = u.fetchall()
                print('Users count:', len(users))
                for row in users:
                    print('  User:', row[0], 'Role:', row[1], 'Hash:', row[2])
            else:
                print('NO USERS TABLE')
                
            if 'classes' in tables:
                c = await conn.execute(text('SELECT class_code, name, id FROM classes'))
                classes = c.fetchall()
                print('Classes:', classes)
                
            if 'class_students' in tables:
                cs = await conn.execute(text('SELECT count(*) FROM class_students'))
                print('class_students count:', cs.scalar())
    except Exception as e:
        print('Error connecting to Neon:', e)
    finally:
        await engine.dispose()

if __name__ == '__main__':
    asyncio.run(check())
