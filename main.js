// Player/enemy state
function st(elem)
{
  this.e=(elem||null); // DOM element
  this.x=0; // x position
  this.y=0; // y position
  this.vs=0; // vertical speed
  this.hs=0; // horizontal speed
  this.j=0; // jumping
  this.f=0; // falling
  this.d=0; // ducking
  this.dir=0; // direction (-1=left, 0=none, 1=right)
  this.hsp=10; // horizontal speed
  this.vsp=20; // vertical (jumping) speed
}

// Game state
var gs={
  // animation frame of reference
  step:(1/60),
  acc:0,
  lasttime:0,

  // control state
  keystate:0,

  // physics
  gravity:1,
  terminalvelocity:50,
  friction:1.5,

  // entities
  player:new st(),
  enemies:[]
};

// Redraw the game world
function redraw()
{
  // TODO
}

// Update the position of players/enemies
function update()
{
  // Check for gamepad input
  // TODO

  // Move player when a key is pressed
  if (gs.keystate!=0)
  {
    // TODO
  }
}

// Request animation frame callback
function rafcallback(timestamp)
{
  if (gs.lasttime>0)
  {
    // Determine accumulated time since last call
    gs.acc+=((timestamp-gs.lasttime) / 1000);

    // Process "steps" since last call
    while (gs.acc>gs.step)
    {
      update();
      gs.acc-=gs.step;
    }

    // Redraw the game world
    redraw();
  }

  // Remember when we were last called
  gs.lasttime=timestamp;

  // Request we are called on the next frame
  window.requestAnimationFrame(rafcallback);
}

// Update the player key state
function updatekeystate(e, dir)
{
  switch (e.which)
  {
    case 37: // left
    case 65: // A
    case 81: // Q
      if (dir==1)
        keystate|=1;
      else
        keystate&=~1;
      e.preventDefault();
      break;

    case 38: // up
    case 87: // W
    case 90: // Z
      if (dir==1)
        keystate|=2;
      else
        keystate&=~2;
      e.preventDefault();
      break;

    case 39: // right
    case 68: // D
      if (dir==1)
        keystate|=4;
      else
        keystate&=~4;
      e.preventDefault();
      break;

    case 40: // down
    case 83: // S
      if (dir==1)
        keystate|=8;
      else
        keystate&=~8;
      e.preventDefault();
      break;

    default:
      break;
  }
}

// Initial entry point
function init()
{
  /////////////////////////////////////////////////////
  // Initialise stuff
  document.onkeydown=function(e)
  {
    e = e || window.event;
    updatekeystate(e, 1);
  };

  document.onkeyup=function(e)
  {
    e = e || window.event;
    updatekeystate(e, 0);
  };

  // Stop things from being dragged around
  window.ondragstart=function(event) { event.preventDefault(); };

  /////////////////////////////////////////////////////
  // Intro
  write("Connecting...");
  var dialler=new dtmf_dial;
  dialler.randomdial(10);

  /////////////////////////////////////////////////////
  // Main menu
  // TODO

  /////////////////////////////////////////////////////
  // Start game
  // TODO
}

// Run the init() once page has loaded
window.onload=function() { init(); };
