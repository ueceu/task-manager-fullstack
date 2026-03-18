from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import sqlite3
import jwt
import json
import threading
from pywebpush import webpush
import random
from passlib.context import CryptContext
import string

# ================= CONFIG =================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET = "tasklink_secret_very_long_secure_key_1234567890"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

VAPID_PUBLIC_KEY = "043f8539357e41c3ec2d1865b038a9584a8bb8ec9a0f7bef5e894f281c65055720c260e68c71c0f9b94c0def341a71860be621f680a77ee2ac46f371f991470841"
VAPID_PRIVATE_KEY = "89707884018201463166546387524799301022389273511406159192978144865195241374132"

# ================= DATABASE =================

DB_PATH = "tasklink.db"

conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()

# ---------- USERS ----------
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
""")

# ---------- TASKS ----------
cursor.execute("""
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    start_time TEXT,
    planned_minutes INTEGER,
    is_global INTEGER,
    status TEXT,
    started_at TEXT,
    ended_at TEXT,
    total_minutes INTEGER,
    notified_15 INTEGER DEFAULT 0,
    notified_5 INTEGER DEFAULT 0
)
""")

# ---------- PUSH SUBSCRIPTIONS ----------
cursor.execute("""
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    endpoint TEXT,
    p256dh TEXT,
    auth TEXT
)
""")

# ---------- GROUPS ----------
cursor.execute("""
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    invite_code TEXT UNIQUE,
    created_by INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    user_id INTEGER
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS group_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    start_time TEXT,
    planned_minutes INTEGER,
    color TEXT,
    status TEXT DEFAULT 'waiting'
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    note TEXT,
    date TEXT
)          
""")

# ---------- NOTES ----------
cursor.execute("""
CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    created_at TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS task_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    from_user_id INTEGER,
    sticker_url TEXT,
    message TEXT,
    created_at TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS stickers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    image_url TEXT,
    created_by INTEGER,
    created_at TEXT
)
""")

def safe_add_column(table, column, definition):

    cursor.execute(f"PRAGMA table_info({table})")
    columns = [c[1] for c in cursor.fetchall()]

    if column not in columns:
        cursor.execute(
            f"ALTER TABLE {table} ADD COLUMN {column} {definition}"
        )

safe_add_column("users", "points", "INTEGER DEFAULT 0")
safe_add_column("users", "profile_photo", "TEXT")
safe_add_column("tasks", "color", "TEXT DEFAULT '#2563eb'")
safe_add_column("notes", "title", "TEXT DEFAULT 'Untitled'")
safe_add_column("group_tasks", "started_at", "TEXT")
safe_add_column("group_tasks", "ended_at", "TEXT")
safe_add_column("group_tasks", "total_minutes", "INTEGER")


conn.commit()


class ThreadLocalConnection:
    def __init__(self, db_path):
        self.db_path = db_path
        self.local = threading.local()

    def _connection(self):
        if not hasattr(self.local, "connection"):
            self.local.connection = sqlite3.connect(
                self.db_path,
                check_same_thread=False
            )
        return self.local.connection

    def cursor(self):
        return self._connection().cursor()

    def commit(self):
        self._connection().commit()

    @property
    def connection(self):
        return self._connection()


class ThreadLocalCursor:
    def __init__(self, connection_factory):
        self.connection_factory = connection_factory
        self.local = threading.local()

    def _cursor(self):
        if not hasattr(self.local, "cursor"):
            self.local.cursor = self.connection_factory.cursor()
        return self.local.cursor

    def execute(self, *args, **kwargs):
        return self._cursor().execute(*args, **kwargs)

    def fetchone(self):
        return self._cursor().fetchone()

    def fetchall(self):
        return self._cursor().fetchall()

    @property
    def lastrowid(self):
        return self._cursor().lastrowid

    @property
    def rowcount(self):
        return self._cursor().rowcount

    @property
    def connection(self):
        return self.connection_factory.connection


conn = ThreadLocalConnection(DB_PATH)
cursor = ThreadLocalCursor(conn)

# ================= MODELS =================

class UserCreate(BaseModel):
    username: str
    password: str


class TaskCreate(BaseModel):
    title:str
    description:str
    start_time:str
    planned_minutes:int
    is_global:bool
    color:str


class TaskMove(BaseModel):
    start_time: str
    planned_minutes: int


class TaskUpdate(BaseModel):
    title: str
    description: str
    start_time: str
    planned_minutes: int
    is_global: bool
    color: str


class GroupCreate(BaseModel):
    name: str


class GroupJoin(BaseModel):
    invite_code: str


class GroupTaskCreate(BaseModel):
    group_id: int
    title: str
    description: str
    start_time: str
    planned_minutes: int
    color: str


class GroupTaskUpdate(BaseModel):
    title: str
    description: str
    start_time: str
    planned_minutes: int
    color: str


class ReminderPayload(BaseModel):
    title: str
    note: str
    date: str


class NotePayload(BaseModel):
    title: str = "Untitled"
    content: str = ""


class ReactionPayload(BaseModel):
    sticker_url: str
    message: str = ""


class StickerPayload(BaseModel):
    name: str
    image_url: str


class ProfilePhotoPayload(BaseModel):
    profile_photo: str


# ================= AUTH =================

def create_token(user_id: int):
    return jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.now(timezone.utc) + timedelta(days=1)
        },
        SECRET,
        algorithm="HS256"
    )


def get_user(token: str = Depends(oauth2_scheme)):
    try:
        return jwt.decode(token, SECRET, algorithms=["HS256"])["user_id"]
    except:
        raise HTTPException(401, "Invalid token")


# ================= PUSH =================

def send_notification(user_id, title, message, task_id):
    cursor.execute("""
        SELECT endpoint, p256dh, auth
        FROM push_subscriptions
        WHERE user_id=?
    """, (user_id,))

    subs = cursor.fetchall()

    for sub in subs:
        webpush(
            subscription_info={
                "endpoint": sub[0],
                "keys": {
                    "p256dh": sub[1],
                    "auth": sub[2]
                }
            },
            data=json.dumps({
                "title": title,
                "message": message,
                "taskId": task_id
            }),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_public_key=VAPID_PUBLIC_KEY,
            vapid_claims={"sub": "mailto:tasklink@app.com"}
        )


# ================= HELPERS =================

def generate_invite_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


# ================= AUTH ROUTES =================

@app.post("/register")
def register(user: UserCreate):

    hashed = pwd_context.hash(user.password)

    cursor.execute(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        (user.username, hashed)
    )

    conn.commit()

    print("USERNAME:", user.username)
    print("PASSWORD:", user.password)
    print("TYPE:", type(user.password))

    return {"msg": "registered"}


@app.post("/login")
def login(user: UserCreate):

    cursor.execute(
        "SELECT id,password FROM users WHERE username=?",
        (user.username,)
    )

    row = cursor.fetchone()

    if not row:
        raise HTTPException(401, "Invalid credentials")

    user_id, hashed = row

    if not pwd_context.verify(user.password, hashed):
        raise HTTPException(401, "Invalid credentials")

    cursor.execute(
        "SELECT profile_photo FROM users WHERE id=?",
        (user_id,)
    )
    photo_row = cursor.fetchone()

    return {
        "token": create_token(user_id),
        "username": user.username,
        "profile_photo": photo_row[0] if photo_row else None
    }


@app.get("/profile")
def get_profile(user_id: int = Depends(get_user)):
    cursor.execute("""
        SELECT username, profile_photo
        FROM users
        WHERE id=?
    """, (user_id,))

    row = cursor.fetchone()
    if not row:
        raise HTTPException(404, "User not found")

    return {
        "username": row[0],
        "profile_photo": row[1]
    }


@app.put("/profile/photo")
def update_profile_photo(
    data: ProfilePhotoPayload,
    user_id: int = Depends(get_user)
):
    cursor.execute("""
        UPDATE users
        SET profile_photo=?
        WHERE id=?
    """, (data.profile_photo, user_id))

    conn.commit()
    return {"msg": "profile updated"}


# ================= TASK ROUTES =================

@app.post("/task")
def create_task(task: TaskCreate, user_id: int = Depends(get_user)):

    cursor.execute("""
        INSERT INTO tasks (
            user_id,
            title,
            description,
            start_time,
            planned_minutes,
            is_global,
            status,
            color
        )
        VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?)
    """, (
        user_id,
        task.title,
        task.description,
        task.start_time,
        task.planned_minutes,
        int(task.is_global),
        task.color
    ))

    conn.commit()

    return {"msg": "task created"}


@app.post("/task/{task_id}/start")
def start_task(task_id: int, user_id: int = Depends(get_user)):

    cursor.execute("""
        SELECT start_time FROM tasks
        WHERE id=? AND user_id=?
    """,(task_id,user_id))

    row = cursor.fetchone()

    if not row:
        raise HTTPException(403,"Not allowed")

    start_time = datetime.fromisoformat(row[0])

    now = datetime.now(timezone.utc)

    if start_time < now - timedelta(minutes=5):
        raise HTTPException(400, "Task start window passed")

    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
        UPDATE tasks
        SET status='active', started_at=?
        WHERE id=? AND user_id=?
    """,(now,task_id,user_id))

    conn.commit()

    return {"msg":"started"}


