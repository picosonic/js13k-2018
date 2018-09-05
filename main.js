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
  this.htime=0; // hurt following an enemy collision
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
  friction:2,

  // entities
  player:new st(),
  enemies:[],

  // level related
  level:0,
  tiles:[],
  tilerows:0,
  tilecolumns:0,
  tilewidth:64,
  tileheight:64,
  things:[], // collectables
  score:0,

  // audio related
  dialler:new dtmf_dial(),
  music:new gen_music(),

  randoms:new randomizer(),
  writer:new textwriter(),
  timeline:new timelineobj(),

  state:0 // state machine, 0=intro, 1=menu, 2=playing, 3=complete
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
//    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
//      gamepad.index, gamepad.id,
//      gamepad.buttons.length, gamepad.axes.length);

    gs.gamepads[gamepad.index]=gamepad.id;
    if (gamepad.mapping==="standard")
    {
      gs.gamepadbuttons[0]=14; // left (left) d-left
      gs.gamepadbuttons[1]=15; // right (left) d-right
      gs.gamepadbuttons[2]=12; // top (left) d-up
      gs.gamepadbuttons[3]=13; // bottom (left) d-down
      gs.gamepadbuttons[4]=0;  // bottom button (right) x
    }
//    else
//      gs.gamepadassignbutton=0; // require manual mapping
  }
  else
  {
//    console.log("Gamepad disconnected from index %d: %s",
//      gamepad.index, gamepad.id);

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

/*
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
*/
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

// Has this level been completed?
function levelcomplete()
{
  // Defined as - all enemies defeated and all things collected
  if ((gs.enemies.length==0) && (gs.things.length==0))
    return true;

  return false;
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
      // Fallback to 2 parameters for older browsers
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

/*
  // Climb stairs, TODO - revisit this if time allowing
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
*/

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
//   this "shouldn't" happen with the border surrounding the level
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
    // We're in the air, increase falling speed until we're at terminal velocity
    if (character.vs<gs.terminalvelocity)
      character.vs+=gs.gravity;

    // Set falling flag when vertical speed is positive
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
  // Check for ducking, or injured
  if (((character.keystate&8)!=0) || (character.htime>0))
    character.d=true;
  else
    character.d=false;

  // When no horizontal movement pressed, slow down by friction
  if ((((character.keystate&1)==0) && ((character.keystate&4)==0)) ||
      (((character.keystate&1)!=0) && ((character.keystate&4)!=0)))
  {
    // Going left
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

    // Going right
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

// Process all enemies and simulate keypresses for basic AI when they can move
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
//   this is so that the CSS animations or poses are actioned
function updateanimation(character)
{
  switch (character.dir)
  {
    case -1: // Left
      character.e.classList.add("left");
      character.e.classList.remove("right");
      break;

    case 0: // Not moving
      character.e.classList.remove("left");
      character.e.classList.remove("right");
      break;

    case 1: // Right
      character.e.classList.remove("left");
      character.e.classList.add("right");
      break;

    default:
      break;
  }

  // Jumping
  if (character.j)
    character.e.classList.add("jump");
  else
    character.e.classList.remove("jump");

  // Falling
  if (character.f)
    character.e.classList.add("fall");
  else
    character.e.classList.remove("fall");

  // Ducking
  if ((character.d) || (character.htime>0))
    character.e.classList.add("duck");
  else
    character.e.classList.remove("duck");

  // Not moving
  if ((character.dir==0) && (character.hs==0) && (character.vs==0))
    character.e.classList.add("idle");
  else
    character.e.classList.remove("idle");

  // Walking
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
      character.hs=character.htime==0?-character.speed:-2;
      character.dir=-1;
    }

    // Right key
    if (((character.keystate&4)!=0) && ((character.keystate&1)==0))
    {
      character.hs=character.htime==0?character.speed:2;
      character.dir=1;
    }
  }

  // Decrease hurt timer
  if (character.htime>0) character.htime--;

  // Apply CSS rules to match character state
  updateanimation(character);
}

// Remove all tiles which match given id
function removetilebyid(id)
{
  var removed;

  do
  {
    removed=0;

    for (var i=0; i<gs.tiles.length; i++)
    {
      if (gs.tiles[i].id==id)
      {
        gs.tiles[i].e.remove(); // remove from DOM
        gs.tiles.splice(i, 1); // remove from tile list
        removed++;
        break;
      }
    }
  } while (removed>0);
}

// Determine distance (Hypotenuse) between two lengths in 2d space (using Pythagoras)
function calcHypotenuse(a, b)
{
  return(Math.sqrt((a * a) + (b * b)));
}

// Remove the neareset tile matching a given id to an x,y position
function removenearesttilebyid(x, y, id)
{
  var nearest=-1;
  var neardelta=-1;

  for (var i=0; i<gs.tiles.length; i++)
  {
    if (gs.tiles[i].id==id)
    {
      var delta=calcHypotenuse(Math.abs(x-gs.tiles[i].offsetLeft), Math.abs(y-gs.tiles[i].offsetTop));
      if ((neardelta==-1) || (delta<neardelta))
      {
        nearest=i;
        neardelta=delta;
      }
    }
  }

  // If a tile was found, then remove it
  if (nearest!=-1)
  {
    gs.tiles[nearest].e.remove(); // remove from DOM
    gs.tiles.splice(nearest, 1); // remove from tile list
  }
}

// Clear set of items from DOM and array
function clearobjects(items)
{
  for (var i=0; i<items.length; i++)
    items[i].e.remove(); // remove from DOM

  items.splice(0, items.length); // clear array
}

// Check if player collides with a collectable item
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
      switch (gs.things[i].id)
      {
        case 21: // cube
          gs.score+=5;
          gs.music.play_collect(0);
          break;

        case 22: // red key
          removenearesttilebyid(gs.things[i].x, gs.things[i].y, 6);
          gs.music.play_collect(1);
          break;

        case 23: // green key
          removenearesttilebyid(gs.things[i].x, gs.things[i].y, 7);
          gs.music.play_collect(1);
          break;

        default:
          break;
      }

      // Remove thing that was collected
      gs.things[i].e.remove();
      gs.things.splice(i, 1);

      return;
    }
  }
}

