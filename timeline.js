function timelineobj()
{
  this.timeline=[];
  this.timelinepos=0;
  this.timelineepoch=0;

  this.add=function(itemstart, newitem)
  {
    var newobj={start:itemstart, item:newitem, done:false};

    this.timeline.push(newobj);

    this.timeline.sort(function(a,b) {return ((b.start<a.start)?1:(b.start==a.start)?0:-1)});
  };

  this.timelineraf=function(timestamp)
  {
    var remain=0;

    if (this.timelinepos==0)
    {
      this.timelineepoch=timestamp;
    }
    else
    {
      var delta=timestamp-this.timelineepoch;

      for (var i=0; i<this.timeline.length; i++)
      {
        if ((!this.timeline[i].done) && (this.timeline[i].start<delta))
        {
          this.timeline[i].done=true;
          this.timeline[i].item();
        }

        if (!this.timeline[i].done)
          remain++;
      }

      gs.writer.typechar();
    }

    this.timelinepos=timestamp;

    if ((this.timelinepos==this.timelineepoch) || (remain>0))
      window.requestAnimationFrame(this.timelineraf.bind(this));
  };

  this.begin=function()
  {
    window.requestAnimationFrame(this.timelineraf.bind(this));
  };
}