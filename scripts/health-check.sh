#!/bin/bash

# URL aplikacije
URL="https://deployanjefrontenda.vercel.app/"

# Log fajl
LOGFILE="health.log"

# Dohvati HTTP status
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

# Provjera rezultata
if [ "$STATUS" -eq 200 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') SUCCESS ($STATUS)" >> "$LOGFILE"
    exit 0
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') ERROR ($STATUS)" >> "$LOGFILE"
    exit 1
fi