// Check for collision between player and an enemy
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
      offsetLeft:gs.enemies[i].x+(gs.enemies[i].w/4),
      offsetTop:gs.enemies[i].y+(gs.enemies[i].h/2),
      clientWidth:(gs.enemies[i].w/2),
      clientHeight:(gs.enemies[i].h/2)
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
        // Loose health (if not already hurt)
        if (character.htime==0)
        {
          character.lf-=(character.d==true?5:10);
          showhealth();

          // Check for game over
          if (character.lf<=0)
          {
            gs.state=1;

            // Clear the playfield
            clearplayfield();

            // Clear player
            document.getElementById("player").innerHTML="";

            show_title();
          }

          character.htime=60;
          character.d=true;
        }
      }

      return;
    }
  }
}

// Create a <style> element for text
function buildalphablockstyle(pixelsize)
{
 return "<style>.alphablock { font-size:0px; display:inline-block; margin-bottom: "+(pixelsize/3)+"px; } .block { display:inline-block; width:"+pixelsize+"px; height:"+pixelsize+"px; border-top-left-radius:"+(pixelsize/2)+"px; border-bottom-right-radius:"+(pixelsize/2)+"px; } .filled { background-color:#00ff00; background: linear-gradient(to bottom, rgba(0,255,0,0) 0%,rgba(0,255,0,1) 33%,rgba(0,255,0,1) 66%,rgba(0,255,0,0) 100%); }</style>";
}

// Update the game state prior to rendering
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
  // First time round, just save epoch
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

    // If the update took us out of play state then stop now
    if (gs.state!=2)
      return;

    // Check for level complete
    if (levelcomplete())
    {
      var level=gs.level+1;

      // Check for all levels completed
      if (level>=levels.length)
      {
        // Show game completed screen
        gs.state=3;

        // Clear the playfield
        clearplayfield();

        // Position player on screen and large
        gs.player.e.style.left="33%";
        gs.player.e.style.top="33%";
        gs.player.e.style.width="256px";
        gs.player.e.style.height="256px";
        gs.player.e.classList.remove("left");
        gs.player.e.classList.remove("right");
        gs.player.e.classList.remove("jump");
        gs.player.e.classList.remove("fall");
        gs.player.e.classList.remove("duck");
        gs.player.e.classList.remove("walk");

        var screen=document.getElementById("ui");
        var domtext=buildalphablockstyle(12)+"<div id=\"title\" style=\"background:none;\"></div>";

        // Show which level we are on using a UI overlay
        screen.innerHTML=domtext;
        gs.writer.write("title", "YAY! WE'RE BACK ONLINE!!");

        setTimeout(function(){ document.getElementById("player").innerHTML=""; show_title(); gs.state=1; }, 20000);
      }
      else
        launchgame(level);
    }

    // Redraw the game world
    redraw();
  }

  // Remember when we were last called
  gs.lasttime=timestamp;

  // Request we are called on the next frame, but only if still playing
  if (gs.state==2)
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

      // If in menu start playing
      if (gs.state==1)
      {
        hide_screen();
        gs.state=2;
        launchgame(0);
      }
      break;

    case 27: // escape
      // If playing, go back to menu
      if (gs.state==2)
      {
        gs.state=1;

        // Clear the playfield
        clearplayfield();

        // Clear player
        document.getElementById("player").innerHTML="";

        show_title();
      }
      e.preventDefault();
      break;

    default:
      break;
  }
}

