#!/bin/bash

# Vercel doesn't come with Flutter pre-installed, so this script downloads it and builds the app.
echo "Downloading Flutter..."
if [ ! -d "flutter" ]; then 
  git clone https://github.com/flutter/flutter.git -b stable
fi

# Add flutter to path
export PATH="$PATH:`pwd`/flutter/bin"

echo "Building Flutter Web App..."
flutter build web --release