@app.post("/task/{task_id}/extend/{minutes}")
def extend_task(task_id: int, minutes: int, user_id: int = Depends(get_user)):
    cursor.execute("""
        UPDATE tasks
        SET planned_minutes = planned_minutes + ?
        WHERE id=? AND user_id=?
    """, (minutes, task_id, user_id))

    if cursor.rowcount == 0:
        raise HTTPException(403, "Not allowed")

    conn.commit()
    return {"msg": f"{minutes} minutes extended"}


@app.post("/task/{task_id}/move")
def move_task(task_id: int, data: TaskMove, user_id: int = Depends(get_user)):
    cursor.execute("""
        UPDATE tasks
        SET start_time=?, planned_minutes=?
        WHERE id=? AND user_id=?
    """, (data.start_time, data.planned_minutes, task_id, user_id))

    if cursor.rowcount == 0:
        raise HTTPException(403, "Not allowed")

    conn.commit()
    return {"msg": "task moved"}


@app.post("/task/{task_id}/update")
def update_task(task_id: int, data: TaskUpdate, user_id: int = Depends(get_user)):

    cursor.execute("""
        UPDATE tasks
        SET title=?,
            description=?,
            start_time=?,
            planned_minutes=?,
            is_global=?,
            color=?
        WHERE id=? AND user_id=?
    """, (
        data.title,
        data.description,
        data.start_time,
        data.planned_minutes,
        int(data.is_global),
        data.color,
        task_id,
        user_id
    ))

    if cursor.rowcount == 0:
        raise HTTPException(403, "Not allowed")

    conn.commit()

    return {"msg": "task updated"}


