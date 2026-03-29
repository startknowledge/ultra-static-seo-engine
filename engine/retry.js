export async function retry(fn, attempts=5){

  for(let i=0;i<attempts;i++){
    try{
      return await fn()
    }catch(e){

      if(e.message.includes("429")){
        console.log("⚠️ Rate limit retry...", i+1)
        await new Promise(r=>setTimeout(r,2000*(i+1)))
      }else{
        console.log("❌ Error:", e.message)
      }

    }
  }

  return []
}