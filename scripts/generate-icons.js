// scripts/generate-icons.js - Script para generar íconos (versión simplificada)
const fs = require('fs')
const path = require('path')

// Crear directorio de íconos si no existe
const iconsDir = path.join(__dirname, '../public/icons')
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Crear íconos placeholder (en producción usarías Sharp o similar)
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

sizes.forEach(size => {
  const svgContent = `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="white"/>
  <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" fill="#3b82f6" font-family="Arial, sans-serif" font-size="16" font-weight="bold">V</text>
</svg>`
  
  fs.writeFileSync(
    path.join(iconsDir, `icon-${size}x${size}.png.svg`), 
    svgContent.trim()
  )
})

console.log('✅ Placeholder icons generated')