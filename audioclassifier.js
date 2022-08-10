import * as tf from '@tensorflow/tfjs-node'
import fetch from 'node-fetch'
/* https://github.com/audiojs/audio-decode#supported-formats */
import decode from 'audio-decode'
/* https://github.com/audiocogs/vorbis.js#node-usage*/
import * as AV from 'vorbis.js'
import flac from 'flac.js'
//import * as ogg from 'ogg.js'
/*https://github.com/audiocogs/opus.js#node-usage*/
import * as opus from 'opus.js'
import { EssentiaWASM, EssentiaModel } from 'essentia.js'

import getFinalPredResult from './audioclassifier_helper.js'
// DOWN LIMIT TO CONSIDER A LABEL/CLASS
export const THRESHOLD = 0.5

/* MagnaTagATune */
export const MUSICNNLABELS = ['guitar', 'classical', 'slow', 'techno', 'strings', 'drums', 'electronic', 'rock', 'fast', 'piano', 'ambient', 'beat', 'violin', 'vocal', 'synth', 'female', 'indian', 'opera', 'male', 'singing', 'vocals', 'no vocals', 'harpsichord', 'loud', 'quiet', 'flute', 'woman', 'male vocal', 'no vocal', 'pop', 'soft', 'sitar', 'solo', 'man', 'classic', 'choir', 'voice', 'new age', 'dance', 'male voice', 'female vocal', 'beats', 'harp', 'cello', 'no voice', 'weird', 'country', 'metal', 'female voice', 'choral']

let extractor = null
let musicnn = null

const isAudio = (url) => {
  return /\.(wav|ogg|oga|flac|mp3)$/.test(url)
}

class AudioClassifier {
  constructor(params) {
    this.loadModel(params)
  }

  async loadModel({ modelUrl }) {
    if (!modelUrl || modelUrl === '') {
      console.error('audioteachablemachine-node] -', 'Missing model URL!')
      this.error = 'Missing model URL!'
      return null
    }

    try {

      musicnn = new EssentiaModel.TensorflowMusiCNN(tf, 'file://' + modelUrl, true)

      await musicnn.initialize().then(() => console.log('essentia-tfjs model ready...'));
      //console.log(`Using TF ${tf.getBackend()} backend`);


      extractor = new EssentiaModel.EssentiaTFInputExtractor(
        EssentiaWASM,
        'musicnn',
        false
      )

    } catch (e) {
      console.error('[audioteachablemachine-node] -', e)
    }
  }

  async checkModel(cb) {
    const { model } = this

    if (model) {
      return Promise.resolve({ cb })
    }

    return Promise.reject({ message: 'Loading model' })
  }
  async doDecode(thebuffer){
    console.log('start decoding')
    let result = null
    await decode(thebuffer).then(decoAudio => {      
      result = decoAudio
    }, err => {
      console.log(err)      
    });
    return result
  }
  async loadAudioAndDecode(audioPath) {    
    const response = await fetch(audioPath)
    const audioBuffer = await response.arrayBuffer()
    const decodedAudio = await this.doDecode(audioBuffer)
    if(!decodedAudio){     
      return {error:"Decode error"}
    } else{
      const audioArray = decodedAudio._data
      return audioArray
    }
    
  }
  async analyse(buffer) {
    const featuresStart = Date.now()
    const features = await extractor.computeFrameWise(buffer, 256)
    const extractorTime = Date.now() - featuresStart
    console.log('start prediction')
    //console.log('computeFeatures: ', features.melSpectrum);  
    const predictioStart = Date.now()
    const predictions = await musicnn.predict(features, true)
    const predictionTime = Date.now() - predictioStart

    const predictObj = {
      extract_time: extractorTime,
      predict_time: predictionTime,
      labels: predictions
    }
    return predictObj
  }
  async classify(params) {
    const { audioUrl } = params
    if (!isAudio(audioUrl)) {
      return Promise.reject({ error: 'Audio URL is not valid!' })
    }

    if (this.error) {
      return Promise.reject({ error: this.error })
    }

    return await this.inference(params)
  }
  async inference({ audioUrl }) {
    try {
      const audio = await this.loadAudioAndDecode(audioUrl)      
      if(audio.error) {
        return Promise.reject({ error:'Decode error' })
      } else{
        let analysisOutput = await this.analyse(audio)
        const labels = analysisOutput.labels
        analysisOutput.labels = getFinalPredResult(labels)
        return analysisOutput
      }    
    } catch (error) {
      return Promise.reject({ error })
    }
  }
}

export default AudioClassifier