@app.post("/task/{task_id}/complete")
def complete_task(task_id: int, user_id: int = Depends(get_user)):

    cursor.execute("""
        SELECT started_at
        FROM tasks
        WHERE id=? AND user_id=?
    """,(task_id,user_id))

    row = cursor.fetchone()

    if not row or not row[0]:
        raise HTTPException(400,"Task not started")

    started = datetime.fromisoformat(row[0])
    now = datetime.now(timezone.utc)

    minutes = int((now - started).total_seconds() / 60)

    points = minutes * 10

    cursor.execute("""
        UPDATE tasks
        SET status='done',
            ended_at=?,
            total_minutes=?
        WHERE id=? AND user_id=?
    """,(now.isoformat(),minutes,task_id,user_id))

    cursor.execute("""
        UPDATE users
        SET points = points + ?
        WHERE id=?
    """,(points,user_id))

    conn.commit()

    return {
        "minutes":minutes,
        "points":points
    }

@app.get("/tasks")
def get_tasks(type: str = "personal", user_id: int = Depends(get_user)):

    if type == "global":
        cursor.execute("""
            SELECT id,title,description,start_time,
                   planned_minutes,is_global,status,color,user_id,
                   started_at,ended_at,total_minutes
            FROM tasks
            WHERE is_global=1
            ORDER BY start_time
        """)
    else:
        cursor.execute("""
            SELECT id,title,description,start_time,
                   planned_minutes,is_global,status,color,user_id,
                   started_at,ended_at,total_minutes
            FROM tasks
            WHERE user_id=?
            ORDER BY start_time
        """,(user_id,))

    rows = cursor.fetchall()

    return [
        {
            "id":r[0],
            "title":r[1],
            "description":r[2],
            "start_time":r[3],
            "planned_minutes":r[4],
            "is_global":bool(r[5]),
            "status":r[6],
            "color":r[7],
            "user_id":r[8],
            "started_at":r[9],
            "ended_at":r[10],
            "total_minutes":r[11]
        }
        for r in rows
    ]


@app.delete("/task/{task_id}")
def delete_task(task_id: int, user_id: int = Depends(get_user)):
    cursor.execute("""
        DELETE FROM tasks
        WHERE id=? AND user_id=?
    """, (task_id, user_id))

    if cursor.rowcount == 0:
        raise HTTPException(403, "Not allowed")

    conn.commit()
    return {"msg": "task deleted"}


