const fs = require('fs')
const path = require('path')

// Function to update version
function updateVersion(changeDescription) {
  const filePath = path.join(__dirname, 'src', 'components', 'VersionDisplay.tsx')

  // Generate new version with timestamp
  const now = new Date()
  const version = `1.0.0-fix.${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Read current file
  let content = fs.readFileSync(filePath, 'utf8')

  // Update version
  content = content.replace(
    /const APP_VERSION = '.*'/,
    `const APP_VERSION = '${version}'`
  )

  // Update last change description
  if (changeDescription) {
    content = content.replace(
      /const LAST_UPDATE = '.*'/,
      `const LAST_UPDATE = '${changeDescription}'`
    )
  }

  // Write back
  fs.writeFileSync(filePath, content)

  console.log(`✅ Version updated to: ${version}`)
  console.log(`📝 Change: ${changeDescription || 'No description provided'}`)
}

// Get change description from command line
const changeDescription = process.argv.slice(2).join(' ') || 'General updates'

updateVersion(changeDescription)