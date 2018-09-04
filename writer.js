function textwriter()
{
  this.write=function(id, text, crlf)
  {
    var domtext="<span style=\"white-space:nowrap;\">";

    for (var i=0; i<text.length; i++)
    {
      var offs=(text.charCodeAt(i)-32);

      // Add crlf when in string
      if (offs==(13-32))
        domtext+="<br/>";
  
      // Don't try to draw characters outside our font set
      if ((offs<0) || (offs>94))
        continue;

      // Handle spaces
      if (offs==0)
        domtext+="</span>";
  
      // Add character wrapper
      domtext+="<div class=\"alphablock\">";
  
      // Add "pixels"
      var p=0;
      for (var j=0; j<4; j++)
      {
        var dual=font_8bit[(offs*4)+j]||0;
  
        for (var k=0; k<8; k++)
        {
          if (dual&(1<<(8-k)))
            domtext+="<div class=\"block filled\"></div>";
          else
            domtext+="<div class=\"block\"></div>";
  
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

      // Handle spaces
      if (offs==0)
        domtext+="<span style=\"white-space:nowrap;\">";
    }

    domtext+="</span>";

    if ((crlf==undefined) || (crlf!=false))
      domtext+="<br/>";

    // Pass domtext to the DOM for rendering
    document.getElementById(id).innerHTML+=domtext;
  };

  this.text="";
  this.pos=0;
  this.id="wrapper";

  this.typechar=function()
  {
    if (this.pos<this.text.length)
    {
      this.write(this.id, this.text.charAt(this.pos), false);
      this.pos++;
    }
  };

  this.typewrite=function(id, text)
  {
    document.getElementById(id).innerHTML="";

    this.id=id;
    this.pos=0;
    this.text=text+String.fromCharCode(13);
  };
}
