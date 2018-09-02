// DTMF dialler object
function dtmf_dial()
{
  // Set default tone length
  this.tonelen=1/5;

  // Initialise to not used
  this.audioCtx=null;
  this.gainNode=null;

  // Set up audio context
  this.setupaudio=function()
  {
    // Stop if we already set it up
    if (this.audioCtx!=null) return;

    // Create audio context
    this.audioCtx=new (window.AudioContext || window.webkitAudioContext)();

    // Add volume control, connecting to audio context
    this.gainNode=this.audioCtx.createGain();
    this.gainNode.connect(this.audioCtx.destination);
    this.gainNode.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
  };

  // Generate DTMF tones for the number passed
  this.dial=function(number)
  {
    var keys="123A456B789C*0#D"; // All possible standard DTMF keys
    var dtmf_low=[697,770,852,941]; // DTMF low frequencies
    var dtmf_high=[1209,1336,1477,1633]; // DTMF high frequencies

    // Make sure the audio context has been set up
    this.setupaudio();

    // Process individual number
    for (var i=0; i<number.length; i++)
    {
      var pos=keys.indexOf(number[i]);

      // Only process keys we know about
      if (pos>=0)
      {
        // Create low and high oscillators
        var e=this.audioCtx.currentTime+(i*this.tonelen);
        var oscl=this.audioCtx.createOscillator();
        var osch=this.audioCtx.createOscillator();

        // Connect to the gain controller
        oscl.connect(this.gainNode);
        osch.connect(this.gainNode);

        // Set the low/high pitches
        oscl.frequency.value=dtmf_low[Math.floor(pos/4)];
        osch.frequency.value=dtmf_high[pos%4];

        // Set the start and stop times for the oscillators
        oscl.start(e);
        oscl.stop(e+(this.tonelen*0.8));
        osch.start(e);
        osch.stop(e+(this.tonelen*0.8));
      }
    }

  };

  // Simulate carrier tone
  this.carriertone=function(carrierdelay)
  {
    this.setupaudio();

    var carrier=this.audioCtx.createOscillator();
    var cstart=this.audioCtx.currentTime+(carrierdelay*this.tonelen)+1.5;
    carrier.connect(this.gainNode);
    carrier.frequency.value=1650;
    carrier.start(cstart);
    carrier.stop(cstart+3);
  };

  // Seed the random number generator with randomish seeds
  this.nowtime=new Date();
  this.randoms=new randomizer(this.nowtime.getHours()*10,this.nowtime.getMilliseconds()&0xff,this.nowtime.getMonth()*20,this.nowtime.getSeconds()*4);

  // Dial a randomly selected number of given number of digits
  this.randomdial=function(numlen)
  {
    var number="";
    for (var num=0; num<numlen; num++)
    {
      number+=this.randoms.rnd(10);
    }
    this.dial(number);
  };
}
