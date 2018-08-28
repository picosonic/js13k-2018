function textwriter()
{
  this.write=function(id, text, crlf)
  {
    var domtext="";

    if ((crlf==undefined) || (crlf!=false))
      domtext+="<br/>";
  
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
    }
  
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
    this.text=text;
  };
}
