// Initial entry point
function init()
{
  /////////////////////////////////////////////////////
  // Initialise stuff
  // Stop things from being dragged around
  window.ondragstart=function(event) { event.preventDefault(); };

  /////////////////////////////////////////////////////
  // Intro
  write("Connecting...");
  var dialler=new dtmf_dial;
  dialler.randomdial(10);

  /////////////////////////////////////////////////////
  // Main menu

  /////////////////////////////////////////////////////
  // Start game
}

// Run the init() once page has loaded
window.onload=function() { init(); };
