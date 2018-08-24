// procedurally generated music object
function gen_music()
{
  // Musical note digraphs by frequency
  //
  // C2   C2toC7 second
  // to
  // C7 first

  this.tune_pop=[];
  this.tune_weights=0;

  this.tune_stats=[
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,8,,,,,,4,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,12,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,12,4,,,,4,,,,4,8,12,9,4,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,2,,,6,,5,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,12,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,8,,,,,,,4,,,,,8,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,8,,6,,8,12,,2,,,,,2,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,8,,12,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,38,,,,8,,8,29,,6,,6,3,,,,8,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,12,,,4,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,14,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,4,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,14,,,,,6,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,1,,,4,,2,,8,,,26,,,,9,,,24,2,24,,,2,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,8,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,8,,,,,,,16,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,22,,,,6,8,,18,2,8,,,36,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,8,,,,,,,38,,,,,2,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,5,,,,2,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,8,,,,,,,,,15,,4,8,4,,,17,22,,,,2,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,2,,,,,,,48,,,4,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,16,,8,,14,,,2,,,,,3,,,,8,8,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,8,,,,,,,,,,,,,,12,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,8,,,4,,,,,,,,2,,12,12,2,6,,21,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,16,,,,26,22,5,,38,,12,,,,,,38,24,,,,8,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,8,,4,,,18,4,,,,,,,,4,36,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,4,,,,,,,12,,,,,,12,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,24,,15,5,4,18,,14,,,,,,4,,18,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,12,,,,,,2,24,,12,,,,,12,,18,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,12,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,5,,8,,,8,,6,12,,,,,,,,,12,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,8,,,,,,,6,12,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,4,8,,,,,,,,],
    [,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,]
  ];

  this.build_tune_pop=function()
  {
    // populate digraph table
    for (var n1=0; n1<50; n1++)
    {
      for (var n2=0; n2<50; n2++)
      {
        var w=(this.tune_stats[n1][n2]||0);

        this.tune_pop[(n1*50)+n2]={dig:n1+","+n2,score:w};
        this.tune_weights+=w;
      }
    }

    // sort by weight
    this.tune_pop.sort(function(a,b) {return ((b.score>a.score)?1:(b.score==a.score)?0:-1)});
  };

  this.audioCtx=null;
  this.gainNode=null;
  this.panNode=null;
  this.notelen=1/5;
  this.notenum=0;
  this.randoms=new randomizer();

  this.play_note=function(type, note, start, len)
  {
    if ((note==0) || (this.audioCtx==null)) return;

    var e=this.audioCtx.currentTime+start;
    var osc=this.audioCtx.createOscillator();

    // Set oscillator wave type
    osc.type=type;

    // Pan the note to where it would sound like if played on a piano
    osc.connect(this.panNode);
    if (note!=1) this.panNode.pan.setValueAtTime(((note/50)*2)-1, e);

    // Convert the note from note value to frequency in Hz
    osc.frequency.value=65.41*Math.pow(2, note/12);

    // Set the start and stop times for the oscillator
    osc.start(e);
    osc.stop(e+len);
  };

  this.play_tune=function()
  {
    if (this.tune_pop.length==0)
      this.build_tune_pop();

    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Add volume control
    this.gainNode=this.audioCtx.createGain();
    this.gainNode.connect(this.audioCtx.destination);
    this.gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);

    // Add audio panning
    this.panNode=this.audioCtx.createStereoPanner();
    this.panNode.connect(this.gainNode);

    ////////////////////////////////////
    for (var i=0; i<50; i++)
    {
      var phrasestr="";
      var dig_len=2;

      // Build phrase up from note digraphs using weighted 2nd order probability
      for (var pairs=0; pairs<dig_len; pairs++)
      {
        var w=this.randoms.rnd(this.tune_weights);
        for (j=0; j<this.tune_pop.length; j++)
        {
          if (w<this.tune_pop[j].score)
            break;

          w-=this.tune_pop[j].score;
        }
        phrasestr+=","+this.tune_pop[j].dig;
      }

      var phrase=phrasestr.split(',');

      for (var rep=0; rep<2; rep++)
      {
        for (var k=0; k<phrase.length; k++)
        {
          var note=phrase[k];
          this.play_note('square', note||0, this.notenum*this.notelen, this.notelen/1.5); // Melody
          this.play_note('sawtooth', phrase[1]/4, this.notenum*this.notelen, this.notelen/1.8); // Baseline
          this.notenum++;
        }
      }
    }
  };
}
