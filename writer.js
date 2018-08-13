function write(text)
{
  var domtext="<style>.alphablock { font-size:0px; display:inline-block; } .block { display:inline-block; width:6px; height:6px; border-top-left-radius: 3px; border-bottom-right-radius: 3px; } .filled { background-color:#000000;} </style>";

  for (var i=0; i<text.length; i++)
  {
    var offs=(text.charCodeAt(i)-32);

    // Don't try to draw characters outside our font set
    if ((offs<0) || (offs>101))
    {
      // console.log(i+" "+offs+" "+text.charCodeAt(i)+" '"+text.substr(i,1)+"'");
      continue;
    }

    // Add character wrapper
    domtext+="<div class=\"alphablock\">";

    // Add "pixels"
    for (var j=0; j<(4*8); j++)
    {
      if ((font_8bit[offs][j]||0)==1)
        domtext+="<div class=\"block filled\" style=\"background-color:#"+(2-(j%2))+""+(8-((j%4)*2))+""+(2-(j%2))+"\"></div>";
      else
        domtext+="<div class=\"block empty\"></div>";

      // Add line break between character rows
      if (((j+1)%4)==0)
        domtext+="<br/>";
    }

    // Close wrapper
    domtext+="</div>";
  }

  // Pass domtext to the DOM for rendering
  document.getElementById("textarea").innerHTML=domtext;
}