@app.get("/task/{task_id}/reactions")
def get_task_reactions(task_id: int, user_id: int = Depends(get_user)):
    cursor.execute("""
        SELECT id, user_id, is_global
        FROM tasks
        WHERE id=?
    """, (task_id,))

    task = cursor.fetchone()

    if not task or not task[2]:
        raise HTTPException(404, "Global task not found")

    cursor.execute("""
        SELECT tr.id, tr.sticker_url, tr.message, tr.created_at, u.username
        FROM task_reactions tr
        JOIN users u ON u.id = tr.from_user_id
        WHERE tr.task_id=?
        ORDER BY tr.created_at DESC
    """, (task_id,))

    rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "sticker_url": row[1],
            "message": row[2],
            "created_at": row[3],
            "username": row[4]
        }
        for row in rows
    ]


@app.post("/task/{task_id}/reaction")
def add_task_reaction(
    task_id: int,
    data: ReactionPayload,
    user_id: int = Depends(get_user)
):
    cursor.execute("""
        SELECT user_id, is_global
        FROM tasks
        WHERE id=?
    """, (task_id,))

    task = cursor.fetchone()

    if not task or not task[1]:
        raise HTTPException(404, "Global task not found")

    if task[0] == user_id:
        raise HTTPException(400, "Owners cannot react to their own task")

    cursor.execute("""
        INSERT INTO task_reactions (task_id, from_user_id, sticker_url, message, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        task_id,
        user_id,
        data.sticker_url,
        data.message,
        datetime.now(timezone.utc).isoformat()
    ))

    conn.commit()
    return {"msg": "reaction added"}


@app.get("/stickers")
def get_stickers():
    cursor.execute("""
        SELECT id, name, image_url
        FROM stickers
        ORDER BY created_at DESC
    """)

    rows = cursor.fetchall()

    return [
        {
            "id": row[0],
            "name": row[1],
            "url": row[2]
        }
        for row in rows
    ]


@app.post("/sticker")
def create_sticker(data: StickerPayload, user_id: int = Depends(get_user)):
    cursor.execute("""
        INSERT INTO stickers (name, image_url, created_by, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        data.name,
        data.image_url,
        user_id,
        datetime.now(timezone.utc).isoformat()
    ))

    conn.commit()
    return {"msg": "sticker added", "id": cursor.lastrowid}


# ================= LEADERBOARD =================

@app.get("/leaderboard")
def leaderboard():

    cursor.execute("""
        SELECT username, points, profile_photo
        FROM users
        ORDER BY points DESC
        LIMIT 10
    """)

    rows = cursor.fetchall()

    return [
        {
            "username":r[0],
            "points":r[1],
            "profile_photo":r[2]
        }
        for r in rows
    ]

# ================= GROUP ROUTES =================

@app.post("/group/create")
def create_group(data: GroupCreate, user_id: int = Depends(get_user)):
    invite_code = generate_invite_code()

    cursor.execute("""
        INSERT INTO groups (name, invite_code, created_by)
        VALUES (?, ?, ?)
    """, (data.name, invite_code, user_id))

    group_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO group_members (group_id, user_id)
        VALUES (?, ?)
    """, (group_id, user_id))

    conn.commit()

    return {
        "group_id": group_id,
        "name": data.name,
        "invite_code": invite_code
    }


@app.post("/group/join")
def join_group(data: GroupJoin, user_id: int = Depends(get_user)):
    cursor.execute("""
        SELECT id FROM groups WHERE invite_code=?
    """, (data.invite_code,))

    group = cursor.fetchone()
    if not group:
        raise HTTPException(404, "Group not found")

    group_id = group[0]

    cursor.execute("""
        SELECT id FROM group_members WHERE group_id=? AND user_id=?
    """, (group_id, user_id))

    if cursor.fetchone():
        return {"msg": "already joined"}

    cursor.execute("""
        INSERT INTO group_members (group_id, user_id)
        VALUES (?, ?)
    """, (group_id, user_id))

    conn.commit()
    return {"msg": "joined", "group_id": group_id}


@app.get("/groups")
def list_groups(user_id: int = Depends(get_user)):
    cursor.execute("""
        SELECT g.id, g.name, g.invite_code
        FROM groups g
        JOIN group_members gm ON gm.group_id = g.id
        WHERE gm.user_id=?
    """, (user_id,))

    groups = cursor.fetchall()

    return [
        {"id": g[0], "name": g[1], "invite_code": g[2]}
        for g in groups
    ]


@app.post("/group/task")
def create_group_task(data: GroupTaskCreate, user_id: int = Depends(get_user)):
    cursor.execute("""
        SELECT id FROM group_members
        WHERE group_id=? AND user_id=?
    """, (data.group_id, user_id))

    if not cursor.fetchone():
        raise HTTPException(403, "Not a member of this group")

    cursor.execute("""
        INSERT INTO group_tasks (
            group_id, user_id, title, description,
            start_time, planned_minutes, color
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data.group_id,
        user_id,
        data.title,
        data.description,
        data.start_time,
        data.planned_minutes,
        data.color
    ))

    conn.commit()
    return {"msg": "group task created"}


