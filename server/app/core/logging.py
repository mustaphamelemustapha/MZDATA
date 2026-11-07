import logging
import sys


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        stream=sys.stdout,
        force=True,
    )
    # Ensure uvicorn and app loggers output to stdout immediately without duplicates
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access", "app", "app.access"):
        l = logging.getLogger(name)
        l.setLevel(logging.INFO)
        l.handlers.clear()
        l.propagate = True

