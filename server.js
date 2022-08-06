/* https://github.com/SashiDo/teachablemachine-node#expressjs */
import express from 'express'
import ImageTeachableMachine from './imageclassifier.js'
import AudioTeachableMachine from './audioclassifier.js'


const modelImage = new ImageTeachableMachine({
  modelUrl: "https://teachablemachine.withgoogle.com/models/r6BBk-hiN/"
})

const AUDIO_MODEL_NAME = "mtt-musicnn-1"
const modelAudio = new AudioTeachableMachine({
  modelUrl: `./${AUDIO_MODEL_NAME}/model.json`
})

const app = express()
const port = 3000


app.get("/image/classify", async (req, res) => {
  const { url } = req.query  
  return modelImage.classify({
    imageUrl: url,
  }).then((predictions) => {
    console.log(predictions)
    return res.json(predictions)
  }).catch((e) => {
    console.error(e)
    res.status(500).send(e)
  })
})


app.get("/audio/classify", async (req, res) => {
  const { url } = req.query  
  return modelAudio.classify({
    audioUrl: url,
  }).then((predictions) => {    
    predictions.model = AUDIO_MODEL_NAME
    console.log(predictions)
    return res.json(predictions)
  }).catch((e) => {
    console.error(e)
    res.status(500).send(e)
  })
})


app.listen(port, () => {  
  console.log(`Example app listening at http://localhost:${port}`)
})

