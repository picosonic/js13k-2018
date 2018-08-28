var timeline=[];
var timelinepos=0;
var timelineepoch=0;

function timelineadd(itemstart, newitem)
{
  var newobj={start:itemstart, item:newitem, done:false};

  timeline.push(newobj);

  timeline.sort(function(a,b) {return ((b.start<a.start)?1:(b.start==a.start)?0:-1)});
}

function timelineraf(timestamp)
{
  var remain=0;

  if (timelinepos==0)
  {
    timelineepoch=timestamp;
  }
  else
  {
    var delta=timestamp-timelineepoch;

    for (var i=0; i<timeline.length; i++)
    {
      if ((!timeline[i].done) && (timeline[i].start<delta))
      {
        timeline[i].done=true;
        timeline[i].item();
      }

      if (!timeline[i].done)
        remain++;
    }

    gs.writer.typechar();
  }

  timelinepos=timestamp;

  if (remain>0)
    window.requestAnimationFrame(timelineraf);
}

function timelinebegin()
{
  window.requestAnimationFrame(timelineraf);
}
