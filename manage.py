#!/usr/bin/env python3
import os
import sys


def main():
  """Run administrative tasks."""
  os.environ.setdefault("DJANGO_SETTINGS_MODULE", "giessplan_site.settings")
  try:
    from django.core.management import execute_from_command_line
  except ImportError as exc:
    raise ImportError(
      "Django ist nicht installiert. Bitte `pip install -r requirements.txt` ausführen."
    ) from exc
  execute_from_command_line(sys.argv)


if __name__ == "__main__":
  main()
