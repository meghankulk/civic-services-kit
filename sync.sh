#!/bin/sh
# Copies the kit from its source folder and wraps index.html in a full HTML document for GitHub Pages.
set -e
SRC="${1:-$HOME/Desktop/asi-slides/interview-prep/kaizen-component-library}"
cd "$(dirname "$0")"
mkdir -p ontology builder
cp "$SRC"/kit.js "$SRC"/kit.css .
cp "$SRC"/ontology/*.js "$SRC"/ontology/*.css ontology/
cp "$SRC"/builder/*.js "$SRC"/builder/*.css builder/
{ printf '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n</head>\n<body>\n'
  cat "$SRC"/index.html
  printf '\n</body>\n</html>\n'; } > index.html
touch .nojekyll
