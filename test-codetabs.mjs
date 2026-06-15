const key = 'ae91b82fd1f8724751c8415654c731867851f91971154f00db1ff72ba057189e';
const query = 'Seal-o-Primer';

const url = new URL('https://serpapi.com/search.json');
url.searchParams.append('engine', 'google_images');
url.searchParams.append('q', query);
url.searchParams.append('api_key', key);

const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${url.toString()}`;

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
