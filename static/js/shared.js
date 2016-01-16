var supportedcitations = ["evidence"];

exports.collectContentPre = function(hook, evidence){
  var tname = evidence.tname;
  var state = evidence.state;
  var lineAttributes = state.lineAttributes
  top.console.log("tname", tname);
  if(tname === "div" || tname === "p"){
    delete lineAttributes['evidence'];
  }
  if(supportedcitations.indexOf(tname) !== -1){
    top.console.log(tname);
    lineAttributes['evidence'] = tname;
  }

  // Probably not needed
  // lineAttributes['lastlinebutton'] = true;
};

exports.collectContentPost = function(hook, evidence){
  var tname = evidence.tname;
  var state = evidence.state;
  var lineAttributes = state.lineAttributes;
  if(supportedcitations.indexOf(tname) !== -1){
    delete lineAttributes['evidence'];
  }

  // Probably not needed
  // lineAttributes['lastlinebutton'] = true;

};