@app.get("/group/{group_id}/tasks")
def get_group_tasks(group_id: int, user_id: int = Depends(get_user)):
    cursor.execute("""
        SELECT id FROM group_members
        WHERE group_id=? AND user_id=?
    """, (group_id, user_id))

    if not cursor.fetchone():
        raise HTTPException(403, "Not a member of this group")

    cursor.execute("""
        SELECT id, user_id, title, description, start_time,
               planned_minutes, color, status, started_at, ended_at, total_minutes
        FROM group_tasks
        WHERE group_id=?
    """, (group_id,))

    rows = cursor.fetchall()

    return [
        {
            "id": r[0],
            "user_id": r[1],
            "title": r[2],
            "description": r[3],
            "start_time": r[4],
            "planned_minutes": r[5],
            "color": r[6],
            "status": r[7],
            "started_at": r[8],
            "ended_at": r[9],
            "total_minutes": r[10]
        }
        for r in rows
    ]

@app.delete("/group/{group_id}/leave")
def leave_group(group_id:int,user_id:int=Depends(get_user)):

    cursor.execute("""
        DELETE FROM group_members
        WHERE group_id=? AND user_id=?
    """,(group_id,user_id))

    conn.commit()

    return {"msg":"left group"}

@app.post("/group/task/{task_id}/update")
def update_group_task(
    task_id: int,
    data: GroupTaskUpdate,
    user_id: int = Depends(get_user)
):

    cursor.execute("""
        UPDATE group_tasks
        SET title=?,description=?,start_time=?,planned_minutes=?,color=?
        WHERE id=? AND user_id=?
    """,(data.title,data.description,data.start_time,data.planned_minutes,data.color,task_id,user_id))

    conn.commit()

    return {"msg":"updated"}


@app.post("/group/task/{task_id}/start")
def start_group_task(task_id: int, user_id: int = Depends(get_user)):

    cursor.execute("""
        SELECT start_time FROM group_tasks
        WHERE id=? AND user_id=?
    """, (task_id, user_id))

    row = cursor.fetchone()

    if not row:
        raise HTTPException(403, "Not allowed")

    start_time = datetime.fromisoformat(row[0])
    now = datetime.now(timezone.utc)

    if start_time < now - timedelta(minutes=5):
        raise HTTPException(400, "Task start window passed")

    cursor.execute("""
        UPDATE group_tasks
        SET status='active', started_at=?
        WHERE id=? AND user_id=?
    """, (now.isoformat(), task_id, user_id))

    conn.commit()

    return {"msg": "started"}


@app.post("/group/task/{task_id}/complete")
def complete_group_task(task_id: int, user_id: int = Depends(get_user)):

    cursor.execute("""
        SELECT started_at
        FROM group_tasks
        WHERE id=? AND user_id=?
    """, (task_id, user_id))

    row = cursor.fetchone()

    if not row or not row[0]:
        raise HTTPException(400, "Task not started")

    started = datetime.fromisoformat(row[0])
    now = datetime.now(timezone.utc)
    minutes = int((now - started).total_seconds() / 60)
    points = minutes * 10

    cursor.execute("""
        UPDATE group_tasks
        SET status='done',
            ended_at=?,
            total_minutes=?
        WHERE id=? AND user_id=?
    """, (now.isoformat(), minutes, task_id, user_id))

    cursor.execute("""
        UPDATE users
        SET points = points + ?
        WHERE id=?
    """, (points, user_id))

    conn.commit()

    return {
        "minutes": minutes,
        "points": points
    }


@app.post("/group/task/{task_id}/extend/{minutes}")
def extend_group_task(task_id: int, minutes: int, user_id: int = Depends(get_user)):

    cursor.execute("""
        UPDATE group_tasks
        SET planned_minutes = planned_minutes + ?
        WHERE id=? AND user_id=?
    """, (minutes, task_id, user_id))

    if cursor.rowcount == 0:
        raise HTTPException(403, "Not allowed")

    conn.commit()
    return {"msg": f"{minutes} minutes extended"}


