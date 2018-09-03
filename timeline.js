// Timeline object
function timelineobj()
{
  this.timeline=[]; // Array of actions
  this.timelinepos=0; // Point in time of last update
  this.timelineepoch=0; // Epoch when timeline was started
  this.callback=null; // Optional callback on each timeline "tick"

  // Add a new function to timeline with a given start time
  this.add=function(itemstart, newitem)
  {
    var newobj={start:itemstart, item:newitem, done:false};

    this.timeline.push(newobj);

    // Keep timeline sorted by start time of items
    this.timeline.sort(function(a,b) {return ((b.start<a.start)?1:(b.start==a.start)?0:-1)});
  };

  // Add a timeline callback
  this.addcallback=function(item)
  {
    this.callback=item;
  };

  // Animation frame callback
  this.timelineraf=function(timestamp)
  {
    var remain=0;

    // If this is the first call then just record the epoch
    if (this.timelinepos==0)
    {
      this.timelineepoch=timestamp;
    }
    else
    {
      // Calculate delta time since timeline start
      var delta=timestamp-this.timelineepoch;

      // Look through timeline array for jobs not run which should have
      for (var i=0; i<this.timeline.length; i++)
      {
        if ((!this.timeline[i].done) && (this.timeline[i].start<delta))
        {
          this.timeline[i].done=true;
          this.timeline[i].item();
        }

        // Keep a count of all remaining jobs
        if (!this.timeline[i].done)
          remain++;
      }

      // If a callback was requested, then call it
      if (this.callback!=null)
        this.callback();
    }

    // Record new timeline position
    this.timelinepos=timestamp;

    // If there is more jobs then request another callback
    if ((this.timelinepos==this.timelineepoch) || (remain>0))
      window.requestAnimationFrame(this.timelineraf.bind(this));
  };

  // Start the timeline running
  this.begin=function()
  {
    window.requestAnimationFrame(this.timelineraf.bind(this));
  };
}
