#!/bin/bash
source .env
echo "Waiting for Google to propagate API key changes..."
for i in {1..30}; do
  RES=$(curl -s "https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=rating&key=${GOOGLE_PLACES_API_KEY}&language=ar")
  STATUS=$(echo $RES | jq -r '.status')
  if [ "$STATUS" == "OK" ]; then
    echo "API Key is now active! Triggering Medusa sync..."
    curl -s -H "x-publishable-api-key: pk_bd9f45a9c0ade51d0ea290181c841fae2ed8e5436cd6fd60285fcd5b80841dfa" http://localhost:9000/store/google-reviews/sync
    exit 0
  fi
  echo "Still waiting... (Attempt $i/30)"
  sleep 10
done
echo "Timeout waiting for Google."
exit 1
