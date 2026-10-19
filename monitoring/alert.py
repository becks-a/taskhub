#!/usr/bin/env python3

import json
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path

SCRIPT = Path(__file__).with_name("health-check.sh")


def main():
    result = subprocess.run(
        ["bash", str(SCRIPT)],
        capture_output=True,
        text=True,
        check=False,
    )

    print(result.stdout, end="", flush=True)

    if result.stderr:
        print(result.stderr, end="", flush=True)

    timestamp = datetime.now(timezone.utc).isoformat()

    if result.returncode == 0:
        print("MONITORING STATUS: HEALTHY")
        return 0

    alert = {
        "timestamp": timestamp,
        "severity": "critical",
        "service": "taskhub",
        "message": "One or more TaskHub health checks failed",
        "exit_code": result.returncode,
        "details": result.stdout.strip(),
    }

    print("ALERT:", json.dumps(alert), flush=True)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