// Add a single tile as a DIV to the DOM and tiles array
function addtile(x, y, tileid, content)
{
  var tile=document.createElement("div");
  var tileobj={};

  // Set properties for DOM object
  tile.innerHTML=content;
  tile.style.position="absolute";
  tile.style.left=x+"px";
  tile.style.top=y+"px";
  tile.style.width=gs.tilewidth+"px";
  tile.style.height=gs.tileheight+"px";
  tile.classList.add("tile");
  tile.classList.add("tile_"+tileid);

  // Set properties for tiles array entry
  tileobj.e=tile;
  tileobj.id=tileid;
  tileobj.offsetLeft=x;
  tileobj.offsetTop=y;
  tileobj.clientWidth=gs.tilewidth;
  tileobj.clientHeight=gs.tileheight;

  // Add to tiles array
  gs.tiles.push(tileobj);

  document.getElementById("playfield").appendChild(tile);
}

// Add all the tiles to the playfield for a given level
function addtiles(level)
{
  var x, y, tile, content;

  // Add a border
  for (y=0; y<(level.height+2); y++)
  {
    addtile(0, y*level.tileheight, 1, "");
    addtile((level.width+1)*level.tilewidth, y*level.tileheight, 1, "");
  }
  for (x=0; x<(level.width+2); x++)
  {
    addtile(x*level.tilewidth, 0, 1, "");
    addtile(x*level.tilewidth, (level.height+1)*level.tileheight, 1, "");
  }

  // Add all the tiles from level
  for (y=0; y<level.height; y++)
  {
    for (x=0; x<level.width; x++)
    {
      tile=level.layers[0].data[(y*level.width)+x]||0;

      switch (tile)
      {
        case 2:
        case 3:
        case 4:
        case 5:
          var svg='<svg version="1.1" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><g transform="translate(122.86 -368.93)"><path d="m-85.557 387.84 10.655 5.85 10.746-5.85 5.3038 2.9012v-17.804h-64.005v17.804l5.3525 2.9488 10.649-5.85 10.65 5.85 10.649-5.85" fill="#2185d5"/><path d="m-58.852 372.93v-3.9988h-64.005v3.9988h64.005" fill="#2493ec"/><path d="m-96.206 418.09-5.2987-2.95h-0.0487v-0.0488l-5.3025-2.9-10.649 5.8988-5.3525-2.95v17.798h64.005v-17.798l-5.3038-2.9488-10.746 5.8988-10.655-5.8988-10.649 5.8988" fill="#303841"/><path d="m-96.206 399.74-5.2987-3.5012-0.0487-0.0488-5.3025-3.55-10.649 7.1-5.3525-3.55v18.95l5.3525 2.95 10.649-5.8988 5.3025 2.9v0.0488h0.0487l5.2987 2.95 10.649-5.8988 10.655 5.8988 10.746-5.8988 5.3038 2.9488v-18.95l-5.3038-3.55-10.746 7.1-10.655-7.1-10.649 7.1" fill="#3a4750"/><path d="m-74.902 393.69-10.655-5.85-10.649 5.85-10.65-5.85-10.649 5.85-5.3525-2.9488v5.4488l5.3525 3.55 10.649-7.1 5.3025 3.55 0.0487 0.0488 5.2987 3.5012 10.649-7.1 10.655 7.1 10.746-7.1 5.3038 3.55v-5.4488l-5.3038-2.9012-10.746 5.85" fill="#f3f3f3"/></g></svg>';

          // Change SVG colours per level
          switch (gs.level % 4)
          {
            case 1:
              svg=svg.replace("#2493ec", "#ff5960");
              svg=svg.replace("#2185d5", "#dd4e54");
              svg=svg.replace("#f3f3f3", "#ead94c");
              svg=svg.replace("#3a4750", "#5d433e");
              svg=svg.replace("#303841", "#4a3632");
              break;

            case 2:
              svg=svg.replace("#2493ec", "#ffe580");
              svg=svg.replace("#2185d5", "#ffd944");
              svg=svg.replace("#f3f3f3", "#94dd4d");
              svg=svg.replace("#3a4750", "#49b47e");
              svg=svg.replace("#303841", "#409f6e");
              break;

            case 3:
              svg=svg.replace("#2493ec", "#3a7080");
              svg=svg.replace("#2185d5", "#2c5460");
              svg=svg.replace("#f3f3f3", "#bbdc2f");
              svg=svg.replace("#3a4750", "#67bd39");
              svg=svg.replace("#303841", "#59a331");
              break;

            default:
              break;
          }

          content=svg;
          break;

        case 6: // Green Lock
        case 7: // Red Lock
         content="<div class=\"boltnw\"></div><div class=\"boltne\"></div><div class=\"boltsw\"></div><div class=\"boltse\"></div><div class=\"keyhole\"></div><div class=\"keyhole2\"></div>";
         break;

        default:
          content="";
          break;
      }

      // If it's not blank space, then add the tile
      if (tile!=0)
        addtile((x+1)*level.tilewidth, (y+1)*level.tileheight, tile, content);
    }
  }
}

