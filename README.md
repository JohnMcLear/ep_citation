# Very alpha/beta.  Do not use yet.

# Drag and Drop Citations into Etherpad.

Citations can be provided as ``evidence``, ``quotes`` etc (todo)

## How this works

### The problem..

When dropping into contentEditable from another Window or parent weird behavior happens.  Instead of the rep being updated with the actual caret location a fake caret is drawn on the screen.  This means that Etherpad can't get the correct caret location of the drop event.  

### How do we solve this problem?

* When the drop event happens we are given an X & Y co-ordinate on the page and the target element(E) (sort of) that the caret is shown to be at.
* I take X, Y and E and find the line inside of Etherpad
* I recreate the entire line in a worker element
* Within that worker element I wrap each character from the line in a span
* I get the X and Y co-ord of each span in this worker
* I then compare the X & Y co-ord Vs what the drop event provided, from this information I'm able to figure out which character the drop event is targeting and then do an Etherpad edit event using selStart // selEnd positions IE [0,1][0,1] <-- line 0, char 1.

### Quirks I had to work around
* Caret snaps half way through the X position of a character
* HTML content had to be "split" without losing formatting
* Dropping at end of line shows caret at end of the line but actually there is no target(E) at all!
* Dropping at the end of hte document shows caret at the end of the document but actually there is no target(E) all!
