// Player/enemy state
function st(elem)
{
  this.e=(elem||null); // DOM element

  this.x=0; // x position
  this.y=0; // y position
  this.w=0; // width
  this.h=0; // height
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
  keystate:0, // bitfield [down][right][up][left]
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
  level:0,
  tiles:[],
  tilewidth:66,
  tileheight:66
};

// Find a gamepad by its ID
function getgamepadbyid(padid)
{
  if ((navigator.getGamepads||navigator.webkitGetGamepads||navigator.webkitGamepads||undefined)==undefined) return undefined;

  return (navigator.getGamepads && navigator.getGamepads()[padid]) || (navigator.webkitGetGamepads && navigator.webkitGetGamepads()[padid]);
}

// Handle connection/disconnection of a gamepad
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

// Scan for any gamepads already connected
function gamepadscan()
{
  if ((navigator.getGamepads||navigator.webkitGetGamepads||navigator.webkitGamepads||undefined)==undefined) return;

  var gamepads=(navigator.getGamepads && navigator.getGamepads()) || (navigator.webkitGetGamepads && navigator.webkitGetGamepads());

  for (var padid=0; padid<gamepads.length; padid++)
  {
    if (gamepads[padid]!=undefined)
    {
      // Simulate this gamepad being connected
      var ev={gamepad:getgamepadbyid(padid)};
      gamepadHandler(ev, true);
    }
  }
}

