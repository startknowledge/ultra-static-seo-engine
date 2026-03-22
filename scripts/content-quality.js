export function validateContent(content){
  if(content.length < 800) return false
  if(content.split(" ").length < 300) return false
  return true
}
