// Stop things from being dragged around
window.ondragstart=function(event) { event.preventDefault(); };

// Init
function init()
{
  write("Connecting...");
  var dialler=new dtmf_dial;
  dialler.randomdial(10);
}

// Run the init() once page has loaded
window.onload=function() { init(); };
