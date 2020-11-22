const eejs = require('ep_etherpad-lite/node/eejs/');
const Changeset = require('ep_etherpad-lite/static/js/Changeset');
const Security = require('ep_etherpad-lite/static/js/security');
const _encodeWhitespace = require('ep_etherpad-lite/node/utils/ExportHelper')._encodeWhitespace;

/** ******************
* Editor
*/

// Allow <whatever> to be an attribute
exports.aceAttribClasses = function (hook_name, attr, cb) {
  attr.contextsection = 'tag:contextsection';
  cb(attr);
};

/** ******************
* Export
*/

// Include CSS for HTML export
exports.stylesForExport = function (hook, padId, cb) {
  let css = '';
  stylesCSS.forEach((style) => {
    css += `\n${style}`;
  });
  cb(css);
};

// Add the props to be supported in export
exports.exportHtmlAdditionalTags = function (hook, pad, cb) {
  cb(['contextsection']);
};

// line, apool,attribLine,text
exports.getLineHTMLForExport = function (hook, context) {
  const contextV = _analyzeLine(context.attribLine, context.apool);

  // If it has a context
  if (contextV) {
    var contexts = contextV.split('$');
  } else {
    context.lineContent += '<br>';
    return true;
  }

  let before = '';
  let after = '';

  if (contexts.length) {
    contexts.forEach((contextV) => {
      if (contextV.indexOf('context') !== 0) {
        before += `<p class='context${contextV}'>`;
      } else {
        before += `<p class='${contextV}'>`;
      }

      // TODO, ensure this is not hard coded..  Impossible to parse CSS prolly so need a decent solution
      if (contextV === 'Whereas') {
        before += 'WHEREAS, ';
        after += ', and';
      }
      if (contextV === 'firstresolved') {
        before += 'Be it resolved, ';
        after += ', and';
      }
      if (contextV === 'Resolved') {
        before += 'Be It Further Resolved, ';
        after += ', and';
      }
      if (contextV === 'lastresolved') {
        before += 'And finally it is resolved, ';
      }
      if (contextV === 'lastwhereas') {
        before += 'WHEREAS, ';
        after += '; now, therefore,';
      }

      after += '</p>';
    });
    // Remove leading * else don't..
    if (context.lineContent[0] === '*') {
      context.lineContent = context.lineContent.substring(1);
    }

    context.lineContent = `${before + context.lineContent + after}<br>`;
    return true;
  }
};

// clean up HTML into something sane
exports.exportHTMLSend = function (hook, html, cb) {
  const blockElements = ['Sponsor', 'Title', 'Whereas', 'Resolved', 'Signature', 'Date', 'LastWhereas', 'LastResolved', 'FirstResolved'];
  console.warn('um okay');
  sanitize.exec(html, blockElements, (error, cleanedHTML) => {
    console.warn(cleanHTML);
    cb(cleanedHTML);
  });
};

function _analyzeLine(alineAttrs, apool) {
  let context = null;
  if (alineAttrs) {
    const opIter = Changeset.opIterator(alineAttrs);
    if (opIter.hasNext()) {
      const op = opIter.next();
      context = Changeset.opAttributeValue(op, 'context', apool);
    }
  }
  return context;
}

exports.eejsBlock_scripts = function (hook_name, args, cb) {
  args.content += eejs.require('ep_citation/templates/scripts.ejs', {}, module);
  return cb();
};
