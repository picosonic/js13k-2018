// Player/enemy state
function st(elem)
{
  this.e=(elem||null); // DOM element

  this.x=0; // x position
  this.y=0; // y position
  this.vs=0; // vertical speed
  this.hs=0; // horizontal speed
  this.j=false; // jumping
  this.f=false; // falling
  this.d=false; // ducking
  this.dir=0; // direction (-1=left, 0=none, 1=right)
  this.hsp=10; // horizontal speed
  this.vsp=20; // vertical speed

  this.lf=100; // remaining "life force"
}

// Game state
var gs={
  // animation frame of reference
  step:(1/60),
  acc:0,
  lasttime:0,

  // control state
  keystate:0,
  gamepads:{},
  gamepadbuttons:[],
  gamepadassignbutton:-1,
  gamepadlastbutton:-1,

  // physics
  gravity:1,
  terminalvelocity:50,
  friction:1.5,
  speed:10,
  jumpspeed:20,

  // entities
  player:new st(),
  enemies:[],

  // level related
  tiles:[]
};

function getgamepadbyid(padid)
{
  if ((navigator.getGamepads||navigator.webkitGetGamepads||navigator.webkitGamepads||undefined)==undefined) return undefined;

  return (navigator.getGamepads && navigator.getGamepads()[padid]) || (navigator.webkitGetGamepads && navigator.webkitGetGamepads()[padid]);
}

function gamepadHandler(event, connecting)
{
  var gamepad=event.gamepad;
  // Note:
  // gamepad === navigator.getGamepads()[gamepad.index]

  if (connecting)
  {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
      gamepad.index, gamepad.id,
      gamepad.buttons.length, gamepad.axes.length);

    gs.gamepads[gamepad.index]=gamepad.id;
    if (gamepad.mapping==="standard")
    {
      gs.gamepadbuttons[0]=14; // left (left) d-left
      gs.gamepadbuttons[1]=15; // right (left) d-right
      gs.gamepadbuttons[2]=12; // top (left) d-up
      gs.gamepadbuttons[3]=13; // bottom (left) d-down
      gs.gamepadbuttons[4]=0;  // bottom button (right) x
    }
    else
      gs.gamepadassignbutton=0; // require manual mapping
  }
  else
  {
    console.log("Gamepad disconnected from index %d: %s",
      gamepad.index, gamepad.id);

    delete gs.gamepads[gamepad.index];
  }
}

function gamepadscan()
{
  if ((navigator.getGamepads||navigator.webkitGetGamepads||navigator.webkitGamepads||undefined)==undefined) return;

  var gamepads=(navigator.getGamepads && navigator.getGamepads()) || (navigator.webkitGetGamepads && navigator.webkitGetGamepads());

  for (var padid=0; padid<gamepads.length; padid++)
  {
    if (gamepads[padid]!=undefined)
    {
      var ev={gamepad:getgamepadbyid(padid)};
      gamepadHandler(ev, true);
    }
  }
}

function pollGamepads()
{
  var i=0;
  var j;

  for (j in gs.gamepads)
  {
    var gamepad=getgamepadbyid(j);
    if (gamepad==undefined) continue;

    for (i=0; i<gamepad.buttons.length; i++)
    {
      var val=gamepad.buttons[i];
      var pressed=val==1.0;

      if (typeof(val)=="object")
      {
        pressed=val.pressed;
        val=val.value;
      }

      // Check for assignment mode
      if (gs.gamepadassignbutton>-1)
      {
        // Is this button pressed
        if (pressed)
        {
          // Is it different to the last button assigned
          if (gs.gamepadlastbutton!=i)
          {
            // Remember this button was pressed last
            gs.gamepadlastbutton=i;
            gs.gamepadbuttons[gs.gamepadassignbutton]=i;
            console.log("Button["+gs.gamepadassignbutton+"]="+i);

            // Move on to next button
            gs.gamepadassignbutton++;

            // Check for end of assignments
            if (gs.gamepadassignbutton>4)
            {
              console.log("Gamepad mapping complete");
              gs.gamepadassignbutton=-1;
            }
          }
        }
      }
      else
      {
        if (i==gs.gamepadbuttons[4]) // jump
        {
          if (pressed)
            gs.keystate|=2;
          else
            gs.keystate&=~2;
        }

        if (i==gs.gamepadbuttons[0]) // left
        {
          if (pressed)
            gs.keystate|=1;
          else
            gs.keystate&=~1;
        }

        if (i==gs.gamepadbuttons[1]) // right
        {
          if (pressed)
            gs.keystate|=4;
          else
            gs.keystate&=~4;
        }

      }
    }
  }
}

