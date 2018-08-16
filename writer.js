function write(text)
{
  var domtext="<style>.alphablock { font-size:0px; display:inline-block; } .block { display:inline-block; width:6px; height:6px; border-top-left-radius:3px; border-bottom-right-radius:3px; } .filled { background-color:#00ff00; background: linear-gradient(to bottom, rgba(0,255,0,0) 0%,rgba(0,255,0,1) 33%,rgba(0,255,0,1) 66%,rgba(0,255,0,0) 100%); }</style>";

  for (var i=0; i<text.length; i++)
  {
    var offs=(text.charCodeAt(i)-32);

    // Don't try to draw characters outside our font set
    if ((offs<0) || (offs>101))
      continue;

    // Add character wrapper
    domtext+="<div class=\"alphablock\">";

    // Add "pixels"
    var p=0;
    for (var j=0; j<4; j++)
    {
      var dual=font_8bit[(offs*4)+j];

      for (var k=0; k<8; k++)
      {
        if (dual&(1<<(8-k)))
          domtext+="<div class=\"block filled\"></div>";
        else
          domtext+="<div class=\"block empty\"></div>";

        // Add line break between character rows
        p++;
        if (p==4)
        {
          domtext+="<br/>";
          p=0;
        }
      }
    }

    // Close wrapper
    domtext+="</div>";
  }

  // Pass domtext to the DOM for rendering
  document.getElementById("textarea").innerHTML=domtext;
}
