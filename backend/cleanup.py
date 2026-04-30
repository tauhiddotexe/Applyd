"""Remove legacy demo records."""

from sqlalchemy import text

from app.db.session import engine


def cleanup():
    with engine.begin() as conn:
        app_result = conn.execute(
            text(
                """
                DELETE FROM applications
                WHERE user_id IN (
                    '00000000-0000-0000-0000-000000000000',
                    '00000000-0000-0000-0000-000000000001'
                )
                """
            )
        )
        user_result = conn.execute(
            text(
                """
                DELETE FROM users
                WHERE id IN (
                    '00000000-0000-0000-0000-000000000000',
                    '00000000-0000-0000-0000-000000000001'
                )
                OR email = 'demo@applyd.dev'
                """
            )
        )
        print(f"Deleted demo users: {user_result.rowcount}")
        print(f"Deleted demo applications: {app_result.rowcount}")

    engine.dispose()


if __name__ == "__main__":
    cleanup()
