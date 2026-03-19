export function optimizeTitle(title){

const powerWords = ["Best","Ultimate","Top","Guide","2026","Free"]

const random = powerWords[Math.floor(Math.random()*powerWords.length)]

if(!title.includes(random)){
return `${random} ${title}`
}

return title
}