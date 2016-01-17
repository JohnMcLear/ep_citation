var _, $, jQuery;
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var padEditor;

// Handle Drop events
exports.aceDrop = function(hook, citation){
  // There is a Chrome bug that prevents the drop event firing if the selStart & selEnd
  // is the last available character on a editable div.  IE dragging an dropping onto
  // the last character on teh last line wont even fire a drop event..
  citation.e.preventDefault();
  clientVars.isDropping = true;
  var json = citation.e.originalEvent.dataTransfer.getData("evidence");
  var lN = $(citation.e.target).prevAll("div");

  // If we dropped on a none existant line whack it at the end of the pad
  if($(citation.e.target).context.nodeName === "HTML"){
    lN.length = $(citation.e.target).find("#innerdocbody").find("div").length -1;
  }

  // TODO support other data types
  clientVars.citationType = "evidence";
  clientVars.dropLineNumber = lN.length;
  clientVars.citationJSON = json;
}

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context){
  padEditor = context.ace;
};

/*****
* Editor setup
******/

// Our sup/subscript attribute will result in a class
// I'm not sure if this is actually required..
exports.aceAttribsToClasses = function(hook, citation){
  var classes = [];
  if(!clientVars.ep_citation){
    clientVars.ep_citation = {};
  }
  if(citation.key == 'evidence'){
    // We store the citations as a lookup with the id as a key
    var citation = JSON.parse(citation.value);
    var id = citation.id;
    clientVars.ep_citation[id] = citation;
    classes.push("evidence:"+id);
  }
  return classes;
}

// Block elements - Prevents character walking
exports.aceRegisterBlockElements = function(){
  return ['evidence'];
}


exports.aceInitialized = function(hook, citation){
  var editorInfo = citation.editorInfo;
  editorInfo.ace_handleDrop = _(handleDrop).bind(citation);
}

// Here we convert the class evidence:x into a tag
exports.aceDomLineProcessLineAttributes = function(name, citation){
  var preHtml = "";
  var postHtml = "";
  var processed = false;
  var evidences = /evidence:(.*?) /i.exec(citation.cls);
  if(!evidences && !processed) return [];
  if(evidences){
    var id = evidences[0];
    id = id.replace("evidence:", "");
    id = id.trim();
    var citation = clientVars.ep_citation[id];
    // We have to get the citation contents from the clientVars..
    preHtml += '<evidence class="evidence" id="'+id+'">EVIDENCE<p class="title"><a href="'+citation.url+'">'+citation.title+'</a></p>';
    postHtml += '</evidence class="evidence">';
    processed = true;
  }

  if(processed){
    var modifier = {
      preHtml: preHtml,
      postHtml: postHtml,
      processedMarker: true
    };
    return [modifier];
  }else{
    return [];
  }
};

function handleDrop(type, json, lineNumber){
  var rep = this.rep;
  var documentAttributeManager = this.documentAttributeManager;
  json = JSON.parse(json);
  json.id = json.miscId.replace(/[^a-z0-9]/gi,'');

  this.editorInfo.ace_callWithAce(function(ace){
    documentAttributeManager.setAttributeOnLine(lineNumber, type, JSON.stringify(json)); // make the line a evidence
  });
}


// Show the active Context
exports.aceEditEvent = function(hook, call, cb){
  var cs = call.callstack;
  var rep = call.rep;
  var documentAttributeManager = call.documentAttributeManager;
  if(clientVars.isDropping && call.callstack.type === "idleWorkTimer"){
    clientVars.isDropping = false;
    var json = clientVars.citationJSON;
    var type = clientVars.citationType;
    padEditor.callWithAce(function(ace){
      ace.ace_handleDrop(type, json, clientVars.dropLineNumber);
    });
  }
}
