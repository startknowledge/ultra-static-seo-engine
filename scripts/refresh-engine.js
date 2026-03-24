import fs from "fs"
import { REFRESH_DAYS } from "../config.js"

export function runRefreshEngine(filePath) {
  const stats = fs.statSync(filePath)

  const ageDays =
    (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24)

  return ageDays > REFRESH_DAYS
}