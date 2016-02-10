var supportedcitations = ["citation"];

exports.collectContentPre = function(hook, citation){
  var tname = citation.tname;
  var state = citation.state;
  var lineAttributes = state.lineAttributes
  // top.console.log("tname", tname);
  if(tname === "div" || tname === "p"){
    delete lineAttributes['citation'];
  }
  if(supportedcitations.indexOf(tname) !== -1){
    // top.console.log("tname", tname);
    lineAttributes['citation'] = tname;
  }

  // Probably not needed
  // lineAttributes['lastlinebutton'] = true;
};

exports.collectContentPost = function(hook, citation){
  var tname = citation.tname;
  var state = citation.state;
  var lineAttributes = state.lineAttributes;
  if(supportedcitations.indexOf(tname) !== -1){
    delete lineAttributes['citation'];
  }

  // Probably not needed
  // lineAttributes['lastlinebutton'] = true;

};
