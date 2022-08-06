import * as tf from '@tensorflow/tfjs-node'
import fetch from 'node-fetch'
/* https://github.com/audiojs/audio-decode#supported-formats */
import  decode  from 'audio-decode'
/* https://github.com/audiocogs/vorbis.js#node-usage*/
import * as AV from 'vorbis.js'
import * as ogg from 'ogg.js'
/*https://github.com/audiocogs/opus.js#node-usage*/
import  * as opus from 'opus.js'
import { EssentiaWASM, EssentiaModel } from "essentia.js"

// DOWN LIMIT TO CONSIDER A LABEL/CLASS
const THRESHOLD = 0.2

/* MagnaTagATune */
const musiCNNLabels = ["guitar", "classical", "slow", "techno", "strings", "drums", "electronic", "rock", "fast", "piano", "ambient", "beat", "violin", "vocal", "synth", "female", "indian", "opera", "male", "singing", "vocals", "no vocals", "harpsichord", "loud", "quiet", "flute", "woman", "male vocal", "no vocal", "pop", "soft", "sitar", "solo", "man", "classic", "choir", "voice", "new age", "dance", "male voice", "female vocal", "beats", "harp", "cello", "no voice", "weird", "country", "metal", "female voice", "choral"] 

let extractor = null
let musicnn = null

const isAudio = (url) => {  
  return /\.(wav|ogg|oga|mp3)$/.test(url)
}

class AudioClassifier {
  constructor(params) {
    this.loadModel(params)
  }

  async loadModel({ modelUrl }) {
    if (!modelUrl || modelUrl === "") {
      console.error("audioteachablemachine-node] -", "Missing model URL!")
      this.error = "Missing model URL!"
      return null
    }

    try {
      
      musicnn = new EssentiaModel.TensorflowMusiCNN(tf, "file://"+modelUrl, true)     

      await musicnn.initialize().then(() => console.log("essentia-tfjs model ready..."));
      //console.log(`Using TF ${tf.getBackend()} backend`);


      extractor = new EssentiaModel.EssentiaTFInputExtractor(
          EssentiaWASM,
          "musicnn",
          false
      )

    } catch (e) {
      console.error("[audioteachablemachine-node] -", e)
    }
  }

  async checkModel(cb) {
    const { model } = this

    if (model) {
      return Promise.resolve({ cb })
    }

    return Promise.reject({ message: "Loading model" })
  }

  async loadAudioAndDecode(audioPath) {
    const response = await fetch(audioPath)       
    const audioBuffer = await response.arrayBuffer()    
    const decodedAudio = await decode(audioBuffer)     
    const audioArray = decodedAudio._data   
    return audioArray 
}

  async analyse(buffer) {
    const featuresStart = Date.now()    
    const features = await extractor.computeFrameWise(buffer, 256) 
    const extractorTime = Date.now() - featuresStart  
    //console.log('computeFeatures: ', features.melSpectrum);  
    const predictioStart = Date.now()       
    const predictions = await musicnn.predict(features, true)
    const predictionTime = Date.now() - predictioStart
    
    const predictObj = {
      extractTime:extractorTime,
      predictTime:predictionTime,
      labels:predictions
    }
    return predictObj
  }

  async classify(params) {
    const { audioUrl } = params        
    if (!isAudio(audioUrl)) {
      return Promise.reject({ error: "Audio URL is not valid!" })
    }

    if (this.error) {
      return Promise.reject({ error: this.error })
    }

    return await  this.inference(params)    
  }

  async inference({ audioUrl }) {
    try {
      const audio = await this.loadAudioAndDecode(audioUrl)
      let analysisOutput = await this.analyse(audio) 
      const labels = analysisOutput.labels
      let predictions = []
      for(let segment in labels){  
        const obj = {}
        musiCNNLabels.forEach((element, index) => {
          if(labels[segment][index] > THRESHOLD){
            obj[element] = labels[segment][index]
          }  
        })
        predictions.push(obj)
      } 
      analysisOutput.labels = predictions         
      return analysisOutput
    } catch (error) {
      return Promise.reject({ error })
    }
  }
}

export default AudioClassifier