// Add a single enemy to the DOM and enemies array
function addenemy(x, y, w, h, enemyclass)
{
  var enemy=document.createElement("div");
  var enemyobj=new st(enemy);

  // Set DOM properties
  enemy.innerHTML="<div class=\"body\"><div class=\"eye\"><div class=\"iris\"></div></div></div><div class=\"eyelid\"></div><div class=\"leg rightleg\"></div><div class=\"leg leftleg\"></div>";
  enemy.style.position="absolute";
  enemy.style.left=x+"px";
  enemy.style.top=y+"px";
  enemy.style.width=w+"px";
  enemy.style.height=h+"px";
  enemy.classList.add(enemyclass);

  // Set properties for entry in enemies array
  enemyobj.sx=enemyobj.x=x;
  enemyobj.sy=enemyobj.y=y;
  enemyobj.w=w;
  enemyobj.h=h;
  enemyobj.speed=3;

  // Add to enemies array
  gs.enemies.push(enemyobj);

  document.getElementById("playfield").appendChild(enemy);
}

// Add all enemies and player to the playfield for a given level
function addcharacters(level)
{
  var obj, index;

  for (index=0; index<level.layers[1].objects.length; index++)
  {
    obj=level.layers[1].objects[index];

    switch (obj.gid)
    {
      case 11: // Player
        gs.player.sx=gs.player.x=(obj.x+level.tilewidth);
        gs.player.sy=gs.player.y=obj.y;
        gs.player.e.style.width=level.tilewidth+"px";
        gs.player.e.style.height=level.tileheight+"px";
        gs.player.e.style.left=gs.player.x+"px";
        gs.player.e.style.top=gs.player.y+"px";
        break;

      case 12: // Enemy
        addenemy(obj.x+level.tilewidth, obj.y, level.tilewidth, level.tileheight, "enemy");
        break;

      default:
        break;
    }
  }
}