@app.post("/group/task/{task_id}/move")
def move_group_task(task_id: int, data: TaskMove, user_id: int = Depends(get_user)):

    cursor.execute("""
        UPDATE group_tasks
        SET start_time=?, planned_minutes=?
        WHERE id=? AND user_id=?
    """, (data.start_time, data.planned_minutes, task_id, user_id))

    if cursor.rowcount == 0:
        raise HTTPException(403, "Not allowed")

    conn.commit()
    return {"msg": "task moved"}

@app.delete("/group/task/{task_id}")
def delete_group_task(task_id:int,user_id:int=Depends(get_user)):

    cursor.execute("""
        DELETE FROM group_tasks
        WHERE id=? AND user_id=?
    """,(task_id,user_id))

    conn.commit()

    return {"msg":"deleted"}

# ================= NOTES ROUTES =================

@app.post("/note")
def create_note(data: NotePayload, user_id: int = Depends(get_user)):

    cursor.execute("""
        INSERT INTO notes (user_id, title, content, created_at)
        VALUES (?, ?, ?, ?)
    """, (
        user_id,
        data.title or "Untitled",
        data.content,
        datetime.now(timezone.utc).isoformat()
    ))

    conn.commit()

    return {
        "msg": "note created",
        "id": cursor.lastrowid
    }


@app.get("/notes")
def get_notes(user_id: int = Depends(get_user)):

    cursor.execute("""
        SELECT id,title,content,created_at
        FROM notes
        WHERE user_id=?
        ORDER BY created_at DESC
    """,(user_id,))

    rows = cursor.fetchall()

    return [
        {
            "id":r[0],
            "title":r[1],
            "content":r[2],
            "created_at":r[3]
        }
        for r in rows
    ]


@app.put("/note/{note_id}")
def update_note(note_id: int, data: NotePayload, user_id: int = Depends(get_user)):

    cursor.execute("""
        UPDATE notes
        SET title=?, content=?
        WHERE id=? AND user_id=?
    """, (
        data.title or "Untitled",
        data.content,
        note_id,
        user_id
    ))

    if cursor.rowcount == 0:
        raise HTTPException(404, "Note not found")

    conn.commit()
    return {"msg": "note updated"}



# ================= SUBSCRIBE =================

@app.post("/subscribe")
def subscribe(data: dict):
    cursor.execute("""
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?)
    """, (
        data["userId"],
        data["endpoint"],
        data["keys"]["p256dh"],
        data["keys"]["auth"]
    ))
    conn.commit()
    return {"msg": "subscribed"}


# ================= SCHEDULER START =================

from scheduler import scheduler_loop

@app.on_event("startup")
def start_scheduler():
    thread = threading.Thread(target=scheduler_loop, daemon=True)
    thread.start()


@app.post("/reminder")
def create_reminder(data: ReminderPayload, user_id: int = Depends(get_user)):
    cursor.execute("""
        INSERT INTO reminders (user_id,title,note,date)
        VALUES (?,?,?,?)
    """, (user_id, data.title, data.note, data.date))
    conn.commit()
    return {"msg": "created", "id": cursor.lastrowid}

@app.get("/reminders")
def get_reminders(user_id: int = Depends(get_user)):

    cursor.execute("""
        SELECT id,title,note,date
        FROM reminders
        WHERE user_id=?
        ORDER BY date
    """,(user_id,))

    rows = cursor.fetchall()

    return [
        {
            "id":r[0],
            "title":r[1],
            "note":r[2],
            "date":r[3]
        }
        for r in rows
    ]


@app.put("/reminder/{reminder_id}")
def update_reminder(
    reminder_id: int,
    data: ReminderPayload,
    user_id: int = Depends(get_user)
):

    cursor.execute("""
        UPDATE reminders
        SET title=?, note=?, date=?
        WHERE id=? AND user_id=?
    """, (data.title, data.note, data.date, reminder_id, user_id))

    if cursor.rowcount == 0:
        raise HTTPException(404, "Reminder not found")

    conn.commit()
    return {"msg": "updated"}

@app.delete("/reminder/{reminder_id}")
def delete_reminder(reminder_id:int,user_id:int=Depends(get_user)):

    cursor.execute("""
        DELETE FROM reminders
        WHERE id=? AND user_id=?
    """,(reminder_id,user_id))

    conn.commit()

    return {"msg":"deleted"}