// Redraw the game world
function redraw()
{
  player.style.left=gs.player.x+"px";
  player.style.top=gs.player.y+"px";
}

function collisioncheck()
{
  gs.player.x+=gs.player.hs;

  if (gs.player.y+gs.player.vs>=500)
  {
    while (!(gs.player.y+(gs.player.vs>0?1:-1)>=500))
      gs.player.y+=(gs.player.vs>0?1:-1);

    gs.player.vs=0;
  }
  gs.player.y+=gs.player.vs;
}

function offmapcheck()
{
  if ((gs.player.x<0) || (gs.player.y>500))
  {
    gs.player.x=0;
    gs.player.y=0;
  }
}

function groundcheck()
{
  if (gs.player.y+1>=500)
  {
    gs.player.vs=0;
    gs.player.j=false;
    gs.player.f=false;

    // Check for jump pressed
    if (((gs.keystate&2)!=0) && (!gs.player.d))
    {
      gs.player.j=true;
      gs.player.vs=-gs.jumpspeed;
    }
  }
  else
  {
    if (gs.player.vs<gs.terminalvelocity)
      gs.player.vs+=gs.gravity;

    if (gs.player.vs>0)
      gs.player.f=true;
  }
}

function jumpcheck()
{
  // When jumping ..
  if (gs.player.j)
  {
    // Check if loosing altitude
    if (gs.player.vs>=0)
    {
      gs.player.j=false;
      gs.player.f=true;
    }
  }
}

function standcheck()
{
  // Check for ducking
  if ((gs.keystate&8)!=0)
  {
    gs.player.d=true;
  }
  else
  {
    if (gs.player.d)
      gs.player.d=false;
  }

  // When no horizontal movement pressed, slow down by friction
  if ((((gs.keystate&1)==0) && ((gs.keystate&4)==0)) ||
      (((gs.keystate&1)!=0) && ((gs.keystate&4)!=0)))
  {
    if (gs.player.dir==-1)
    {
      if (gs.player.hs<0)
        gs.player.hs+=gs.friction;
      else
        gs.player.hs=0;
    }

    if (gs.player.dir==1)
    {
      if (gs.player.hs>0)
        gs.player.hs-=gs.friction;
      else
        gs.player.hs=0;
    }
  }
}

// Update the position of players/enemies
function update()
{
  // Check for gamepad input
  pollGamepads();

  // Check if player has left the map
  offmapcheck();

  // Check if player on the ground or falling
  groundcheck();

  // Process jumping
  jumpcheck();

  // Move player by appropriate amount, up to a collision
  collisioncheck();

  // If no input detected, slow the player using friction
  standcheck();

  // Move player when a key is pressed
  if (gs.keystate!=0)
  {
    // Left key
    if (((gs.keystate&1)!=0) && ((gs.keystate&4)==0))
    {
      gs.player.hs=-gs.speed;
      gs.player.dir=-1;
    }

    // Right key
    if (((gs.keystate&4)!=0) && ((gs.keystate&1)==0))
    {
      gs.player.hs=gs.speed;
      gs.player.dir=1;
    }
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
        gs.keystate|=1;
      else
        gs.keystate&=~1;
      e.preventDefault();
      break;

    case 38: // up
    case 87: // W
    case 90: // Z
      if (dir==1)
        gs.keystate|=2;
      else
        gs.keystate&=~2;
      e.preventDefault();
      break;

    case 39: // right
    case 68: // D
      if (dir==1)
        gs.keystate|=4;
      else
        gs.keystate&=~4;
      e.preventDefault();
      break;

    case 40: // down
    case 83: // S
      if (dir==1)
        gs.keystate|=8;
      else
        gs.keystate&=~8;
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

  // Gamepad support
  gamepadscan();

  window.addEventListener("gamepadconnected", function(e)
  {
    gamepadHandler(e, true);
  });

  window.addEventListener("gamepaddisconnected", function(e)
  {
    gamepadHandler(e, false);
  });

  /////////////////////////////////////////////////////
  // Intro
//  write("Connecting...");
//  var dialler=new dtmf_dial;
//  dialler.randomdial(10);

  /////////////////////////////////////////////////////
  // Main menu
  // TODO

  /////////////////////////////////////////////////////
  // Start game
  // TODO
  gs.player.e=document.getElementById("player");
  window.requestAnimationFrame(rafcallback);
}

// Run the init() once page has loaded
window.onload=function() { init(); };