// Poll all gamepads to update keystate, also allow mapping
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

        if (i==gs.gamepadbuttons[2]) // up
        {
          if (pressed)
            gs.keystate|=2;
          else
            gs.keystate&=~2;
        }

        if (i==gs.gamepadbuttons[3]) // down
        {
          if (pressed)
            gs.keystate|=8;
          else
            gs.keystate&=~8;
        }

        if (i==gs.gamepadbuttons[4]) // jump
        {
          if (pressed)
            gs.keystate|=2;
          else
            gs.keystate&=~2;
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

// Does DOM element a overlap with element b
function overlap(a, b)
{
  // Check horiz
  if (a.offsetLeft<b.offsetLeft)
    if ((a.offsetLeft+a.clientWidth)<b.offsetLeft) return false;

  if (a.offsetLeft>b.offsetLeft)
    if ((b.offsetLeft+b.clientWidth)<a.offsetLeft) return false;

  // Check vert
  if (a.offsetTop<b.offsetTop)
    if ((a.offsetTop+a.clientHeight)<b.offsetTop) return false;

  if (a.offsetTop>b.offsetTop)
    if ((b.offsetTop+b.clientHeight)<a.offsetTop) return false;

  return true;
}

// Check if character collides with a tile
function collide(character, x, y)
{
  // Make a collision box for the character in the centre/bottom of their sprite
  //  1/3rd the width and 1/2 the height to allow for overlaps
  var pos={
    offsetLeft:x+(character.w/3),
    offsetTop:y+(character.h/2),
    clientWidth:(character.w/3),
    clientHeight:(character.h/2)
  };

  // look through all tiles for a collision
  for (var index=0; index<gs.tiles.length; index++)
  {
    // does this tile overlap with character?
    if (overlap(gs.tiles[index], pos))
      return true;
  }

  return false;
}

// Move character by up to horizontal/vertical speeds, stopping when a collision occurs
function collisioncheck(character)
{
  // check for horizontal collisions
  if (collide(character, character.x+character.hs, character.y))
  {
    // A collision occured, so move the character until it hits
    while (!collide(character, character.x+(character.hs>0?1:-1), character.y))
      character.x+=(character.hs>0?1:-1);

    // Stop horizontal movement
    character.hs=0;
  }
  character.x+=character.hs;

  // check for vertical collisions
  if (collide(character, character.x, character.y+character.vs))
  {
    // A collision occured, so move the character until it hits
    while (!collide(character, character.x, character.y+(character.vs>0?1:-1)))
      character.y+=(character.vs>0?1:-1);

    // Stop vertical movement
    character.vs=0;
  }
  character.y+=character.vs;
}

// If the player has moved "off" the map, then put them back at a start position
function offmapcheck(character)
{
  if ((character.x<0) || (character.y>768))
  {
    character.x=0;
    character.y=0;
  }
}

// Check for player being on the ground
function groundcheck(character)
{
  // Check we are on the ground
  if (collide(character, character.x, character.y+1))
  {
    character.vs=0;
    character.j=false;
    character.f=false;

    // Check for jump pressed
    if (((gs.keystate&2)!=0) && (!character.d))
    {
      character.j=true;
      character.vs=-gs.jumpspeed;
    }
  }
  else
  {
    if (character.vs<gs.terminalvelocity)
      character.vs+=gs.gravity;

    if (character.vs>0)
      character.f=true;
  }
}

// Check for mid jump when the player is now falling
function jumpcheck(character)
{
  // When jumping ..
  if (character.j)
  {
    // Check if loosing altitude
    if (character.vs>=0)
    {
      character.j=false;
      character.f=true;
    }
  }
}

// Handle ducking and slowing player down by friction
function standcheck(character)
{
  // Check for ducking
  if ((gs.keystate&8)!=0)
  {
    character.d=true;
  }
  else
  {
    if (character.d)
      character.d=false;
  }

  // When no horizontal movement pressed, slow down by friction
  if ((((gs.keystate&1)==0) && ((gs.keystate&4)==0)) ||
      (((gs.keystate&1)!=0) && ((gs.keystate&4)!=0)))
  {
    if (character.dir==-1)
    {
      if (character.hs<0)
      {
        character.hs+=gs.friction;
      }
      else
      {
        character.hs=0;
        character.dir=0;
      }
    }

    if (character.dir==1)
    {
      if (character.hs>0)
      {
        character.hs-=gs.friction;
      }
      else
      {
        character.hs=0;
        character.dir=0;
      }
    }
  }
}

// Update the position of players/enemies
function update()
{
  // Check for gamepad input
  pollGamepads();

  // Check if player has left the map
  offmapcheck(gs.player);

  // Check if player on the ground or falling
  groundcheck(gs.player);

  // Process jumping
  jumpcheck(gs.player);

  // Move player by appropriate amount, up to a collision
  collisioncheck(gs.player);

  // If no input detected, slow the player using friction
  standcheck(gs.player);

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

function addtile(x, y)
{
  var tile=document.createElement("div");
  var tileobj={};

  tile.innerHTML="";
  tile.style.position="absolute";
  tile.style.left=x+"px";
  tile.style.top=y+"px";
  tile.style.width=gs.tilewidth+"px";
  tile.style.height=gs.tileheight+"px";
  tile.classList.add("tile");

  tileobj.element=tile;
  tileobj.offsetLeft=x;
  tileobj.offsetTop=y;
  tileobj.clientWidth=gs.tilewidth;
  tileobj.clientHeight=gs.tileheight;

  gs.tiles.push(tileobj);

  document.getElementById("playfield").appendChild(tile);
}

function addenemy(x, y, enemyclass)
{
  var enemy=document.createElement("div");
  var enemyobj=new st(enemy);

  enemy.innerHTML="";
  enemy.style.position="absolute";
  enemy.style.left=x+"px";
  enemy.style.top=y+"px";
  enemy.style.width="66px";
  enemy.style.height="66px";
  enemy.classList.add(enemyclass);

  enemyobj.x=x;
  enemyobj.y=y;
  enemyobj.w=66;
  enemyobj.h=66;

  gs.enemies.push(enemyobj);

  document.getElementById("playfield").appendChild(enemy);
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
  gs.player.w=66;
  gs.player.h=66;

  for (i=0; i<10; i++)
    addtile(i*gs.tilewidth, 500);

  for (i=0; i<5; i++)
    addtile((i+15)*gs.tilewidth, 500-(gs.tileheight*i));

  for (i=0; i<5; i++)
    addtile((i+20)*gs.tilewidth, 236);

  addenemy(1330, 0, "enemy");

  window.requestAnimationFrame(rafcallback);
}

// Run the init() once page has loaded
window.onload=function() { init(); };
