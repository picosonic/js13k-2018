// Stop things from being dragged around
window.ondragstart=function(event) { event.preventDefault(); };

// Init
window.onload=function() {
var dialler=new dtmf_dial;
dialler.randomdial(10);
};
