const key = 'ae91b82fd1f8724751c8415654c731867851f91971154f00db1ff72ba057189e';
const query = 'Seal-o-Primer';

const url = `https://serpapi.com/search.json?engine=google_images&q=${query}&api_key=${key}`;

const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${url}`;

console.time('codetabs');
fetch(proxyUrl)
  .then(res => res.json())
  .then(data => {
    console.timeEnd('codetabs');
    console.log('Success! Found', data.images_results?.length, 'images');
  })
  .catch(err => {
    console.timeEnd('codetabs');
    console.error(err);
  });
