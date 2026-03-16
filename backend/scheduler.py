import time
from datetime import datetime, timezone
import main

def scheduler_loop():

    while True:

        now = datetime.now(timezone.utc)

        main.cursor.execute("""
            SELECT id, user_id, start_time, notified_15, notified_5
            FROM tasks
            WHERE status='waiting'
        """)

        tasks = main.cursor.fetchall()

        for task in tasks:

            task_id, user_id, start_time, n15, n5 = task
            start = datetime.fromisoformat(start_time)

            diff = (start - now).total_seconds() / 60

            if 10 < diff <= 15 and not n15:

                main.send_notification(
                    user_id,
                    "Task Reminder",
                    "Görevine 15 dakika kaldı ⏳",
                    task_id
                )

                main.cursor.execute(
                    "UPDATE tasks SET notified_15=1 WHERE id=?",
                    (task_id,)
                )

            if 0 < diff <= 5 and not n5:

                main.send_notification(
                    user_id,
                    "Task Reminder",
                    "5 dakika kaldı. Başlamak ister misin?",
                    task_id
                )

                main.cursor.execute(
                    "UPDATE tasks SET notified_5=1 WHERE id=?",
                    (task_id,)
                )

        main.cursor.connection.commit()

        time.sleep(30)