#!/usr/bin/env node
/**
 * Create simple PNG icons for PWA
 * This creates basic colored circle icons as placeholders
 * Replace with proper logo conversions later
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Create a simple colored PNG programmatically
// This generates a minimal valid PNG with the app's theme color

function createSimpleIcon(size) {
  // Create a minimal PNG with theme color (#1E3A5F - navy)
  // This is a very basic approach - for production, use proper SVG->PNG conversion
  
  const canvas = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d9488;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#1E3A5F" rx="${size * 0.15}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="url(#grad)"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.22}" fill="white"/>
  <text x="${size/2}" y="${size/2 + size * 0.08}" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.15}" 
        font-weight="bold"
        fill="#1E3A5F" 
        text-anchor="middle">OC</text>
</svg>`;
  
  return canvas;
}

// Generate SVG placeholders that will work in manifest
const icon192 = createSimpleIcon(192);
const icon512 = createSimpleIcon(512);

writeFileSync(join(publicDir, 'icon-192.svg'), icon192);
writeFileSync(join(publicDir, 'icon-512.svg'), icon512);

console.log('✅ Created PWA icon files:');
console.log('   - frontend/public/icon-192.svg');
console.log('   - frontend/public/icon-512.svg');
console.log('');
console.log('📱 SVG icons work great for PWAs!');
console.log('   (Optional: Convert to PNG using ImageMagick or online tools)');
