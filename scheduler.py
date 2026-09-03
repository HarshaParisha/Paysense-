"""
PaySense APScheduler Integration
Manages delayed background execution for payment failure recovery jobs.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from apscheduler.schedulers.background import BackgroundScheduler

# Initialize BackgroundScheduler configured with Asia/Kolkata timezone
IST_TZ = ZoneInfo("Asia/Kolkata")
scheduler = BackgroundScheduler(timezone=IST_TZ)


def start_scheduler():
    """Starts the scheduler safely, preventing duplicate starts on reloads."""
    if not scheduler.running:
        try:
            scheduler.start()
        except Exception:
            pass


def schedule_action(job_func, delay_seconds: int, **kwargs):
    """
    Schedules a callable function to execute after delay_seconds.
    Adds the job as a 'date' type job in APScheduler.
    """
    delay = max(0, int(delay_seconds))
    run_date = datetime.now(IST_TZ) + timedelta(seconds=delay)
    return scheduler.add_job(
        job_func,
        trigger="date",
        run_date=run_date,
        kwargs=kwargs,
        misfire_grace_time=3600,
    )


# Start scheduler on import
start_scheduler()
