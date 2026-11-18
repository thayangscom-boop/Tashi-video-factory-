#!/bin/bash
# bundle the scene + engine modules into one script for the page (node modules come from the kit's own node_modules, made by setup.sh)
set -e
cd "$(dirname "$0")"
NODE_PATH=../node_modules ../node_modules/.bin/esbuild src/main.ts --bundle --format=iife --target=es2022 --outfile=web/bundle.js --alias:@eng=./eng --loader:.json=json --log-level=warning
ls -la web/bundle.js | awk '{print "bundle", $5}'
