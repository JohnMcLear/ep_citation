var _, $, jQuery;
var $ = require('ep_etherpad-lite/static/js/rjquery').$;
var _ = require('ep_etherpad-lite/static/js/underscore');
var padeditor = require('ep_etherpad-lite/static/js/pad_editor').padeditor;

// Handle Drop events
exports.aceDrop = function(hook, citation){
  // There is a Chrome bug that prevents the drop event firing if the selStart & selEnd
  // is the last available character on a editable div.  IE dragging an dropping onto
  // the last character on teh last line wont even fire a drop event..
  citation.e.preventDefault();
  clientVars.isDropping = true;

  var div = $(citation.e.target).closest("div");
  var jsdiv = citation.e.target;
  var divHTML = div.html();
  var divWidth = div.width();

  // If we're not actually dropping on a line but we're actually
  // attempting to drop onto the last line
  if(div.length === 0){
    // Last line, this is so bad but it works 10/10
    var divStyle = false;
    var lN = citation.rep.lines.length() -1;
  }else{
    var divStyle = getComputedStyle($(div)[0]);
    var lN = $(citation.e.target).closest("div").prevAll("div").length;
  }
  // console.log("lN", lN);

  // If the Div has no text at all we can assume it's a blank line..
  if(div.text() === ""){
    var emptyLine = true;
    var selStart = 0;
    // console.log("no text in line");
  }

  if(!emptyLine){
    // Get the X px offset of the drop event
    var offset = citation.e.originalEvent.clientX;
    // console.log("x offset", offset, "ln", lN);

    //  Borrowed from http://stackoverflow.com/questions/2558426/getcomputedstyle-or-cssmap-to-get-every-style-declaration
    var styles= [];
    // The DOM Level 2 CSS way
    if ('getComputedStyle' in window) {
      var cs= getComputedStyle(jsdiv, '');
      if (cs.length!==0)
          for (var i= 0; i<cs.length; i++)
              styles.push([cs.item(i), cs.getPropertyValue(cs.item(i))]);
      // Opera workaround. Opera doesn't support `item`/`length`
      // on CSSStyleDeclaration.
      //
      else
          for (var k in cs)
              if (cs.hasOwnProperty(k))
                  styles.push([k, cs[k]]);

    // The IE way
    //
    } else if ('currentStyle' in element) {
       var cs= element.currentStyle;
         for (var k in cs)
         styles.push([k, cs[k]]);
    }
    // End of borrwed code

    // Given we know the X offset inside of the DIV then redraw that DIV
    // wrapping each character in a span
    // Parts borrowed from https://github.com/redhog/ep_cursortrace/blob/master/static/js/main.js
    var oldWorker = $('iframe[name="ace_outer"]').contents().find('#outerdocbody').find("#citationWorker");
    $(oldWorker).remove();

    var splitHTML = "";

    // Cake, there is an error here -- CAKE STILL TO DO
    // http://stackoverflow.com/questions/11485773/wrap-words-in-paragraph-with-span-keep-nested-links-functioning
    console.log("div", div);
    var multipleChildren = $(div).contents().children().length > 0;
    if(!multipleChildren){
      // console.log("doesn't have multiple children so can just wrap each char");
      // console.log($(div).html());
      var text = $(div).text();
      var splitHTMLArr = [];
      $.each(text.split(''), function(i, c){
        splitHTMLArr.push("<span>"+c+"</span>");
      });
      var splitHTML = splitHTMLArr.join("");
    }else{
      // Div has multiple children so we need to iterate through each child to wrap it.
      // CAKE This is still to do
      $(div).contents().children().each(function(i, node) {
        console.log("node", node);
        console.log("this", this);
      });
    }


    var newLine = "<span style='position:absolute;top:0;left:0;z-index:999999;width:"+divWidth+"px' id='citationWorker' class='ghettoCursorXPos'>"+splitHTML+"</span>";

    // Add the HTML to the DOM
    $('iframe[name="ace_outer"]').contents().find('#outerdocbody').append(newLine);

    // Get the worker element
    var worker = $('iframe[name="ace_outer"]').contents().find('#outerdocbody').find("#citationWorker");

    $.each(styles, function(key, style){
      $(worker).css(style[0], style[1]);
    });
    $(worker).css({position:"absolute", top:0, left:0});

    // We know the offset of the click event and we know the offset of each span
    var leftOffsets = [];
    var offsetElements = $(worker).children("span");

    $.each(offsetElements, function(key, span){
      // We take the width and divide by two here because browsers
      // switch caret location half way through a character..  TIL
      leftOffsets.push(span.offsetLeft + ($(span).width() /2));
    })

    var selStart = 0;
    $.each(leftOffsets, function(key, spanOffset){
      if(offset > spanOffset){
        selStart = key+1;
      }
    })

    // Remove worker
    // $(worker).remove();

  // We know the Y and X offset, selStart only contains the X
  // lN contains the line Number..
  // We would basically set the attribute at this point
  // console.log("selStart", selStart);

  }


  // TODO support other data types
  clientVars.citationType = citation.e.originalEvent.dataTransfer.types[1];
  clientVars.citationJSON = JSON.parse(citation.e.originalEvent.dataTransfer.getData(clientVars.citationType));
  var cleanId = clientVars.citationJSON.miscId.replace(/[^a-z0-9]/gi,'');

  clientVars.dropLineNumber = lN;

  var type = clientVars.citationType;
  var citation = clientVars.citationJSON;

  padeditor.ace.callWithAce(function (ace) {

    // TODO: Currently we can't get the X of a given drop range so we will just prepend it to any given line
    var rep = ace.ace_getRep();
    // REP is wrong because it gets the position BEFORE the drag event :(
    // This is thoroughly documented here..
    // http://stackoverflow.com/questions/14678451/precise-drag-and-drop-within-a-contenteditable
    // var sel = window.getSelection(); // Also doesn't work
    // console.log(sel);

    if(!citation.quote){
      ace.ace_replaceRange([lN,selStart], [lN,selStart], "[1]");
//      console.log("YUMMY", document.caretRangeFromPoint(x,y));
//      ace.ace_performSelectionChange([lN,0], [lN, false);
      ace.ace_performDocumentApplyAttributesToRange([lN,selStart], [lN,selStart+3], [["citation", cleanId]]);
    }

    if(citation.quote){
      // console.log("replacing range with quote", lN, selStart);
      ace.ace_replaceRange([lN,selStart], [lN,selStart], citation.quote);
      var quoteLength = citation.quote.length;
      console.log("length", quoteLength);
      ace.ace_performSelectionChange([lN,selStart],[lN, selStart + quoteLength], false);
      ace.ace_performDocumentApplyAttributesToRange([lN, selStart], [lN, selStart + quoteLength], [["citation", cleanId]]);
    }
    ace.ace_focus();
  }, "citation");

}

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context){
  // padEditor = context.ace;
};

