import fs from 'fs'
import path from 'path'
import JSZip from 'jszip'

export async function unzip(zipData: Buffer, destPath: string) {
  const zip = await JSZip.loadAsync(zipData)

  for (const relativePath of Object.keys(zip.files)) {
    const file = zip.files[relativePath]
    const filePath = path.join(destPath, relativePath)

    if (file.dir) {
      fs.mkdirSync(filePath, { recursive: true })
    } else {
      const content = await file.async('nodebuffer')
      const dir = path.dirname(filePath)
      fs.mkdirSync(dir, {
        recursive: true
      })
      fs.writeFileSync(filePath, content)
    }
  }
}
