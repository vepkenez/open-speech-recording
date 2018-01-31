!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.Recorder=e():t.Recorder=e()}("undefined"!=typeof self?self:this,function(){return function(t){function e(n){if(o[n])return o[n].exports;var i=o[n]={i:n,l:!1,exports:{}};return t[n].call(i.exports,i,i.exports,e),i.l=!0,i.exports}var o={};return e.m=t,e.c=o,e.d=function(t,o,n){e.o(t,o)||Object.defineProperty(t,o,{configurable:!1,enumerable:!0,get:n})},e.n=function(t){var o=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(o,"a",o),o},e.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},e.p="",e(e.s=0)}([function(t,e,o){"use strict";(function(e){var o=e.AudioContext||e.webkitAudioContext,n=function(t){if(!n.isRecordingSupported())throw new Error("Recording is not supported in this browser");this.state="inactive",this.config=Object.assign({bufferLength:4096,encoderApplication:2049,encoderFrameSize:20,encoderPath:"/static/scripts/waveWorker.min.js",encoderSampleRate:48e3,leaveStreamOpen:!1,maxBuffersPerPage:40,monitorGain:0,numberOfChannels:1,resampleQuality:3,mediaTrackConstraints:!0,streamPages:!1,wavBitDepth:16},t),this.initWorker()};n.isRecordingSupported=function(){return o&&e.navigator&&e.navigator.mediaDevices&&e.navigator.mediaDevices.getUserMedia&&e.WebAssembly},n.prototype.clearStream=function(){this.stream&&(this.stream.getTracks?this.stream.getTracks().forEach(function(t){t.stop()}):this.stream.stop(),delete this.stream),this.audioContext&&(this.audioContext.close(),delete this.audioContext)},n.prototype.encodeBuffers=function(t){if("recording"===this.state){for(var e=[],o=0;o<t.numberOfChannels;o++)e[o]=t.getChannelData(o);this.encoder.postMessage({command:"encode",buffers:e})}},n.prototype.initAudioContext=function(t){return t&&t.context&&(this.audioContext=t.context),this.audioContext||(this.audioContext=new o),this.audioContext},n.prototype.initAudioGraph=function(){var t=this;this.encodeBuffers=function(){delete this.encodeBuffers},this.monitorNode=this.audioContext.createGain(),this.setMonitorGain(this.config.monitorGain),this.monitorNode.connect(this.audioContext.destination),this.scriptProcessorNode=this.audioContext.createScriptProcessor(this.config.bufferLength,this.config.numberOfChannels,this.config.numberOfChannels),this.scriptProcessorNode.connect(this.audioContext.destination),this.scriptProcessorNode.onaudioprocess=function(e){t.encodeBuffers(e.inputBuffer)}},n.prototype.initSourceNode=function(t){if(t&&t.context)return e.Promise.resolve(t);if(this.stream&&this.sourceNode)return e.Promise.resolve(this.sourceNode);var o=this;return e.navigator.mediaDevices.getUserMedia({audio:this.config.mediaTrackConstraints}).then(function(t){return o.stream=t,o.audioContext.createMediaStreamSource(t)})},n.prototype.initWorker=function(){var t=this,o=function(e){t.streamPage(e.data)},n=function(e){t.storePage(e.data)};this.recordedPages=[],this.totalLength=0,this.encoder=new e.Worker(this.config.encoderPath),this.encoder.addEventListener("message",this.config.streamPages?o:n)},n.prototype.pause=function(){"recording"===this.state&&(this.state="paused",this.onpause())},n.prototype.resume=function(){"paused"===this.state&&(this.state="recording",this.onresume())},n.prototype.setMonitorGain=function(t){this.config.monitorGain=t,this.monitorNode&&this.audioContext&&this.monitorNode.gain.setTargetAtTime(t,this.audioContext.currentTime,.01)},n.prototype.start=function(t){if("inactive"===this.state){var e=this;return this.initAudioContext(t),this.initAudioGraph(),this.initSourceNode(t).then(function(t){e.state="recording",e.encoder.postMessage(Object.assign({command:"init",originalSampleRate:e.audioContext.sampleRate,wavSampleRate:e.audioContext.sampleRate},e.config)),e.sourceNode=t,e.sourceNode.connect(e.monitorNode),e.sourceNode.connect(e.scriptProcessorNode),e.onstart()})}},n.prototype.stop=function(){"inactive"!==this.state&&(this.state="inactive",this.monitorNode.disconnect(),this.scriptProcessorNode.disconnect(),this.sourceNode.disconnect(),this.config.leaveStreamOpen||this.clearStream(),this.encoder.postMessage({command:"done"}))},n.prototype.storePage=function(t){if(null===t){var e=new Uint8Array(this.totalLength);this.recordedPages.reduce(function(t,o){return e.set(o,t),t+o.length},0),this.ondataavailable(e),this.initWorker(),this.onstop()}else this.recordedPages.push(t),this.totalLength+=t.length},n.prototype.streamPage=function(t){null===t?(this.initWorker(),this.onstop()):this.ondataavailable(t)},n.prototype.ondataavailable=function(){},n.prototype.onpause=function(){},n.prototype.onresume=function(){},n.prototype.onstart=function(){},n.prototype.onstop=function(){},t.exports=n}).call(e,o(1))},function(t,e){var o;o=function(){return this}();try{o=o||Function("return this")()||(0,eval)("this")}catch(t){"object"==typeof window&&(o=window)}t.exports=o}])});

