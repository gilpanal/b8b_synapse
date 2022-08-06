import * as tf from '@tensorflow/tfjs-node'
//import tf from '@tensorflow/tfjs'
import fetch from 'node-fetch';
//import wav from "node-wav";
/* https://github.com/audiojs/audio-decode#supported-formats */
import  decode  from 'audio-decode';
/* https://github.com/audiocogs/vorbis.js#node-usage*/
import * as AV from 'vorbis.js';
import * as ogg from 'ogg.js';
/*https://github.com/audiocogs/opus.js#node-usage*/
import  * as opus from 'opus.js'
import { EssentiaWASM, EssentiaModel } from "essentia.js";

// DOWN LIMIT TO CONSIDER A LABEL/CLASS
const THRESHOLD = 0.2

/* MagnaTagATune */
const musiCNNLabels = ["guitar", "classical", "slow", "techno", "strings", "drums", "electronic", "rock", "fast", "piano", "ambient", "beat", "violin", "vocal", "synth", "female", "indian", "opera", "male", "singing", "vocals", "no vocals", "harpsichord", "loud", "quiet", "flute", "woman", "male vocal", "no vocal", "pop", "soft", "sitar", "solo", "man", "classic", "choir", "voice", "new age", "dance", "male voice", "female vocal", "beats", "harp", "cello", "no voice", "weird", "country", "metal", "female voice", "choral"] 

//const essentia = new Essentia(EssentiaWASM);
let extractor = null;
let musicnn = null;

const isAudio = (url) => {
  console.log(url)
  return /\.(wav|ogg|oga|mp3)$/.test(url);
}

class AudioClassifier {
  constructor(params) {
    this.loadModel(params);
  }

  async loadModel({ modelUrl }) {
    if (!modelUrl || modelUrl === "") {
      console.error("audioteachablemachine-node] -", "Missing model URL!");
      this.error = "Missing model URL!";
      return null;
    }

    try {
      
      musicnn = new EssentiaModel.TensorflowMusiCNN(tf, "file://"+modelUrl, true);     

      await musicnn.initialize(); 

      extractor = new EssentiaModel.EssentiaTFInputExtractor(
          EssentiaWASM,
          "musicnn",
          false
      )

    } catch (e) {
      console.error("[audioteachablemachine-node] -", e);
    }
  }

  async checkModel(cb) {
    const { model } = this;

    if (model) {
      return Promise.resolve({ cb });
    }

    return Promise.reject({ message: "Loading model" });
  }

  async loadAudioAndDecode(audioPath) {
    const response = await fetch(audioPath);       
    const audioBuffer = await response.arrayBuffer();
    //console.log(audioBuffer)
    // FIX SOMETHING: const audioArray = new Float32Array(audioBuffer);
    //const buff = Buffer.from(audioBuffer, 'base64');
    //console.log(buff)  
    //const decodedAudio = await decode(buff)
    //console.log(audioBuffer) 
    const decodedAudio = await decode(audioBuffer) 
    //console.log(decodedAudio)        
    const audioArray = decodedAudio._data;    
    //const decodedAudio = wav.decode(audioBuffer);
    //const audioArray = decodedAudio.channelData[0];    
    return audioArray; 
}

  async analyse(buffer) {
    //const audioData = await extractor.downsampleAudioBuffer(buffer);
    const features = await extractor.computeFrameWise(buffer, 256);    
    //await musicnn.initialize();    
    const predictions = await musicnn.predict(features, true);  
    return predictions;
  }

  async classify(params) {
    const { audioUrl } = params;        
    if (!isAudio(audioUrl)) {
      return Promise.reject({ error: "Audio URL is not valid!" });
    }

    if (this.error) {
      return Promise.reject({ error: this.error });
    }

    return await  this.inference(params)    
  }

  async inference({ audioUrl }) {
    try {
      const audio = await this.loadAudioAndDecode(audioUrl);
      const analysisOutput = await this.analyse(audio);
      /* number must be equals to musiCNNLabels.length */
      //console.log(analysisOutput[0].length) 
      
      let predictions = []
      for(let segment in analysisOutput){  
        const obj = {};
        musiCNNLabels.forEach((element, index) => {
          if(analysisOutput[segment][index] > THRESHOLD){
            obj[element] = analysisOutput[segment][index];
          }  
        });
        predictions.push(obj)
      }      
      //console.log(predictions);
      return predictions;
    } catch (error) {
      return Promise.reject({ error });
    }
  }
}

export default AudioClassifier;
