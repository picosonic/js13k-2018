// Player/enemy state
function st(elem)
{
  this.e=(elem||null); // DOM element

  this.keystate=0; // bitfield [action][down][right][up][left]

  this.x=0; // x position
  this.y=0; // y position
  this.px=0; // previous x position
  this.py=0; // previous y position
  this.sx=0; // start x position
  this.sy=0; // start y position
  this.w=0; // width
  this.h=0; // height
  this.vs=0; // current vertical speed
  this.hs=0; // current horizontal speed
  this.j=false; // jumping
  this.f=false; // falling
  this.d=false; // ducking
  this.dir=0; // direction (-1=left, 0=none, 1=right)
  this.hsp=10; // max horizontal speed
  this.vsp=20; // max vertical speed
  this.speed=10; // walking speed
  this.jumpspeed=20; // jumping speed

  this.lf=100; // remaining "life force"
}

// Game state
var gs={
  // animation frame of reference
  step:(1/60), // target step time @ 60 fps
  acc:0, // accumulated time since last frame
  lasttime:0, // time of last frame

  // control state
  gamepads:{},
  gamepadbuttons:[],
  gamepadassignbutton:-1,
  gamepadlastbutton:-1,

  // physics in pixels per frame @ 60fps
  gravity:1,
  terminalvelocity:50,
  friction:1.5,

  // entities
  player:new st(),
  enemies:[],

  // level related
  level:0,
  tiles:[],
  tilewidth:64,
  tileheight:64,
  things:[] // collectables
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
            gs.player.keystate|=1;
          else
            gs.player.keystate&=~1;
        }

        if (i==gs.gamepadbuttons[1]) // right
        {
          if (pressed)
            gs.player.keystate|=4;
          else
            gs.player.keystate&=~4;
        }

        if (i==gs.gamepadbuttons[2]) // up
        {
          if (pressed)
            gs.player.keystate|=2;
          else
            gs.player.keystate&=~2;
        }

        if (i==gs.gamepadbuttons[3]) // down
        {
          if (pressed)
            gs.player.keystate|=8;
          else
            gs.player.keystate&=~8;
        }

        if (i==gs.gamepadbuttons[4]) // jump
        {
          if (pressed)
            gs.player.keystate|=16;
          else
            gs.player.keystate&=~16;
        }

      }
    }
  }
}

