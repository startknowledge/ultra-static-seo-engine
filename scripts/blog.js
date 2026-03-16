fetch("/rss.xml")
.then(res=>res.text())
.then(data=>{

const parser=new DOMParser()

const xml=parser.parseFromString(data,"text/xml")

const items=xml.querySelectorAll("item")

const container=document.getElementById("blog-list")

items.forEach(item=>{

const title=item.querySelector("title").textContent
const link=item.querySelector("link").textContent

const div=document.createElement("div")

div.innerHTML=`
<div class="card">
<h3><a href="${link}">${title}</a></h3>
</div>
`

container.appendChild(div)

})

})