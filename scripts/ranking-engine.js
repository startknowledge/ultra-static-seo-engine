export function predictRanking(content){

let score = 0

if(content.includes("<h2>")) score += 20
if(content.length > 2000) score += 30
if(content.includes("FAQ")) score += 20
if(content.includes("<ul>")) score += 10
if(content.includes("<table>")) score += 10

return score
}