// fork getUserMedia for multiple browser versions, for the future
// when more browsers support MediaRecorder

navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);

// set up basic variables for app



var audio_context;
var recorder;
var audio_stream;

var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var upload = document.querySelector('.upload');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');
var body = document.querySelector('body');
var mediaRecorder = null;
var mediaStreamSource = null;
var ignoreAutoPlay = false;
var current_word = '';
var next_word = '';

// disable stop button while not recording

stop.disabled = true;
upload.disabled = true;

// visualiser setup - create web audio api context and canvas

var audioCtx = new (window.AudioContext || webkitAudioContext)();
var canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.getUserMedia) {
  console.log('getUserMedia supported.');

  var constraints = { audio: true };
  var chunks = [];

  var onSuccess = function(stream) {
    mediaStreamSource = audioCtx.createMediaStreamSource(stream);
    var input = mediaStreamSource;
    
    mediaRecorder = new Recorder(input, {

      encoderPath: "/static/scripts/waveWorker.js"
    });

    record.onclick = function() {
      getNextWord();
      visualize(stream);

      // Display a countdown before recording starts.
      var progress = document.querySelector('.progress-display');
      progress.innerText = "3";
      document.querySelector('.info-display').innerText = "";
      setTimeout(function() {
	  progress.innerText = "2";
	  setTimeout(function() {
	      progress.innerText = "1";
	      setTimeout(function() {
		  progress.innerText = "";
		  startRecording();
	      }, 1000);
	  }, 1000);
      }, 1000);
      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function() {
      if (mediaRecorder.state == 'inactive') {
        // The user has already pressed stop, so don't set up another word.
        ignoreAutoPlay = true;
      } else {
        mediaRecorder.stop();
      }
      mediaStreamSource.disconnect();
      console.log(mediaRecorder.state);
      record.style.background = "";
      record.style.color = ""; 
      stop.disabled = true;
      record.disabled = false;
    }

    upload.onclick = function() {
      saveRecordings();
    }

    mediaRecorder.onstop = function(e) {
      return;
      
      console.log("data available after MediaRecorder.stop() called.");

      var clipName = document.querySelector('.info-display').innerText;
      var clipContainer = document.createElement('article');
      var clipLabel = document.createElement('p');
      var audio = document.createElement('audio');
      var deleteButton = document.createElement('button');
     
      clipContainer.classList.add('clip');
      clipLabel.classList.add('clip-label');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';
      clipLabel.textContent = clipName;

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);
      audio.controls = true;
      var blob = new Blob(chunks, { 'type' : 'audio/wav;' });
      chunks = [];
      var audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      body.classList.remove('recording');
      console.log("recorder stopped");

      deleteButton.onclick = function(e) {
        evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      	updateProgress();
      }
    }

    mediaRecorder.ondataavailable = function(typedArray) {
      var clipName = document.querySelector('.info-display').innerText;
      var clipContainer = document.createElement('article');
      var clipLabel = document.createElement('p');
      var audio = document.createElement('audio');
      var deleteButton = document.createElement('button');
     
      clipContainer.classList.add('clip');
      clipLabel.classList.add('clip-label');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';
      clipLabel.textContent = clipName;

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);
      audio.controls = true;
     
      var dataBlob = new Blob( [typedArray], { type: 'audio/wav' } );
      var fileName = new Date().toISOString() + ".wav";
      var url = URL.createObjectURL( dataBlob );


      audio.src = url;
      body.classList.remove('recording');
      console.log("recorder stopped");

      deleteButton.onclick = function(e) {
        evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
	      updateProgress();
      }
    }
  }
  var onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.getUserMedia(constraints, onSuccess, onError);
} else {
  console.log('getUserMedia not supported on your browser!');
  document.querySelector('.info-display').innerText = 
	'Your device does not support the HTML5 API needed to record audio (this is a known problem on iOS)';  
}

