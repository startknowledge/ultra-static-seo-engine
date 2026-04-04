export function generateTemplateBlog(trend, repoName) {
  return `<h1>${trend}</h1>
  <p>${trend} is currently a hot topic. Here's what you need to know.</p>
  <h2>Why is ${trend} trending?</h2>
  <p>Recent developments have brought ${trend} into the spotlight. Stay informed with our updates.</p>
  <h2>Key insights</h2>
  <ul><li>Impact on ${repoName}</li><li>Future predictions</li><li>Expert opinions</li></ul>`;
}