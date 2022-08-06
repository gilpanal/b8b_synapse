/* https://github.com/SashiDo/teachablemachine-node#expressjs */
import express from 'express';
import ImageTeachableMachine from './imageclassifier.js';
import AudioTeachableMachine from './audioclassifier.js';


const modelImage = new ImageTeachableMachine({
  modelUrl: "https://teachablemachine.withgoogle.com/models/r6BBk-hiN/"
});

// Whistle (Teachable Machine) : https://teachablemachine.withgoogle.com/models/I2PwGikt2/
const modelAudio = new AudioTeachableMachine({
  modelUrl: "./mtt-musicnn-1/model.json"
});

const app = express();
const port = 3000;


app.get("/image/classify", async (req, res) => {
  const { url } = req.query;  
  return modelImage.classify({
    imageUrl: url,
  }).then((predictions) => {
    console.log(predictions);
    return res.json(predictions);
  }).catch((e) => {
    console.error(e);
    res.status(500).send(e)
  });
});


app.get("/audio/classify", async (req, res) => {
  const { url } = req.query;  
  return modelAudio.classify({
    audioUrl: url,
  }).then((predictions) => {
    console.log(predictions);
    return res.json(predictions);
  }).catch((e) => {
    console.error(e);
    res.status(500).send(e)
  });
});


app.listen(port, () => {  
  console.log(`Example app listening at http://localhost:${port}`);
});

