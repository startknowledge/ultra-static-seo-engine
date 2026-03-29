import fs from "fs"

export async function submitToGoogle(url) {

  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GOOGLE_INDEXING_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url,
      type: "URL_UPDATED"
    })
  })

  console.log("📡 Indexed:", url)
}