const map1 = {
  '%0a': /%0a/g,
  '%0A': /%0A/g,
}

const map2 = {
  '%0a': encodeURI('<br />'),
  '%0A': encodeURI('<br />'),
}

/**
 * to format the encoded string into html item, and add **into** the id
 * @param id 
 * @param string 
 */
function formatDecodedString(id, string) {
  let new_string = string;
  Object.keys(map1).forEach(value => {
    let exp = map1[value];
    new_string = string.replace(exp, map2[value]);
  });

  new_string = decodeURI(new_string);
  $(`#${id}`).html(new_string);
}

/**
 * to format elements' html with the same _class 
 */
function formatClassElement(prefix, from, to, from_index, to_index) {
  let f = `${prefix}-${from}-`;
  let t = `${prefix}-${to}-`;
  for(let i = from_index; i<to_index; i++) {
    let ff = `#${f}${i}`;
    let tt = `#${t}${i}`;
    console.log(ff, tt);
    let ff_html = $(ff).html();
    Object.keys(map1).forEach(value => {
      let exp = map1[value];
      ff_html = ff_html.replace(exp, map2[value]);
      $(tt).html(decodeURI(ff_html));
    })
  }
}
