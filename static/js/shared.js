var supportedcitations = ['citation'];

exports.collectContentPre = function (hook, citation) {
  const tname = citation.tname;
  const state = citation.state;
  const lineAttributes = state.lineAttributes;
  // top.console.log("tname", tname);
  if (tname === 'div' || tname === 'p') {
    delete lineAttributes.citation;
  }
  if (supportedcitations.indexOf(tname) !== -1) {
    // top.console.log("tname", tname);
    lineAttributes.citation = tname;
  }

  // Probably not needed
  // lineAttributes['lastlinebutton'] = true;
};

exports.collectContentPost = function (hook, citation) {
  const tname = citation.tname;
  const state = citation.state;
  const lineAttributes = state.lineAttributes;
  if (supportedcitations.indexOf(tname) !== -1) {
    delete lineAttributes.citation;
  }

  // Probably not needed
  // lineAttributes['lastlinebutton'] = true;
};