/*****
* Editor setup
******/

// Our sup/subscript attribute will result in a class
// I'm not sure if this is actually required..
exports.aceAttribsToClasses = function(hook, citation){
  if(!clientVars.citations) clientVars.ep_citation = [];

  var classes = [];
  if(!clientVars.ep_citation){
    clientVars.ep_citation = {};
  }
  if(citation.key == 'citation'){
    // We store the citations as a lookup with the id as a key
    var id = citation.value;
    clientVars.ep_citation[id] = citation;
    classes.push("citation:"+id);
  }
  return classes;
}

// Block elements - Prevents character walking
exports.aceRegisterBlockElements = function(){
  return ['citation'];
}


exports.aceInitialized = function(hook, citation){
  var editorInfo = citation.editorInfo;
  // editorInfo.ace_handleDrop = _(handleDrop).bind(citation);
}

exports.aceCreateDomLine = function(hook_name, args, cb) {
  if (args.cls.indexOf('citation:') >= 0) {
    var clss = [];
    var argClss = args.cls.split(" ");
     var value;

    for (var i = 0; i < argClss.length; i++) {
      var cls = argClss[i];
      if (cls.indexOf("citation:") != -1) {
	value = cls.substr(cls.indexOf(":")+1);
      } else {
	clss.push(cls);
      }
    }
    return cb([{
      cls: clss.join(" "),
      extraOpenTags: "<span class='citation'><a href='" + unescape(value) + "'>",
      extraCloseTags: '</a>'
    }]);
  }
  return cb();
};

// Here we convert the class citation:x into a tag
exports.aceDomLineProcessLineAttributes = function(name, citation){
/*
  var preHtml = "";
  var postHtml = "";
  var processed = false;
  var citations = /citation:(.*?) /i.exec(citation.cls);
  if(!citations && !processed) return [];
  if(citations){
    var id = citations[0];
    id = id.replace("citation:", "");
    id = id.trim();
    var citation = clientVars.ep_citation[id];
    // We have to get the citation contents from the clientVars..
    preHtml += '<citation class="citation" id="'+id+'" title="citation"><a href="'+citation.url+'">'+citation.title+'</a>';
    postHtml += '</citation class="citation">';
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
*/
};

// Show the active Context
exports.aceEditEvent = function(hook, call, cb){
/*
  var cs = call.callstack;
  var rep = call.rep;
  var documentAttributeManager = call.documentAttributeManager;
  if(clientVars.isDropping && call.callstack.type === "idleWorkTimer"){
    clientVars.isDropping = false;
    var json = clientVars.citationJSON;
    var type = clientVars.citationType;
    padEditor.callWithAce(function(ace){
      ace.ace_handleDrop(type, json, clientVars.dropLineNumber);

      // Create the new line break
      ace.ace_replaceRange([clientVars.dropLineNumber+1,0], [clientVars.dropLineNumber+1,0], "\n");
    });
  }
*/
}