// Redraw the game world
function redraw()
{
  // Move the player
  gs.player.e.style.left=gs.player.x+"px";
  gs.player.e.style.top=gs.player.y+"px";

  // Move all the enemies
  for (var i=0; i<gs.enemies.length; i++)
  {
    gs.enemies[i].e.style.left=gs.enemies[i].x+"px";
    gs.enemies[i].e.style.top=gs.enemies[i].y+"px";
  }

  // Scroll the screen to keep the player in view
  if ((gs.player.x!=gs.player.px) || (gs.player.y!=gs.player.py))
  {
    try
    {
      window.scrollTo({left:gs.player.x-(document.documentElement.clientWidth/2), top:gs.player.y-(document.documentElement.clientHeight/2), behaviour:"smooth"});
    }
    catch (e)
    {
      window.scrollTo(gs.player.x-(document.documentElement.clientWidth/2), gs.player.y-(document.documentElement.clientHeight/2));
    }
  }

  // Update previous positions
  gs.player.px=gs.player.x;
  gs.player.py=gs.player.y;
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
  //  1/2 the width and 1/2 the height to allow for overlaps
  var pos={
    offsetLeft:x+(character.w/4),
    offsetTop:y+(character.h/2),
    clientWidth:(character.w/2),
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

  // Climb stairs
  if ((character==gs.player) // it's the player
    && (character.keystate!=0) // key still pressed
    && (character.dir!=0) // was moving
    && (character.hs==0) // horizontal collision occured
    && (!collide(character, character.x, character.y-character.h)) // nothing above us
    && (!collide(character, character.x+(character.w*character.dir), character.y-character.h))) // nothing above and to right
  {
    character.j=true;
    character.vs=-(character.jumpspeed/4);
  }

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
  if ((character.x<0) || (character.y>levels[gs.level].height*levels[gs.level].tileheight))
  {
    character.x=character.sx;
    character.y=character.sy;
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

    // Check for jump pressed, when not ducking
    if (((character.keystate&16)!=0) && (!character.d))
    {
      character.j=true;
      character.vs=-character.jumpspeed;
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
  if ((character.keystate&8)!=0)
    character.d=true;
  else
    character.d=false;

  // When no horizontal movement pressed, slow down by friction
  if ((((character.keystate&1)==0) && ((character.keystate&4)==0)) ||
      (((character.keystate&1)!=0) && ((character.keystate&4)!=0)))
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

function updateenemyai(character)
{
  // Check we are on the ground
  if (collide(character, character.x, character.y+1))
  {
    var tmpstate=0;

    // If we're not moving left/right, then start moving
    if (character.dir==0)
    {
      // If nothing to our right, then move right so long as there is no drop
      if ((!collide(character, character.x+1, character.y))
        && ((collide(character, character.x+(character.w/2), character.y+character.h))))
        tmpstate|=4;

      // try left
      if ((tmpstate==0)
        && (!collide(character, character.x-1, character.y))
        && (collide(character, character.x-(character.w/2), character.y+character.h)))
        tmpstate|=1;

      character.keystate|=tmpstate;
    }
    else // if moving right
    if (character.dir==1)
    {
      if ((collide(character, character.x+1, character.y))
        || (!collide(character, character.x+(character.w/2), character.y+character.h)))
        character.keystate=0;
    }
    else // if moving left
    if (character.dir==-1)
    {
      if ((collide(character, character.x-1, character.y))
      || (!collide(character, character.x-(character.w/2), character.y+character.h)))
        character.keystate=0;
    }
  }
}

// Update the animation state of players/enemies
function updateanimation(character)
{
  switch (character.dir)
  {
    case -1:
      character.e.classList.add("left");
      character.e.classList.remove("right");
      break;

    case 0:
      character.e.classList.remove("left");
      character.e.classList.remove("right");
      break;

    case 1:
      character.e.classList.remove("left");
      character.e.classList.add("right");
      break;

    default:
      break;
  }

  if (character.j)
    character.e.classList.add("jump");
  else
    character.e.classList.remove("jump");

  if (character.f)
    character.e.classList.add("fall");
  else
    character.e.classList.remove("fall");

  if (character.d)
    character.e.classList.add("duck");
  else
    character.e.classList.remove("duck");

  if ((character.dir==0) && (character.hs==0) && (character.vs==0))
    character.e.classList.add("idle");
  else
    character.e.classList.remove("idle");

  if ((character.dir!=0) && (!character.j) && (!character.f))
    character.e.classList.add("walk");
  else
    character.e.classList.remove("walk");
}

// Update the position of players/enemies
function updatemovements(character)
{
  // Check if player has left the map
  offmapcheck(character);

  // Check if player on the ground or falling
  groundcheck(character);

  // Process jumping
  jumpcheck(character);

  // Move player by appropriate amount, up to a collision
  collisioncheck(character);

  // If no input detected, slow the player using friction
  standcheck(character);

  // Move player when a key is pressed
  if (character.keystate!=0)
  {
    // Left key
    if (((character.keystate&1)!=0) && ((character.keystate&4)==0))
    {
      character.hs=-character.speed;
      character.dir=-1;
    }

    // Right key
    if (((character.keystate&4)!=0) && ((character.keystate&1)==0))
    {
      character.hs=character.speed;
      character.dir=1;
    }
  }

  updateanimation(character);
}

function checkplayercollectable(character)
{
  // Make a collision box for the character in the centre/bottom of their sprite
  //  1/2 the width and 1/2 the height to allow for overlaps
  var ppos={
    offsetLeft:character.x+(character.w/4),
    offsetTop:character.y+(character.h/2),
    clientWidth:(character.w/2),
    clientHeight:(character.h/2)
  };

  // look through all enemies for a collision
  for (var i=0; i<gs.things.length; i++)
  {
    var tpos={
      offsetLeft:gs.things[i].x,
      offsetTop:gs.things[i].y,
      clientWidth:gs.things[i].w,
      clientHeight:gs.things[i].h
    };

    // does this thing overlap with character?
    if (overlap(tpos, ppos))
    {
      // Remove thing that was collected
      gs.things[i].e.remove();
      gs.things.splice(i, 1);

      return;
    }
  }
}

function checkplayerenemy(character)
{
  // Make a collision box for the character in the centre/bottom of their sprite
  //  1/2 the width and 1/2 the height to allow for overlaps
  var ppos={
    offsetLeft:character.x+(character.w/4),
    offsetTop:character.y+(character.h/2),
    clientWidth:(character.w/2),
    clientHeight:(character.h/2)
  };

  // look through all enemies for a collision
  for (var i=0; i<gs.enemies.length; i++)
  {
    var epos={
      offsetLeft:gs.enemies[i].x,
      offsetTop:gs.enemies[i].y,
      clientWidth:gs.enemies[i].w,
      clientHeight:gs.enemies[i].h
    };

    // does this enemy overlap with character?
    if (overlap(epos, ppos))
    {
      // Remove enemy if hit from above whilst player falling
      if (((ppos.offsetTop+(ppos.clientHeight/3))<epos.offsetTop) && (character.f))
      {
        gs.enemies[i].e.remove();
        gs.enemies.splice(i, 1);

        character.j=true;
        character.f=false;
        character.vs=-(character.jumpspeed/2);
      }
      else
      {
        // Loose health
        // TODO
      }

      return;
    }
  }
}

function update()
{
  // Check for gamepad input
  pollGamepads();

  // Apply keystate/physics to player
  updatemovements(gs.player);

  // Apply keystate/physics to enemies
  for (var i=0; i<gs.enemies.length; i++)
  {
    updateenemyai(gs.enemies[i]);
    updatemovements(gs.enemies[i]);
  }

  // Check for player/enemy collision
  checkplayerenemy(gs.player);

  // Check for player/collectable collision
  checkplayercollectable(gs.player);
}

// Request animation frame callback
function rafcallback(timestamp)
{
  if (gs.lasttime>0)
  {
    // Determine accumulated time since last call
    gs.acc+=((timestamp-gs.lasttime) / 1000);

    // If it's more than 15 seconds since last call, reset
    if ((gs.acc>gs.step) && ((gs.acc/gs.step)>(60*15)))
      gs.acc=gs.step*2;

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
    case 37: // cursor left
    case 65: // A
    case 90: // Z
      if (dir==1)
        gs.player.keystate|=1;
      else
        gs.player.keystate&=~1;
      e.preventDefault();
      break;

    case 38: // cursor up
    case 87: // W
    case 59: // semicolon
      if (dir==1)
        gs.player.keystate|=2;
      else
        gs.player.keystate&=~2;
      e.preventDefault();
      break;

    case 39: // cursor right
    case 68: // D
    case 88: // X
      if (dir==1)
        gs.player.keystate|=4;
      else
        gs.player.keystate&=~4;
      e.preventDefault();
      break;

    case 40: // cursor down
    case 83: // S
    case 190: // dot
      if (dir==1)
        gs.player.keystate|=8;
      else
        gs.player.keystate&=~8;
      e.preventDefault();
      break;

    case 13: // enter
    case 32: // space
      if (dir==1)
        gs.player.keystate|=16;
      else
        gs.player.keystate&=~16;
      e.preventDefault();
      break;

    default:
      break;
  }
}

function addtile(x, y, tileid, content)
{
  var tile=document.createElement("div");
  var tileobj={};

  tile.innerHTML=content;
  tile.style.position="absolute";
  tile.style.left=x+"px";
  tile.style.top=y+"px";
  tile.style.width=gs.tilewidth+"px";
  tile.style.height=gs.tileheight+"px";
  tile.classList.add("tile");
  tile.classList.add("tile_"+tileid);

  tileobj.element=tile;
  tileobj.offsetLeft=x;
  tileobj.offsetTop=y;
  tileobj.clientWidth=gs.tilewidth;
  tileobj.clientHeight=gs.tileheight;

  gs.tiles.push(tileobj);

  document.getElementById("playfield").appendChild(tile);
}

function addtiles(level)
{
  var x, y, tile, content;

  for (y=0; y<level.height; y++)
  {
    for (x=0; x<level.width; x++)
    {
      tile=level.layers[0].data[(y*level.width)+x]||0;

      switch (tile)
      {
        case 6: // Green Lock
        case 7: // Red Lock
         content="<div class=\"boltnw\"></div><div class=\"boltne\"></div><div class=\"boltsw\"></div><div class=\"boltse\"></div><div class=\"keyhole\"></div><div class=\"keyhole2\"></div>";
         break;

        default:
          content="";
          break;
      }

      if (tile!=0)
        addtile(x*level.tilewidth, y*level.tileheight, tile, content);
    }
  }
}

function addenemy(x, y, w, h, enemyclass)
{
  var enemy=document.createElement("div");
  var enemyobj=new st(enemy);

  enemy.innerHTML="<div class=\"body\"><div class=\"eye\"><div class=\"iris\"></div></div></div><div class=\"eyelid\"></div><div class=\"leg rightleg\"></div><div class=\"leg leftleg\"></div>";
  enemy.style.position="absolute";
  enemy.style.left=x+"px";
  enemy.style.top=y+"px";
  enemy.style.width=w+"px";
  enemy.style.height=h+"px";
  enemy.classList.add(enemyclass);

  enemyobj.sx=enemyobj.x=x;
  enemyobj.sy=enemyobj.y=y;
  enemyobj.w=w;
  enemyobj.h=h;
  enemyobj.speed=5;

  gs.enemies.push(enemyobj);

  document.getElementById("playfield").appendChild(enemy);
}

function addcharacters(level)
{
  var obj, index;

  for (index=0; index<level.layers[1].objects.length; index++)
  {
    obj=level.layers[1].objects[index];

    switch (obj.gid)
    {
      case 11: // Player
        gs.player.sx=gs.player.x=obj.x;
        gs.player.sy=gs.player.y=obj.y-level.tileheight;
        break;

      case 12: // Enemy
        addenemy(obj.x, obj.y-level.tileheight, level.tilewidth, level.tileheight, "enemy");
        break;

      default:
        break;
    }
  }
}

function addcollectable(x, y, id)
{
  var thing=document.createElement("div");
  var thingobj={};

  thing.innerHTML="";
  thing.style.position="absolute";
  thing.style.left=x+"px";
  thing.style.top=y+"px";
  thing.classList.add("thing_"+id);

  switch (id)
  {
    case 22:
    case 23:
      var svg=atob("PHN2ZyB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDY0IDY0Ij4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwtOTg4LjM2MjE4KSI+CjxwYXRoIGQ9Im0gNDMuMzk4MDI2LDEwMDguNDcyNSBjIC0yLjAzNjI1LC0yLjA2NSAtNC41MDI1LC0zLjEgLTcuNDAyNSwtMy4xIC0yLjksMCAtNS4zNjYyNSwxLjAzNSAtNy40MDI1LDMuMSAtMS4xMzI1LDEuMTY3NSAtMS45NDc1LDIuNDUxMyAtMi40NDYyNSwzLjg0ODggLTAuNCwxLjEzMjUgLTAuNiwyLjM1MjUgLTAuNiwzLjY1MTIgMCwxLjMgMC4yLDIuNTM1IDAuNiwzLjcwMTMgMC4wOTc1LDAuMjYzNyAwLjIxNSwwLjU0NzUgMC4zNDYyNSwwLjg1IGwgLTguMjk1LDguMzk4NyBjIC0xLjEwMzc1LDEuNjM1IC0wLjg4Mzc1LDMuMzM1IDAuNjQ4NzUsNS4xMDI1IDAuOTk2MjUsMS4wOTg4IDIuODY2MjUsMS41MTM4IDUuNjAxMjUsMS4yNSBsIDEuODk4NzUsMCAwLC00LjQwNSA0LjI0ODc1LDAgLTAuNDAxMjUsLTQuMzQ1IDYuMDAxMjUsMC4wNDkgYyAyLjc5NzUsLTAuMDY5IDUuMiwtMS4xMDM3IDcuMjAyNSwtMy4xMDEyIDIuMDY1LC0yLjA5ODggMy4wOTUsLTQuNTk4OCAzLjA5NSwtNy41IDAsLTIuOTMzOCAtMS4wMywtNS40MzM4IC0zLjA5NSwtNy41IG0gLTExLjYwMTI1LDcuNSBjIDAsLTEuMTY2MyAwLjQxNSwtMi4xNjc1IDEuMjUsLTMuMDAyNSAwLjgsLTAuODMgMS43ODEyNSwtMS4yNSAyLjk0ODc1LC0xLjI1IDEuMTY3NSwwIDIuMTQ4NzUsMC40MiAyLjk0ODc1LDEuMjUgMC44MzUsMC44MzUgMS4yNSwxLjgzNjIgMS4yNSwzLjAwMjUgMCwxLjE2NzUgLTAuNDE1LDIuMTY4NyAtMS4yNSwyLjk5ODcgLTAuOCwwLjgwMTMgLTEuNzgxMjUsMS4yMDEzIC0yLjk0ODc1LDEuMjAxMyAtMS4xNjc1LDAgLTIuMTQ4NzUsLTAuNCAtMi45NDg3NSwtMS4yMDEzIC0wLjgzNSwtMC44MyAtMS4yNSwtMS44MzEyIC0xLjI1LC0yLjk5ODciIHN0eWxlPSJmaWxsOiNkZDRlNTQ7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOm5vbnplcm87c3Ryb2tlOm5vbmUiIC8+CjwvZz4KPC9zdmc+Cg==");
      if (id==22) // make green key green
        svg=svg.replace("#dd4e54", "#49b47e");

      thing.innerHTML=svg;
      break;

    default:
      break;
  }

  thingobj.e=thing;
  thingobj.id=id;
  thingobj.x=x;
  thingobj.y=y;
  thingobj.w=64;
  thingobj.h=64;

  gs.things.push(thingobj);

  document.getElementById("playfield").appendChild(thing);
}

function addcollectables(level)
{
  var obj, index;

  for (index=0; index<level.layers[2].objects.length; index++)
  {
    obj=level.layers[2].objects[index];

    addcollectable(obj.x, obj.y-level.tileheight, obj.gid);
  }
}

function addstar(x, y)
{
  var star=document.createElement("div");

  star.style.left=x+"px";
  star.style.top=y+"px";
  star.classList.add("star");

  document.getElementById("background").appendChild(star);
}

function loadlevel(level)
{
  // Set which level we are on
  gs.level=level;

  // Clear any existing tiles
  // TODO

  // Add the tiles for the level
  addtiles(levels[level]);

  // Clear any existing collectables
  // TODO

  // Add the collectables
  addcollectables(levels[level]);

  // Clear any existing characters
  // TODO

  // Add the characters
  addcharacters(levels[level]);
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
  gs.player.w=levels[gs.level].tilewidth;
  gs.player.h=levels[gs.level].tileheight;
  gs.player.e.innerHTML="<div class=\"body\"><div class=\"eye\"><div class=\"iris\"></div></div><div class=\"eyelid\"></div></div><div class=\"leg rightleg\"></div><div class=\"leg leftleg\"></div>";

  // Add some stars to the background
  var randoms=new randomizer();
  for (var i=0; i<300; i++)
    addstar(randoms.rnd(1920), randoms.rnd(1080));

  // Load everything for "current" level
  loadlevel(0);

  // Start the game running
  window.requestAnimationFrame(rafcallback);
}

// Run the init() once page has loaded
window.onload=function() { init(); };
