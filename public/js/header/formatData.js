const map1 = {
  '%0a': /%0a/g,
  '%0A': /%0A/g,
}

const map2 = {
  '%0a': encodeURI('<br />'),
  '%0A': encodeURI('<br />'),
}

const map3 = {
  '%3c': /%3c/g,
  '%3C': /%3C/g,
  '%3e': /%3e/g,
  '%3E': /%3E/g,
}

const map4 = {
  '%3c': '&#60;',
  '%3C': '&#60;',
  '%3e': '&gt;',
  '%3E': '&gt;',
}

/**
 * to format the encoded string into html item, and add **into** the id
 * @param id 
 * @param string 
 */
function formatDecodedString(id, string) {
  let new_string = string;

  Object.keys(map3).forEach(value => {
    let exp = map3[value];
    try {
      new_string = new_string.replace(exp, map4[value]);
    } catch(err) {

    }
  })

  Object.keys(map1).forEach(value => {
    let exp = map1[value];
    try {
      new_string = new_string.replace(exp, map2[value]);
    } catch(err) {
      
    }
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
    let ff_html = $(ff).html();

    Object.keys(map3).forEach(value => {
      let exp = map3[value];
      ff_html = ff_html.replace(exp, map4[value]);
    })

    Object.keys(map1).forEach(value => {
      let expp = map1[value];
      ff_html = ff_html.replace(expp, map2[value]);
    })

    $(tt).html(decodeURI(ff_html));

  }
}