// Add a single collectable item to the DOM and things array
function addcollectable(x, y, id)
{
  var thing=document.createElement("div");
  var thingobj={};

  // Set properties for DOM object
  thing.innerHTML="";
  thing.style.position="absolute";
  thing.style.left=x+"px";
  thing.style.top=y+"px";
  thing.classList.add("thing");
  thing.classList.add("thing_"+id);

  // Change SVG colours of keys as appropriate
  switch (id)
  {
    case 22:
    case 23:
      var svg='<svg version="1.1" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><g transform="translate(0,-988.36218)"><path d="m 43.398026,1008.4725 c -4.299191,-4.8065 -13.181079,-3.8254 -16.282938,1.8485 -1.516253,2.4844 -1.944056,5.5723 -1.29188,8.397 1.290383,1.7876 -0.798234,3.5216 -2.049856,4.6041 -2.006588,1.926 -3.96479,3.9044 -5.820874,5.9765 -1.497402,2.7639 1.338949,6.4958 4.388683,5.9591 1.251301,0.2333 2.837849,0.4242 3.804495,-0.5882 0.460412,-1.3367 -0.609204,-3.656 1.623782,-3.9193 0.997013,0.03 3.156992,0.7497 2.76017,-1.0893 -0.197924,-1.0278 -0.2113,-2.0929 -0.335332,-3.1356 3.56812,-0.1092 7.410045,0.6341 10.697171,-1.1559 5.414104,-2.7136 7.449556,-10.5664 3.742596,-15.4433 -0.364901,-0.5219 -0.778663,-1.0097 -1.236017,-1.4529 m -11.60125,7.5 c -0.273281,-3.2932 4.333359,-5.6316 6.789872,-3.3768 2.726289,1.9244 1.738708,7.0436 -1.677202,7.5127 -2.450021,0.5354 -5.337533,-1.504 -5.11267,-4.1359 z" style="fill:#dd4e54;fill-opacity:1;fill-rule:nonzero;stroke:none" /></g></svg>';
      if (id==22) // make green key green
        svg=svg.replace("#dd4e54", "#49b47e");

      thing.innerHTML=svg;
      break;

    default:
      break;
  }

  // Set properties for new things array item
  thingobj.e=thing;
  thingobj.id=id;
  thingobj.x=x;
  thingobj.y=y;
  thingobj.w=levels[gs.level].tilewidth;
  thingobj.h=levels[gs.level].tileheight;

  // Add to things array
  gs.things.push(thingobj);

  document.getElementById("playfield").appendChild(thing);
}

// Add all the collectables for a given level
function addcollectables(level)
{
  var obj, index;

  for (index=0; index<level.layers[2].objects.length; index++)
  {
    obj=level.layers[2].objects[index];

    addcollectable(obj.x+level.tilewidth, obj.y, obj.gid);
  }
}

// Add a single "star" to the background
function addstar(x, y)
{
  var star=document.createElement("div");

  star.style.left=x+"px";
  star.style.top=y+"px";
  star.classList.add("star");

  document.getElementById("background").appendChild(star);
}

// Clear the playfield
function clearplayfield()
{
  // Clear any existing tiles
  clearobjects(gs.tiles);

  // Clear any existing collectables
  clearobjects(gs.things);

  // Clear any existing characters
  clearobjects(gs.enemies);

  // Clear stars
  var bg=document.getElementById("background");
  bg.innerHTML="";
  bg.style.width="0px";
  bg.style.height="0px";

  // Reset scroll
  window.scrollTo(0,0);
}

// All the processing required to load the current level into the playfield
function loadlevel()
{
  // Set which level we are on
  var level=gs.level;
  gs.tilerows=levels[level].height;
  gs.tilecolumns=levels[level].width;
  document.getElementById("playfield").setAttribute("level", level % 4);

  // Reset collectable
  gs.score=0;

  // Clear the playfield of tiles, things and enemies
  clearplayfield();

  // Add the tiles for the level
  addtiles(levels[level]);

  // Add the collectables
  addcollectables(levels[level]);

  // Add the characters
  addcharacters(levels[level]);

  // Restore health to 100%
  gs.player.lf=100;
}

// Show health when it's lost
function showhealth()
{
  var screen=document.getElementById("ui");
  var domtext=buildalphablockstyle(12)+"<div id=\"health\"></div>";
  var healthdisplay="";

  for (var i=0; i<10; i++)
  {
    if (gs.player.lf>=((i+1)*10))
      healthdisplay+="|";
    else
      healthdisplay+="-";
  }

  screen.innerHTML=domtext;
  gs.writer.write("health", healthdisplay);

  setTimeout(function(){ var hdiv=document.getElementById("health"); if ((hdiv!=undefined) && (hdiv!=null)) hdiv.innerHTML=""; }, 3000);
}

