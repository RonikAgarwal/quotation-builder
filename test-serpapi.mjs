const key = 'ae91b82fd1f8724751c8415654c731867851f91971154f00db1ff72ba057189e';
const query = 'Seal-o-Primer';

const url = new URL('https://serpapi.com/search.json');
url.searchParams.append('q', query);
url.searchParams.append('engine', 'google_images');
url.searchParams.append('api_key', key);

fetch(url.toString())
  .then(res => res.json())
  .then(data => {
    if (data.images_results) {
      console.log('Success! Found', data.images_results.length, 'images');
      console.log(data.images_results[0]);
    } else {
      console.log('Error', data);
    }
  })
  .catch(err => console.error(err));
