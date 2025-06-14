#!/bin/bash

# Create a temporary SVG file
cat > temp.svg << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="256" cy="256" r="256" fill="#4F46E5"/>
  
  <!-- Firefox-like globe -->
  <path d="M256 64C150.144 64 64 150.144 64 256s86.144 192 192 192 192-86.144 192-192S361.856 64 256 64zm0 352c-88.224 0-160-71.776-160-160S167.776 96 256 96s160 71.776 160 160-71.776 160-160 160z" fill="#ffffff"/>
  
  <!-- VS text -->
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="#ffffff" text-anchor="middle">VS</text>
</svg>
EOF

# Create 192x192 icon
convert -background none -size 192x192 temp.svg public/icons/icon-192x192.png

# Create 512x512 icon
convert -background none -size 512x512 temp.svg public/icons/icon-512x512.png

# Clean up
rm temp.svg 