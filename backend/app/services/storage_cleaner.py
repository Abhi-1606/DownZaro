import os
import time
import shutil
import asyncio
import logging
from app.config import settings

logger = logging.getLogger("downzaro.cleaner")

async def cleanup_expired_temp_files():
    """Periodically purges expired download jobs and leftover temp files from disk."""
    while True:
        try:
            await asyncio.sleep(settings.CLEANUP_INTERVAL_SECONDS)
            now = time.time()
            temp_root = settings.TEMP_DIR
            if not os.path.exists(temp_root):
                continue

            for item in os.listdir(temp_root):
                item_path = os.path.join(temp_root, item)
                try:
                    mtime = os.path.getmtime(item_path)
                    if now - mtime > settings.TEMP_FILE_TTL_SECONDS:
                        if os.path.isdir(item_path):
                            shutil.rmtree(item_path, ignore_errors=True)
                        else:
                            os.remove(item_path)
                        logger.info(f"Cleaned expired temporary file: {item_path}")
                except Exception as e:
                    logger.warning(f"Failed to clean item {item_path}: {e}")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in storage cleaner task: {e}")
