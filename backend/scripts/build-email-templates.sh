#!/usr/bin/env bash
set -e
set -x
mkdir -p app/email-templates/build
for file in app/email-templates/src/*.mjml; do
  mjml "$file" -o "app/email-templates/build/$(basename "$file" .mjml).html"
done
