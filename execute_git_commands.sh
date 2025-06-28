#!/bin/bash
cd /Users/sergejschulz/Desktop/main/umzugs-webapp
git add -A
git commit -m "fix: Mobile UI für Share-Dialog optimiert - Buttons überlappen nicht mehr auf Mobile"
git push origin main
rm -f git_push.py commit_and_push.sh
git add git_push.py commit_and_push.sh
git commit -m "cleanup: Unnötige Git-Scripts entfernt"
git push origin main
echo "Git commands executed successfully!"