function visualize(stream) {
  var analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  mediaStreamSource.connect(analyser);
  
  WIDTH = canvas.width
  HEIGHT = canvas.height;

  draw()

  function draw() {

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {
 
      var v = dataArray[i] / 128.0;
      var y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
  }
}

var wantedWords = [
  'bass-drum',
  'snare',
  'toms',
  'rimshot',
  'handclap',
  'cowbell',
  'cymbal',
  'hi-hat',
];

var fillerWords = [
];

function getRecordedWords() {
  var wordElements = document.querySelectorAll('.clip-label');
  var wordCounts = {};
  wordElements.forEach(function(wordElement) {
      var word = wordElement.innerText;
      if (!wordCounts.hasOwnProperty(word)) {
	  wordCounts[word] = 0;
      }
      wordCounts[word] += 1;
  });
  return wordCounts;
}

function getAllWantedWords() {
  var wordCounts = {};
  wantedWords.forEach(function(word) {
    wordCounts[word] = 5;
  });
  fillerWords.forEach(function(word) {
    wordCounts[word] = 1;
  });
  return wordCounts;
}

function getRemainingWords() {
  var recordedCounts = getRecordedWords();
  var wantedCounts = getAllWantedWords();
  var remainingCounts = {};
  for (var word in wantedCounts) {
    wantedCount = wantedCounts[word];
    var recordedCount;
    if (recordedCounts.hasOwnProperty(word)) {
      recordedCount = recordedCounts[word];
    } else {
      recordedCount = 0;
    }
    var remainingCount = wantedCount - recordedCount;
    if (remainingCount > 0) {
      remainingCounts[word] = remainingCount;
    }
  }
  return remainingCounts;
}

function unrollWordCounts(wordCounts) {
  var result = [];
  for (var word in wordCounts) {
    count = wordCounts[word];
    for (var i = 0; i < count; ++i) {
      result.push(word);
    }
  }
  return result;
}

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

function getNextWord() {
  var remainingWords = unrollWordCounts(getRemainingWords());
  if (remainingWords.length == 0) {
    return null;
  }
  shuffleArray(remainingWords);
  next_word = remainingWords[0];
  document.querySelector('.next-word-display').innerText = next_word;
  return next_word;
}

function getProgressDescription() {
  var allWords = unrollWordCounts(getAllWantedWords());
  var remainingWords = unrollWordCounts(getRemainingWords());
  return ((allWords.length + 1) - remainingWords.length) + "/" + allWords.length;
}

function updateProgress() {
  var progress = getProgressDescription();
  document.querySelector('.progress-display').innerText = progress;
}

function startRecording() {
  if (ignoreAutoPlay) {
    ignoreAutoPlay = false;
    return;
  }
  var current_word = next_word;
  document.querySelector('.info-display').innerText = current_word;
  doRecord();
}

function doRecord(){

  updateProgress();
  mediaRecorder.start();
  console.log(mediaRecorder.state);
  console.log("recorder started");
  record.style.background = "red";
  body.classList.add('recording');
  setTimeout(endRecording, 1500);

}

function endRecording() {
  if (mediaRecorder.state == 'inactive') {
    // The user has already pressed stop, so don't set up another word.
    return;
  }
  mediaRecorder.stop();
  console.log(mediaRecorder.state);
  body.classList.remove('recording');
  console.log("recorder stopped");
  record.style.background = "";
  record.style.color = "";
  next_word = getNextWord();
  if (next_word === null) {
    promptToSave();
    return;
  }
  setTimeout(startRecording, 1000);
}

function promptToSave() {
  if (confirm('Are you ready to upload your words?\nIf not, press cancel now,' + 
	      ' and then press Upload once you are ready.')) {
    saveRecordings();
  }
  upload.disabled = false;
}

var allClips;
var clipIndex;

function saveRecordings() {
  mediaStreamSource.disconnect();
  allClips = document.querySelectorAll('.clip');
  clipIndex = 0;
  uploadNextClip();
}

function uploadNextClip() {
  document.querySelector('.progress-display').innerText = 'Uploading clip ' + 
	clipIndex + '/' + unrollWordCounts(getAllWantedWords()).length;
  var clip = allClips[clipIndex];
  clip.style.display = 'None';
  var audioBlobUrl = clip.querySelector('audio').src;
  var word = clip.querySelector('p').innerText;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', audioBlobUrl, true);
  xhr.responseType = 'blob';
  xhr.onload = function(e) {
    if (this.status == 200) {
      var blob = this.response;
      console.log(blob);
      var ajaxRequest = new XMLHttpRequest();
      var uploadUrl = '/upload?word=' + word + '&_csrf_token=' + csrf_token;
      ajaxRequest.open('POST', uploadUrl, true);
      ajaxRequest.setRequestHeader('Content-Type', 'application/json');    
      ajaxRequest.onreadystatechange = function() {
        if (ajaxRequest.readyState == 4) {
	  if (ajaxRequest.status === 200) {
            clipIndex += 1;
            if (clipIndex < allClips.length) {
	      uploadNextClip();
	    } else {
	      allDone();
	    }
          } else {
            alert('Uploading failed with error code ' + ajaxRequest.status);
          }
	}
      };
      ajaxRequest.send(blob);
    }
  };
  xhr.send();
}

function allDone() {
  document.cookie = 'all_done=true; path=/';
  location.reload(true);
}
