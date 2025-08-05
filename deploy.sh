#!/bin/bash

# Set the bucket path
BUCKET_PATH="gs://cdn-mi-prod-msoffice-6ed0/msexcel"

# Step 1: Remove everything currently in the target folder
echo "Deleting all existing files in $BUCKET_PATH..."
gsutil -m rm -r "${BUCKET_PATH}/**"

# Step 2: Upload everything from the local dist folder to the bucket
echo "Uploading contents of ./dist to $BUCKET_PATH..."
gsutil -m cp -r ./dist/* "$BUCKET_PATH/"


# dont cache functions.js
gsutil setmeta -h "Cache-Control:no-cache, max-age=0" gs://cdn-mi-prod-msoffice-6ed0/msexcel/functions.js


echo "Done."