// Launch game
function launchgame(level)
{
  var screen=document.getElementById("ui");
  var domtext=buildalphablockstyle(12)+"<div id=\"title\" style=\"background:none;\"></div>";

  // Show which level we are on using a UI overlay
  screen.innerHTML=domtext;
  gs.writer.write("title", "Level "+(level+1));
  setTimeout(function(){ if (gs.state==2) document.getElementById("ui").innerHTML=""; }, 3000);

  /////////////////////////////////////////////////////
  // Start game
  gs.level=level;
  gs.player.e=document.getElementById("player");
  gs.player.w=levels[gs.level].tilewidth;
  gs.player.h=levels[gs.level].tileheight;
  gs.player.e.innerHTML="<div class=\"body\"><div class=\"eye\"><div class=\"iris\"></div></div><div class=\"eyelid\"></div></div><div class=\"leg rightleg\"></div><div class=\"leg leftleg\"></div>";

  // Load everything for "current" level
  loadlevel();

  // Resize background to fit playfield
  var bg=document.getElementById("background");
  bg.style.width=((gs.tilecolumns+2)*gs.tilewidth)+"px";
  bg.style.height=((gs.tilerows+2)*gs.tileheight)+"px";

  // Add some stars to the background
  for (var i=0; i<300; i++)
    addstar(gs.randoms.rnd(gs.tilecolumns*gs.tilewidth), gs.randoms.rnd(gs.tilerows*gs.tileheight));

  // Start the game running
  window.requestAnimationFrame(rafcallback);
}

// Display the title screen
function show_title()
{
  /////////////////////////////////////////////////////
  // Main menu
  var screen=document.getElementById("ui");
  var domtext=buildalphablockstyle(12)+"<div id=\"title\"></div><div id=\"backstory\"></div>";

  screen.innerHTML=domtext;
  gs.writer.write("title", "Planet");
  gs.writer.write("title", "FIGADORE");
  gs.writer.write("title", "has gone");
  gs.writer.write("title", "OFFLINE!");

  gs.writer.write("backstory", "Fred lives on planet Figadore in the Hercules cluster, he likes watching cat videos from planet Earth, but the network link has gone OFFLINE!  Help Fred by unlocking doors, solving puzzles and collecting cubes to pay for the entanglement repolarisation required to get his planet back online. Keys unlock nearest lock of same colour, you need to collect all the gold cubes and squash all the guards to progress through the levels."+String.fromCharCode(13)+" "+String.fromCharCode(13)+"WASD or cursors to move, ENTER or SPACE to jump, or browser supported gamepad. Press jump to start");
}

// Show the intro console
function show_screen(pixelsize)
{
  var screen=document.getElementById("ui");
  var domtext=buildalphablockstyle(pixelsize)+"<div id=\"console\">";
  for (var i=1; i<8; i++)
    domtext+="<span id=\"console_"+i+"\"></span>";

  domtext+="<span id=\"cursor\"></span></div>";

  screen.innerHTML=domtext;
}

// Hide the intro console
function hide_screen()
{
  var screen=document.getElementById("ui");
  screen.innerHTML="";
}

function start_music()
{
  // Play some procedurally generated music
  gs.music.play_tune();

  // Set up automatic repeats
  setInterval(function(){ gs.music.randoms.seeda=3; gs.music.randoms.seedb=6; gs.music.randoms.seedc=6; gs.music.randoms.seedd=4; gs.music.play_tune(); }, ((1*60)+42)*1000);
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
  show_screen(4);

  gs.timeline.add(0, function(){ gs.writer.write("cursor", "_"); });
  gs.timeline.add(0, function(){ gs.writer.typewrite("console_1", "search 'cat videos'"); });
  gs.timeline.add(3000, function(){ gs.writer.write("console_2", "CONNECTING TO PARALLAX SHIFT..."); });
  gs.timeline.add(3100, function(){ gs.dialler.randomdial(10); });
  gs.timeline.add(3100, function(){ gs.dialler.carriertone(10); });
  gs.timeline.add(11000, function(){ gs.writer.write("console_3", "418 OFFLINE"); });
  gs.timeline.add(12000, function(){ gs.writer.typewrite("console_4", "run project 23"); });
  gs.timeline.add(15000, function(){ gs.writer.write("console_5", "451 PARTICLE ACCELERATOR NOT CHARGED"); });
  gs.timeline.add(16000, function(){ gs.writer.typewrite("console_6", "execute order 66"); });
  gs.timeline.add(19000, function(){ gs.writer.write("console_7", "429 FILE NOT FOUND"); });
  gs.timeline.add(20000, function(){ hide_screen(); gs.state=1; show_title(); start_music(); });

  gs.timeline.addcallback(function(){ gs.writer.typechar(); } );

  gs.timeline.begin();
}

// Run the init() once page has loaded
window.onload=function() { init(); };
