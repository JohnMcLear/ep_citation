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

  // If the Div has no text at all we can assume it's a blank line..
  if(div.text() === ""){
    var emptyLine = true;
    var selStart = 0;
    // console.log("no text in line");
  }

  if(!emptyLine){
    // Get the X px offset of the drop event
    var offsetX = citation.e.originalEvent.clientX;
    var offsetY = citation.e.originalEvent.clientY;
    var divOffsetTop = $(citation.e.target).closest("div").offset().top;

    // We can compute how far down the target line the mouse event is..
    var lineDifference = offsetY - divOffsetTop;

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

    divHTML = divHTML.replace(/<span/g, '<author');
    divHTML = divHTML.replace(/<\/span/g, '</author');
    console.log("divHTML", divHTML);

    var newLine = "<span style='position:absolute;top:0;left:0;z-index:999999' id='citationWorker' class='ghettoCursorXPos'>"+divHTML+"</span>";

    // Add the HTML to the DOM
    $('iframe[name="ace_outer"]').contents().find('#outerdocbody').append(newLine);

    // Get the worker element
    var worker = $('iframe[name="ace_outer"]').contents().find('#outerdocbody').find("#citationWorker");

    // Blast the HTML into fragments, pew pew
    $(worker).blast({
      delimiter: "character",
      tag: "span",
      stripHTMLTags: false
    });

    $.each(styles, function(key, style){
      $(worker).css(style[0], style[1]);
    });
    $(worker).css({position:"absolute", top:0, left:0, width:divWidth+"px"});

    // We know the offset of the click event and we know the offset of each span
    var leftOffsets = [];
    var topOffsets = [];

    var offsetElements = $(worker).find("span");

    // console.log("offsetElements", offsetElements);

    // push a blank line with 0 top position :)
    topOffsets.push(0);
    $.each(offsetElements, function(key, span){
      // We take the width and divide by two here because browsers
      // switch caret location half way through a character..  TIL
      var left = span.offsetLeft + ($(span).width() /2);
      // console.log($(span).text(), left, offsetX);
      leftOffsets.push(span.offsetLeft + ($(span).width() /2));
      topOffsets.push(span.offsetTop + $(span).height());
    })

    var selStart = 0;
    $.each(leftOffsets, function(key, spanOffset){
      if(lineDifference < topOffsets[key]){
        // If the left offset is correct
        if(spanOffset >= offsetX){
          // Interesting thing we do here is actually pass the incorrect key
          // but as 0 == 1 in Etherpad start position it self corrects! :)
          selStart = key;
          return false;
        }
      }
    })
    // If none of the above works we assume it's the end of the line..
    if(selStart === 0){
      // console.log("appears to be end of the line as we didn't catch any span in this X Y co-rd", offsetX, leftOffsets);
      // console.log("Y", offsetY, topOffsets);
      selStart = $(worker).text().length;
    }

    // If the caret is less than half into a character it should be at pos 0
    // This seems complex but to see it in action simply comment this out
    // Then drag something into position 0,1 or a wrapped line [x,1] where x
    // is the Y of the wrapped line..
    if(offsetX < (leftOffsets[0] * 2)){
      selStart += -1;
    }

console.log("selStart", selStart);

    // $(worker).remove();

  }

  var typeId = citation.e.originalEvent.dataTransfer.types.length -1;
  var type = citation.e.originalEvent.dataTransfer.types[typeId];
  var citation = JSON.parse(citation.e.originalEvent.dataTransfer.getData(type));
  var cleanId = citation.miscId.replace(/[^a-z0-9]/gi,'');
  var title = citation.title;

  padeditor.ace.callWithAce(function (ace){

    // TODO: Currently we can't get the X of a given drop range so we will just prepend it to any given line
    // var rep = ace.ace_getRep();
    // REP is wrong because it gets the position BEFORE the drag event :(
    // This is thoroughly documented here..
    // http://stackoverflow.com/questions/14678451/precise-drag-and-drop-within-a-contenteditable
    // var sel = window.getSelection(); // Also doesn't work
    // console.log(sel);
    var citationNumber = countProperties(clientVars.ep_citation.citations) +1;
    if(!citation.quote){
      ace.ace_replaceRange([lN,selStart], [lN,selStart], "["+citationNumber+"]");
      ace.ace_performDocumentApplyAttributesToRange([lN,selStart], [lN,selStart+3], [["citation", cleanId + "$$" + title]]);
    }

    if(citation.quote){
      // console.log("replacing range with quote", lN, selStart);
      ace.ace_replaceRange([lN,selStart], [lN,selStart], citation.quote + "["+citationNumber+"]");
      var quoteLength = citation.quote.length;
      ace.ace_performSelectionChange([lN,selStart + quoteLength],[lN, selStart + quoteLength + 3], false);
      ace.ace_performDocumentApplyAttributesToRange([lN, selStart + quoteLength], [lN, selStart + quoteLength + 3], [["citation", cleanId + "$$" + title]]);
    }
    ace.ace_focus();
  }, "citation");
}

// Bind the event handler to the toolbar buttons
exports.postAceInit = function(hook, context){
  // $.getScript( "/static/plugins/ep_citation/static/js/blast.min.js", function( data, textStatus, jqxhr ) {});
  // padEditor = context.ace;
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
    clientVars.ep_citation.citations = {};
  }
  if(citation.key == 'citation'){
    // We store the citations as a lookup with the id as a key
    var id = citation.value.split("$$")[0];
    var title = citation.value.split("$$")[1];
    clientVars.ep_citation.citations[id] = citation;
    clientVars.ep_citation.citations[id].title = title;
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
  clientVars.ep_citation = {}
  clientVars.ep_citation.citations = {};
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
    var title = clientVars.ep_citation.citations[value].title;

    return cb([{
      cls: clss.join(" "),
      extraOpenTags: "<span class='citation'><sup><a title='" + title + "' href='" + unescape(value) + "'>",
      extraCloseTags: '</a></sup></span>'
    }]);
  }
  return cb();
};

// Here we convert the class citation:x into a tag
exports.aceDomLineProcessLineAttributes = function(name, citation){
};

// Show the active Context
exports.aceEditEvent = function(hook, call, cb){
}

function countProperties(obj) {
  return Object.keys(obj).length;
}
